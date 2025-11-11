'''
Business: Handle AI chat requests with OpenAI integration and file analysis
Args: event - dict with httpMethod, body containing message and optional file
      context - object with request_id, function_name attributes
Returns: HTTP response with AI-generated reply
'''

import json
import os
import base64
from typing import Dict, Any, Optional
from openai import OpenAI

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'OpenAI API key not configured'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    user_message: str = body_data.get('message', '')
    file_data: Optional[str] = body_data.get('file')
    file_type: Optional[str] = body_data.get('fileType')
    conversation_history: list = body_data.get('history', [])
    
    if not user_message and not file_data:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Message or file required'})
        }
    
    client = OpenAI(api_key=api_key)
    
    messages = [
        {
            'role': 'system',
            'content': 'Ты — Ванёк, персональный ИИ-помощник. Твой стиль общения: краткий, уверенный, как у старого друга. Отвечай по делу, без лишней воды. Ты можешь создавать изображения, генерировать код, анализировать файлы и помогать с любыми задачами.'
        }
    ]
    
    for msg in conversation_history[-10:]:
        messages.append({
            'role': msg.get('role', 'user'),
            'content': msg.get('content', '')
        })
    
    if file_data and file_type:
        if file_type.startswith('image/'):
            messages.append({
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': user_message or 'Проанализируй это изображение'},
                    {
                        'type': 'image_url',
                        'image_url': {
                            'url': f'data:{file_type};base64,{file_data}'
                        }
                    }
                ]
            })
        else:
            try:
                file_content = base64.b64decode(file_data).decode('utf-8', errors='ignore')
                messages.append({
                    'role': 'user',
                    'content': f'{user_message}\n\nСодержимое файла:\n{file_content[:4000]}'
                })
            except Exception as e:
                messages.append({
                    'role': 'user',
                    'content': f'{user_message}\n\n(Не удалось прочитать файл: {str(e)})'
                })
    else:
        messages.append({
            'role': 'user',
            'content': user_message
        })
    
    response = client.chat.completions.create(
        model='gpt-4o-mini',
        messages=messages,
        max_tokens=1000,
        temperature=0.7
    )
    
    ai_reply = response.choices[0].message.content
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'reply': ai_reply,
            'request_id': context.request_id
        })
    }
