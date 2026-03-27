"""Управление чатами: список чатов, создание группы/канала, личный чат, участники."""
import json
import os
import secrets
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

        action = body.get('action', '') if method == 'POST' else qp.get('action', 'list')

        # GET action=list — список чатов
        if method == 'GET' and action == 'list':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT c.id, c.type, c.name, c.avatar_initials, c.description,
                           m.body AS last_message, m.sent_at AS last_time,
                           cm.role
                    FROM chats c
                    JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = %s
                    LEFT JOIN LATERAL (
                        SELECT body, sent_at FROM messages WHERE chat_id = c.id AND is_removed = FALSE ORDER BY sent_at DESC LIMIT 1
                    ) m ON TRUE
                    ORDER BY COALESCE(m.sent_at, c.created_at) DESC
                """, (me['id'],))
                chats = cur.fetchall()

            result = []
            for ch in chats:
                result.append({
                    'id': ch['id'],
                    'type': ch['type'],
                    'name': ch['name'],
                    'avatar': ch['avatar_initials'],
                    'lastMessage': ch['last_message'] or '',
                    'time': ch['last_time'].strftime('%H:%M') if ch['last_time'] else '',
                    'unread': 0,
                    'role': ch['role'],
                    'description': ch['description'] or '',
                })
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(result)}

        # GET action=members&chat_id=X
        if method == 'GET' and action == 'members':
            chat_id = qp.get('chat_id')
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT u.id, u.username, u.display_name, u.avatar_initials, u.is_online, cm.role
                    FROM chat_members cm JOIN users u ON u.id = cm.user_id
                    WHERE cm.chat_id = %s
                """, (chat_id,))
                members = cur.fetchall()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps([dict(m) for m in members])}

        # POST action=create — создать группу/канал
        if method == 'POST' and action == 'create':
            chat_type = body.get('type', 'group')
            name = body.get('name', '').strip()
            description = body.get('description', '').strip()
            member_ids = body.get('member_ids', [])

            if not name:
                return {'statusCode': 400, 'headers': cors(), 'body': json.dumps({'error': 'Укажите название'})}

            initials = ''.join([w[0].upper() for w in name.split()[:2]])
            invite_link = secrets.token_hex(8) if chat_type in ('group', 'channel') else None

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "INSERT INTO chats (type, name, description, avatar_initials, created_by, invite_link) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                    (chat_type, name, description, initials, me['id'], invite_link)
                )
                chat_id = cur.fetchone()['id']
                cur.execute("INSERT INTO chat_members (chat_id, user_id, role) VALUES (%s,%s,'owner')", (chat_id, me['id']))
                for uid in member_ids:
                    if uid != me['id']:
                        cur.execute("INSERT INTO chat_members (chat_id, user_id, role) VALUES (%s,%s,'member') ON CONFLICT DO NOTHING", (chat_id, int(uid)))
            conn.commit()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({'chat_id': chat_id, 'invite_link': invite_link})}

        # POST action=personal — создать личный чат
        if method == 'POST' and action == 'personal':
            other_id = body.get('user_id')
            if not other_id:
                return {'statusCode': 400, 'headers': cors(), 'body': json.dumps({'error': 'Нет user_id'})}

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT c.id FROM chats c
                    JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = %s
                    JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = %s
                    WHERE c.type = 'personal' LIMIT 1
                """, (me['id'], other_id))
                existing = cur.fetchone()
                if existing:
                    return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({'chat_id': existing['id']})}

                cur.execute("SELECT display_name, avatar_initials FROM users WHERE id = %s", (other_id,))
                other = cur.fetchone()
                if not other:
                    return {'statusCode': 404, 'headers': cors(), 'body': json.dumps({'error': 'Пользователь не найден'})}

                cur.execute(
                    "INSERT INTO chats (type, name, avatar_initials, created_by) VALUES ('personal',%s,%s,%s) RETURNING id",
                    (other['display_name'], other['avatar_initials'], me['id'])
                )
                chat_id = cur.fetchone()['id']
                cur.execute("INSERT INTO chat_members (chat_id, user_id, role) VALUES (%s,%s,'member')", (chat_id, me['id']))
                cur.execute("INSERT INTO chat_members (chat_id, user_id, role) VALUES (%s,%s,'member')", (chat_id, int(other_id)))
            conn.commit()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({'chat_id': chat_id})}

        return {'statusCode': 400, 'headers': cors(), 'body': json.dumps({'error': 'Неизвестный action'})}

    finally:
        conn.close()
