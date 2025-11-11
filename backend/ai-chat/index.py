import json
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Обрабатывает чат-запросы через бесплатный Groq API
    Args: event - dict с httpMethod, body (message, history, image)
          context - объект с request_id
    Returns: HTTP response dict с ответом от AI
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body = json.loads(event.get('body', '{}'))
    message: str = body.get('message', '')
    history: List[Dict[str, str]] = body.get('history', [])
    image: str = body.get('image', None)
    file_data: str = body.get('file', None)
    file_name: str = body.get('fileName', '')
    file_type: str = body.get('fileType', '')
    
    if not message:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Message required'}),
            'isBase64Encoded': False
        }
    
    import requests
    
    messages = [
        {"role": "system", "content": "Ты Ванёк - дружелюбный русскоязычный AI-помощник. Отвечай кратко, полезно и по-дружески на русском языке."}
    ]
    
    for msg in history[-10:]:
        messages.append({
            "role": msg.get('role', 'user'),
            "content": msg.get('content', '')
        })
    
    messages.append({"role": "user", "content": message})
    
    try:
        has_file_mention = '[Пользователь прикрепил' in message
        audio_analysis = None
        
        # Анализируем аудио если прикрепили
        if file_data and file_type.startswith('audio/'):
            try:
                import base64
                import io
                import wave
                import struct
                
                # Декодируем base64
                audio_bytes = base64.b64decode(file_data.split(',')[1] if ',' in file_data else file_data)
                
                # Базовый анализ WAV
                if file_type == 'audio/wav' or file_name.endswith('.wav'):
                    wav_io = io.BytesIO(audio_bytes)
                    with wave.open(wav_io, 'rb') as wav:
                        frames = wav.getnframes()
                        rate = wav.getframerate()
                        channels = wav.getnchannels()
                        sampwidth = wav.getsampwidth()
                        duration = frames / float(rate)
                        
                        # Читаем сэмплы для анализа громкости
                        wav_io.seek(0)
                        wav.rewind()
                        samples = wav.readframes(frames)
                        
                        # Анализ пиковых значений
                        if sampwidth == 2:  # 16-bit
                            sample_array = struct.unpack(f'{frames * channels}h', samples)
                            max_sample = max(abs(s) for s in sample_array)
                            avg_sample = sum(abs(s) for s in sample_array) / len(sample_array)
                            peak_db = 20 * (max_sample / 32768) if max_sample > 0 else -96
                            avg_db = 20 * (avg_sample / 32768) if avg_sample > 0 else -96
                        else:
                            peak_db = avg_db = 0
                        
                        audio_analysis = {
                            'duration': round(duration, 2),
                            'sample_rate': rate,
                            'channels': 'stereo' if channels == 2 else 'mono',
                            'bit_depth': sampwidth * 8,
                            'peak_db': round(peak_db, 2),
                            'avg_db': round(avg_db, 2)
                        }
                else:
                    # Для других форматов - базовая инфа
                    audio_analysis = {
                        'format': file_type,
                        'size_kb': round(len(audio_bytes) / 1024, 2)
                    }
            except Exception as e:
                audio_analysis = {'error': f'Не удалось проанализировать: {str(e)}'}
        
        system_instructions = "Ты Ванёк - дружелюбный русскоязычный AI-помощник. Отвечай кратко и по делу."
        
        if has_file_mention and image:
            system_instructions += "\n\n⚠️ КРИТИЧЕСКИ ВАЖНО: Изображение УЖЕ ЗАГРУЖЕНО! Ты его ВИДИШЬ. Анализируй и отвечай."
        elif has_file_mention and audio_analysis:
            system_instructions += f"\n\n⚠️ АУДИО ФАЙЛ УЖЕ ПРОАНАЛИЗИРОВАН!\n\nТехнические данные аудио:\n{json.dumps(audio_analysis, ensure_ascii=False, indent=2)}\n\nТеперь дай профессиональную оценку на основе этих параметров. НЕ проси файл снова - все данные у тебя есть!"
        elif has_file_mention:
            system_instructions += "\n\n⚠️ Файл прикреплён, но я могу анализировать только изображения и аудио. Помогу чем смогу!"
        
        prompt = f"{system_instructions}\n\n"
        
        for msg in history[-5:]:
            role = "Пользователь" if msg.get('role') == 'user' else "Ванёк"
            prompt += f"{role}: {msg.get('content', '')}\n"
        
        prompt += f"Пользователь: {message}\nВанёк:"
        
        response = requests.post(
            'https://text.pollinations.ai/',
            json={
                'messages': [{"role": "user", "content": prompt}],
                'model': 'openai'
            },
            timeout=30
        )
        
        if response.status_code != 200:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'AI error: {response.text}'}),
                'isBase64Encoded': False
            }
        
        ai_response = response.text.strip()
        
        if not ai_response or len(ai_response) < 3:
            ai_response = "Понял! Чем могу помочь?"
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'response': ai_response}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Request failed: {str(e)}'}),
            'isBase64Encoded': False
        }