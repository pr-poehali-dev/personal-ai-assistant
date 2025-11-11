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
        
        system_instructions = "Ты Ванёк - дружелюбный русскоязычный AI-помощник."
        
        if has_file_mention and image:
            system_instructions += "\n\nКРИТИЧЕСКИ ВАЖНО: Пользователь УЖЕ ПРИКРЕПИЛ файл! Ты его ВИДИШЬ. НЕ проси прикрепить файл снова. Анализируй содержимое и отвечай на вопрос пользователя."
        elif has_file_mention:
            system_instructions += "\n\nВНИМАНИЕ: Пользователь прикрепил файл (не изображение). Ты видишь название и тип файла. НЕ проси прикрепить файл снова. Расскажи что знаешь об этом типе файлов или попроси подробнее описать задачу."
        
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