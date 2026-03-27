"""Авторизация: регистрация, вход, выход, получение профиля, поиск пользователей."""
import json
import os
import hashlib
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_user_from_token(conn, token: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id "
            "WHERE s.token = %s AND s.expires_at > NOW()",
            (token,)
        )
        return cur.fetchone()


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
    }


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    body = json.loads(event.get('body') or '{}')
    token = headers.get('X-Authorization', '').replace('Bearer ', '')
    action = body.get('action', '')
    qp = event.get('queryStringParameters') or {}

    conn = get_conn()
    try:
        # POST action=register
        if method == 'POST' and action == 'register':
            username = body.get('username', '').strip().lower()
            display_name = body.get('display_name', '').strip()
            password = body.get('password', '')

            if not username or not display_name or not password:
                return {'statusCode': 400, 'headers': cors(), 'body': json.dumps({'error': 'Заполните все поля'})}
            if len(password) < 6:
                return {'statusCode': 400, 'headers': cors(), 'body': json.dumps({'error': 'Пароль минимум 6 символов'})}

            initials = ''.join([w[0].upper() for w in display_name.split()[:2]])
            if not initials:
                initials = display_name[:2].upper()

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cur.fetchone():
                    return {'statusCode': 409, 'headers': cors(), 'body': json.dumps({'error': 'Имя пользователя занято'})}
                cur.execute(
                    "INSERT INTO users (username, display_name, password_hash, avatar_initials) VALUES (%s,%s,%s,%s) RETURNING id",
                    (username, display_name, hash_password(password), initials)
                )
                user_id = cur.fetchone()['id']
                t = secrets.token_hex(32)
                cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s,%s)", (user_id, t))
            conn.commit()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({
                'token': t, 'user_id': user_id, 'username': username,
                'display_name': display_name, 'avatar_initials': initials
            })}

        # POST action=login
        if method == 'POST' and action == 'login':
            username = body.get('username', '').strip().lower()
            password = body.get('password', '')
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM users WHERE username = %s AND password_hash = %s", (username, hash_password(password)))
                user = cur.fetchone()
                if not user:
                    return {'statusCode': 401, 'headers': cors(), 'body': json.dumps({'error': 'Неверный логин или пароль'})}
                t = secrets.token_hex(32)
                cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s,%s)", (user['id'], t))
                cur.execute("UPDATE users SET is_online = TRUE, last_seen_at = NOW() WHERE id = %s", (user['id'],))
            conn.commit()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({
                'token': t, 'user_id': user['id'], 'username': user['username'],
                'display_name': user['display_name'], 'avatar_initials': user['avatar_initials'], 'bio': user['bio']
            })}

        # POST action=logout
        if method == 'POST' and action == 'logout':
            with conn.cursor() as cur:
                cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
                row = cur.fetchone()
                if row:
                    cur.execute("UPDATE users SET is_online = FALSE WHERE id = %s", (row[0],))
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
            conn.commit()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({'ok': True})}

        # GET ?action=me
        if method == 'GET' and qp.get('action') == 'me':
            user = get_user_from_token(conn, token)
            if not user:
                return {'statusCode': 401, 'headers': cors(), 'body': json.dumps({'error': 'Не авторизован'})}
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({
                'user_id': user['id'], 'username': user['username'],
                'display_name': user['display_name'], 'avatar_initials': user['avatar_initials'],
                'bio': user['bio'], 'phone': user['phone']
            })}

        # GET ?action=users&q=query — поиск
        if method == 'GET' and qp.get('action') == 'users':
            me = get_user_from_token(conn, token)
            if not me:
                return {'statusCode': 401, 'headers': cors(), 'body': json.dumps({'error': 'Не авторизован'})}
            q = qp.get('q', '')
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, username, display_name, avatar_initials, is_online FROM users WHERE (username ILIKE %s OR display_name ILIKE %s) AND id != %s LIMIT 20",
                    (f'%{q}%', f'%{q}%', me['id'])
                )
                users = cur.fetchall()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps([dict(u) for u in users])}

        return {'statusCode': 400, 'headers': cors(), 'body': json.dumps({'error': 'Неизвестный action'})}

    finally:
        conn.close()
