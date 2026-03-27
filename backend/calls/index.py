"""WebRTC звонки: инициировать, ответить, ICE-кандидаты, завершить, входящий звонок."""
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

        action = body.get('action', '') if method == 'POST' else qp.get('action', '')

        # POST action=initiate — начать звонок
        if method == 'POST' and action == 'initiate':
            callee_id = body.get('callee_id')
            call_type = body.get('call_type', 'audio')
            offer_sdp = body.get('offer_sdp', '')
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "INSERT INTO calls (caller_id, callee_id, call_type, offer_sdp, status) VALUES (%s,%s,%s,%s,'pending') RETURNING id",
                    (me['id'], callee_id, call_type, offer_sdp)
                )
                call_id = cur.fetchone()['id']
            conn.commit()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({'call_id': call_id})}

        # POST action=answer
        if method == 'POST' and action == 'answer':
            call_id = body.get('call_id')
            answer_sdp = body.get('answer_sdp', '')
            with conn.cursor() as cur:
                cur.execute("UPDATE calls SET answer_sdp = %s, status = 'active' WHERE id = %s AND callee_id = %s", (answer_sdp, call_id, me['id']))
            conn.commit()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({'ok': True})}

        # POST action=ice
        if method == 'POST' and action == 'ice':
            call_id = body.get('call_id')
            candidate = body.get('candidate', '')
            with conn.cursor() as cur:
                cur.execute("INSERT INTO call_ice_candidates (call_id, user_id, candidate) VALUES (%s,%s,%s)", (call_id, me['id'], candidate))
            conn.commit()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({'ok': True})}

        # POST action=end
        if method == 'POST' and action == 'end':
            call_id = body.get('call_id')
            with conn.cursor() as cur:
                cur.execute("UPDATE calls SET status = 'ended', ended_at = NOW() WHERE id = %s", (call_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({'ok': True})}

        # POST action=decline
        if method == 'POST' and action == 'decline':
            call_id = body.get('call_id')
            with conn.cursor() as cur:
                cur.execute("UPDATE calls SET status = 'declined', ended_at = NOW() WHERE id = %s", (call_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps({'ok': True})}

        # GET action=pending — входящий звонок
        if method == 'GET' and action == 'pending':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT c.id, c.call_type, c.offer_sdp, c.caller_id,
                           u.display_name AS caller_name, u.avatar_initials AS caller_avatar
                    FROM calls c JOIN users u ON u.id = c.caller_id
                    WHERE c.callee_id = %s AND c.status = 'pending'
                    ORDER BY c.started_at DESC LIMIT 1
                """, (me['id'],))
                call = cur.fetchone()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(dict(call) if call else None)}

        # GET action=status&call_id=X
        if method == 'GET' and action == 'status':
            call_id = qp.get('call_id')
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id, status, answer_sdp FROM calls WHERE id = %s", (call_id,))
                call = cur.fetchone()
            if call:
                return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(dict(call))}
            return {'statusCode': 404, 'headers': cors(), 'body': json.dumps({'error': 'Не найден'})}

        # GET action=ice_get&call_id=X&since_id=Y
        if method == 'GET' and action == 'ice_get':
            call_id = qp.get('call_id')
            since_id = int(qp.get('since_id', 0))
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, user_id, candidate FROM call_ice_candidates WHERE call_id = %s AND user_id != %s AND id > %s ORDER BY id",
                    (call_id, me['id'], since_id)
                )
                cands = cur.fetchall()
            return {'statusCode': 200, 'headers': cors(), 'body': json.dumps([dict(c) for c in cands])}

        return {'statusCode': 400, 'headers': cors(), 'body': json.dumps({'error': 'Неизвестный action'})}

    finally:
        conn.close()
