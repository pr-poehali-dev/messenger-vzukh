const FUNC = {
  auth: 'https://functions.poehali.dev/7813ee99-e6ce-4441-96c8-77db9b7256c1',
  chats: 'https://functions.poehali.dev/e47a66b0-2b64-4110-95f1-67bf827a5ed6',
  messages: 'https://functions.poehali.dev/31e433c8-9bd7-42a9-92f2-400d8e92c139',
  calls: 'https://functions.poehali.dev/72f70359-d823-4577-b5c2-844b5bca8f66',
};

function getToken(): string {
  return localStorage.getItem('vzuh_token') || '';
}

async function post(url: string, body: object) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

async function get(url: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${url}${qs ? '?' + qs : ''}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const api = {
  auth: {
    register: (username: string, display_name: string, password: string) =>
      post(FUNC.auth, { action: 'register', username, display_name, password }),
    login: (username: string, password: string) =>
      post(FUNC.auth, { action: 'login', username, password }),
    logout: () => post(FUNC.auth, { action: 'logout' }),
    me: () => get(FUNC.auth, { action: 'me' }),
    searchUsers: (q: string) => get(FUNC.auth, { action: 'users', q }),
  },
  chats: {
    list: () => get(FUNC.chats, { action: 'list' }),
    create: (type: string, name: string, description: string, member_ids: number[]) =>
      post(FUNC.chats, { action: 'create', type, name, description, member_ids }),
    personal: (user_id: number) => post(FUNC.chats, { action: 'personal', user_id }),
    members: (chat_id: number) => get(FUNC.chats, { action: 'members', chat_id: String(chat_id) }),
  },
  messages: {
    list: (chat_id: number) => get(FUNC.messages, { chat_id: String(chat_id) }),
    send: (chat_id: number, text: string) => post(FUNC.messages, { chat_id, text }),
  },
  calls: {
    initiate: (callee_id: number, call_type: string, offer_sdp: string) =>
      post(FUNC.calls, { action: 'initiate', callee_id, call_type, offer_sdp }),
    answer: (call_id: number, answer_sdp: string) =>
      post(FUNC.calls, { action: 'answer', call_id, answer_sdp }),
    ice: (call_id: number, candidate: string) =>
      post(FUNC.calls, { action: 'ice', call_id, candidate }),
    getIce: (call_id: number, since_id: number) =>
      get(FUNC.calls, { action: 'ice_get', call_id: String(call_id), since_id: String(since_id) }),
    end: (call_id: number) => post(FUNC.calls, { action: 'end', call_id }),
    decline: (call_id: number) => post(FUNC.calls, { action: 'decline', call_id }),
    pending: () => get(FUNC.calls, { action: 'pending' }),
    status: (call_id: number) => get(FUNC.calls, { action: 'status', call_id: String(call_id) }),
  },
};

export interface User {
  user_id: number;
  username: string;
  display_name: string;
  avatar_initials: string;
  bio?: string;
  token?: string;
}

export interface ChatItem {
  id: number;
  type: 'personal' | 'group' | 'channel' | 'secret';
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  role: string;
  description: string;
}

export interface MessageItem {
  id: number;
  text: string;
  from: 'me' | 'other';
  sender_id: number;
  sender_name: string;
  sender_avatar: string;
  time: string;
  encrypted: boolean;
  status: string;
}
