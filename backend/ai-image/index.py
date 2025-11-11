import json
from typing import Dict, Any

def enhance_prompt_for_realism(user_prompt: str) -> str:
    '''
    Улучшает промпт пользователя для фотореалистичного результата
    '''
    base_quality = "RAW photo, 8k uhd, dslr, soft lighting, high quality, film grain, Fujifilm XT3, photorealistic, masterpiece, best quality"
    
    negative_terms = "(deformed iris, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime:1.4), text, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck"
    
    enhanced = f"{user_prompt}, {base_quality}"
    
    full_prompt = f"{enhanced} --negative {negative_terms}"
    
    return full_prompt

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Генерирует изображения через бесплатный Stable Diffusion
    Args: event - dict с httpMethod, body (prompt: string)
          context - объект с request_id
    Returns: HTTP response dict с base64 изображением
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
    user_prompt: str = body.get('prompt', '')
    
    if not user_prompt:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Prompt required'}),
            'isBase64Encoded': False
        }
    
    enhanced_prompt = enhance_prompt_for_realism(user_prompt)
    
    import requests
    import base64
    
    try:
        image_url = f'https://image.pollinations.ai/prompt/{requests.utils.quote(enhanced_prompt)}?width=1024&height=1024&nologo=true&enhance=true'
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'imageUrl': image_url}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Generation failed: {str(e)}'}),
            'isBase64Encoded': False
        }