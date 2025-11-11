import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Сохраняет сообщения диалога в базу данных
    Args: event - dict с httpMethod, body (sessionId, messageId, sender, text, hasFile, fileName, imageUrl)
          context - объект с request_id
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        session_id = body.get('sessionId')
        message_id = body.get('messageId')
        sender = body.get('sender')
        text = body.get('text')
        has_file = body.get('hasFile', False)
        file_name = body.get('fileName')
        image_url = body.get('imageUrl')
        
        if not all([session_id, message_id, sender, text]):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }
        
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Database not configured'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        cur.execute(
            "INSERT INTO conversations (session_id, message_id, sender, text, has_file, file_name, image_url) VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT (message_id) DO NOTHING",
            (session_id, message_id, sender, text, has_file, file_name, image_url)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'messageId': message_id}),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        session_id = params.get('sessionId')
        
        if not session_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'sessionId required'}),
                'isBase64Encoded': False
            }
        
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Database not configured'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        cur.execute(
            "SELECT message_id, sender, text, has_file, file_name, image_url, created_at FROM conversations WHERE session_id = %s ORDER BY created_at ASC",
            (session_id,)
        )
        
        rows = cur.fetchall()
        messages = []
        
        for row in rows:
            messages.append({
                'id': row[0],
                'sender': row[1],
                'text': row[2],
                'hasFile': row[3],
                'fileName': row[4],
                'imageUrl': row[5],
                'timestamp': row[6].isoformat() if row[6] else None
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'messages': messages}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
