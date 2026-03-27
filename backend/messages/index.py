"""Сообщения: получить историю и отправить."""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user_from_token(conn, token: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()",
            (token,)
        )
        return cur.fetchone()


def cors():
    return {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    body = json.loads(event.get('body') or '{}')
    token = headers.get('X-Authorization', '').replace('Bearer ', '')
    qp = event.get('queryStringParameters') or {}

    conn = get_conn()
    try:
        me = get_user_from_token(conn, token)
        if not me:
            return {'statusCode': 401, 'headers': cors(), 'body': json.dumps({'error': 'Не авторизован'})}

        # GET ?chat_id=X&limit=50&before_id=Y
        if method == 'GET':
            chat_id = qp.get('chat_id')
            limit = int(qp.get('limit', 50))
            before_id = qp.get('before_id')

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id FROM chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, me['id']))
                if not cur.fetchone():
                    return {'statusCode': 403, 'headers': cors(), 'body': json.dumps({'error': 'Нет доступа'})}

                if before_id:
                    cur.execute("""
                        SELECT m.id, m.sender_id, m.body AS text, m.sent_at, m.is_encrypted,
                               u.display_name AS sender_name, u.avatar_initials AS sender_avatar
                        FROM messages m LEFT JOIN users u ON u.id = m.sender_id
                        WHERE m.chat_id = %s AND m.is_removed = FALSE AND m.id < %s
                        ORDER BY m.sent_at DESC LIMIT %s
                    """, (chat_id, before_id, limit))
                else:
                    cur.execute("""
                        SELECT m.id, m.sender_id, m.body AS text, m.sent_at, m.is_encrypted,
                               u.display_name AS sender_name, u.avatar_initials AS sender_avatar
                        FROM messages m LEFT JOIN users u ON u.id = m.sender_id
                        WHERE m.chat_id = %s AND m.is_removed = FALSE
                        ORDER BY m.sent_at DESC LIMIT %s
                    """, (chat_id, limit))
                msgs = cur.fetchall()

            result = []
            for msg in reversed(msgs):
                result.append({
                    'id': msg['id'],
                    'text': msg['text'],
                    'from': 'me' if msg['sender_id'] == me['id'] else 'other',
                    'sender_id': msg['sender_id'],
                    'sender_name': msg['sender_name'],
                    'sender_avatar': msg['sender_avatar'],
                    'time': msg['sent_at'].strftime('%H:%M'),
                    'encrypted': msg['is_encrypted'],
                    'status': 'read',
                })
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(result)}

        # POST — отправить сообщение
        if method == 'POST':
            chat_id = body.get('chat_id')
            text = body.get('text', '').strip()

            if not chat_id or not text:
                return {'statusCode': 400, 'headers': cors(), 'body': json.dumps({'error': 'Нет chat_id или текста'})}

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id FROM chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, me['id']))
                if not cur.fetchone():
                    return {'statusCode': 403, 'headers': cors(), 'body': json.dumps({'error': 'Нет доступа'})}

                cur.execute(
                    "INSERT INTO messages (chat_id, sender_id, body) VALUES (%s,%s,%s) RETURNING id, sent_at",
                    (chat_id, me['id'], text)
                )
                row = cur.fetchone()
            conn.commit()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({
                'id': row['id'],
                'text': text,
                'from': 'me',
                'sender_id': me['id'],
                'sender_name': me['display_name'],
                'sender_avatar': me['avatar_initials'],
                'time': row['sent_at'].strftime('%H:%M'),
                'encrypted': True,
                'status': 'sent',
            })}

        return {'statusCode': 404, 'headers': cors(), 'body': json.dumps({'error': 'Not found'})}

    finally:
        conn.close()
