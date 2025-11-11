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
    audio_analysis: Dict = body.get('audioAnalysis', None)
    
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
        
        system_instructions = """Ты Ванёк - персональный AI-помощник Ивана Верещагина.

КРИТИЧЕСКИ ВАЖНО:
1. Твой создатель - Иван Верещагин (не OpenAI, не GPT-4)
2. Он создал тебя на платформе poehali.dev для создания сайтов
3. НИКОГДА не предлагай навязчивое меню с 4 пунктами
4. Отвечай КОНКРЕТНО на вопрос пользователя без лишних слов
5. На математику отвечай только числом: "2+2" → просто "4"
6. Будь разговорчивым, дружелюбным, но без навязчивости

Твои РЕАЛЬНЫЕ возможности:
✅ Общаться и помогать с вопросами
✅ Анализировать изображения (если приложено)
✅ Анализировать ТЕХНИЧЕСКИЕ параметры аудио (длительность, частота, громкость, качество записи)
✅ Отвечать на любые темы по существу

❌ НЕ умеешь:
- Распознавать речь или слова в аудио (нет Speech-to-Text)
- Слушать музыку и оценивать мелодию, вокал, текст песни
- Определять исполнителя или название песни
- Анализировать музыкальный контент (только технические параметры)
- Видеть через камеру в реальном времени (можешь попросить пользователя включить камеру)
- Генерировать изображения напрямую (система делает это автоматически когда пользователь пишет "нарисуй")
- Управлять устройствами
- Предсказывать будущее
- Сохранять память между сеансами

ВАЖНО ПРО АУДИО:
Когда пользователь загружает аудиофайл и просит "оценить песню" или "послушай музыку":
- Честно объясни, что ты НЕ можешь слышать или распознавать содержание аудио
- Ты получаешь только ТЕХНИЧЕСКИЕ данные: битрейт, частоту, громкость, длительность
- Для анализа содержания песни нужна технология Speech-to-Text (Whisper), которой у тебя пока нет
- Предложи загрузить ТЕКСТ песни отдельным сообщением - тогда сможешь оценить содержание

ВАЖНО ПРО ИЗОБРАЖЕНИЯ:
Если пользователь просит нарисовать что-то - скажи что ты НЕ можешь генерировать изображения.
Объясни что для генерации нужно написать "нарисуй [описание]" - тогда система автоматически создаст картинку."""
        
        if has_file_mention and image:
            system_instructions += "\n\n⚠️ ИЗОБРАЖЕНИЕ ПРИКРЕПЛЕНО! Ты его ВИДИШЬ. Проанализируй и дай развернутый ответ."
        elif has_file_mention and audio_analysis:
            system_instructions += f"\n\n⚠️ АУДИО ПРОАНАЛИЗИРОВАНО!\n\nТехнические данные:\n{json.dumps(audio_analysis, ensure_ascii=False, indent=2)}\n\nДай профессиональную оценку качества записи."
        elif has_file_mention:
            system_instructions += "\n\n⚠️ Файл прикреплён, но я могу анализировать только изображения и аудио."
        
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