import json
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Обрабатывает чат-запросы к бесплатному AI (HuggingFace)
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
    
    if not message:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Message required'}),
            'isBase64Encoded': False
        }
    
    import requests
    
    conversation = ""
    for msg in history[-5:]:
        role = "Пользователь" if msg.get('role') == 'user' else "Ассистент"
        conversation += f"{role}: {msg.get('content', '')}\n"
    
    conversation += f"Пользователь: {message}\nАссистент:"
    
    try:
        response = requests.post(
            'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
            headers={'Content-Type': 'application/json'},
            json={
                'inputs': conversation,
                'parameters': {
                    'max_length': 200,
                    'temperature': 0.8,
                    'top_p': 0.9
                }
            },
            timeout=30
        )
        
        if response.status_code == 503:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'response': 'Привет! Я Ванёк. Сейчас немного загружен, но готов помочь! Чем могу быть полезен?'}),
                'isBase64Encoded': False
            }
        
        if response.status_code != 200:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'response': f'Понял ваш вопрос про "{message}". Я Ванёк, ваш помощник! Сейчас работаю в режиме без внешних API. Чем ещё могу помочь?'}),
                'isBase64Encoded': False
            }
        
        result = response.json()
        
        if isinstance(result, list) and len(result) > 0:
            ai_response = result[0].get('generated_text', '')
            ai_response = ai_response.split('Ассистент:')[-1].strip()
        else:
            ai_response = f'Отвечаю на "{message[:50]}...": Я понял ваш вопрос. Сейчас работаю без ключей API, но готов помочь с простыми задачами!'
        
        if not ai_response or len(ai_response) < 3:
            ai_response = 'Понял! Чем ещё могу помочь?'
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'response': ai_response}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'response': f'Привет! Я Ванёк. Вы написали: "{message}". Готов помочь с простыми задачами!'}),
            'isBase64Encoded': False
        }
