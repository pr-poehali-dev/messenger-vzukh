import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/messenger/Sidebar';
import CallsView from '@/components/messenger/CallsView';
import ContactsView from '@/components/messenger/ContactsView';
import SettingsView from '@/components/messenger/SettingsView';
import ProfileView from '@/components/messenger/ProfileView';
import AdminPanel from '@/components/messenger/AdminPanel';
import AuthScreen from '@/components/messenger/AuthScreen';
import CreateChatModal from '@/components/messenger/CreateChatModal';
import CallScreen from '@/components/messenger/CallScreen';
import { api, User, ChatItem, MessageItem } from '@/lib/api';
import Icon from '@/components/ui/icon';

type Section = 'chats' | 'calls' | 'channels' | 'groups' | 'contacts' | 'settings' | 'profile' | 'admin';

interface IncomingCall {
  id: number;
  call_type: 'audio' | 'video';
  offer_sdp: string;
  caller_id: number;
  caller_name: string;
  caller_avatar: string;
}

interface ActiveCall {
  callId: number;
  callerName: string;
  callerAvatar: string;
  callType: 'audio' | 'video';
  isIncoming: boolean;
  offerSdp?: string;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [section, setSection] = useState<Section>('chats');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [createModal, setCreateModal] = useState<'group' | 'channel' | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const callPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('vzuh_token');
    if (token) {
      api.auth.me()
        .then(u => setUser(u))
        .catch(() => localStorage.removeItem('vzuh_token'))
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const loadChats = useCallback(async () => {
    try {
      const list = await api.chats.list();
      setChats(list);
    } catch (_e) { /* ignore */ }
  }, []);

  useEffect(() => {
    if (user) loadChats();
  }, [user, loadChats]);

  useEffect(() => {
    if (!user) return;
    callPollRef.current = setInterval(async () => {
      try {
        const call = await api.calls.pending();
        if (call && !activeCall) setIncomingCall(call);
      } catch (_e) { /* ignore */ }
    }, 3000);
    return () => { if (callPollRef.current) clearInterval(callPollRef.current); };
  }, [user, activeCall]);

  const handleAuth = (u: User) => setUser(u);

  const startCall = (name: string, avatar: string, callType: 'audio' | 'video', calleeId: number) => {
    setActiveCall({ callId: calleeId, callerName: name, callerAvatar: avatar, callType, isIncoming: false });
  };

  const handleIncomingAccept = () => {
    if (!incomingCall) return;
    setActiveCall({
      callId: incomingCall.id, callerName: incomingCall.caller_name,
      callerAvatar: incomingCall.caller_avatar, callType: incomingCall.call_type,
      isIncoming: true, offerSdp: incomingCall.offer_sdp,
    });
    setIncomingCall(null);
  };

  const handleIncomingDecline = async () => {
    if (!incomingCall) return;
    await api.calls.decline(incomingCall.id).catch(() => { /* ignore */ });
    setIncomingCall(null);
  };

  const filteredChats = (types: ChatItem['type'][]) => chats.filter(c => types.includes(c.type));

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  const renderContent = () => {
    switch (section) {
      case 'chats':
        return (
          <>
            <RealChatList title="Чаты" items={filteredChats(['personal', 'secret'])} selectedId={selectedChat?.id} onSelect={setSelectedChat} onNew={() => {}} />
            <RealChatWindow chat={selectedChat} user={user} onStartCall={startCall} />
          </>
        );
      case 'calls':
        return <CallsView />;
      case 'channels':
        return (
          <>
            <RealChatList title="Каналы" items={filteredChats(['channel'])} selectedId={selectedChat?.id} onSelect={setSelectedChat} onNew={() => setCreateModal('channel')} />
            <RealChatWindow chat={selectedChat} user={user} onStartCall={startCall} />
          </>
        );
      case 'groups':
        return (
          <>
            <RealChatList title="Группы" items={filteredChats(['group'])} selectedId={selectedChat?.id} onSelect={setSelectedChat} onNew={() => setCreateModal('group')} />
            <RealChatWindow chat={selectedChat} user={user} onStartCall={startCall} />
          </>
        );
      case 'contacts':
        return (
          <ContactsView
            onStartCall={startCall}
            onChat={async (userId) => {
              const res = await api.chats.personal(userId);
              await loadChats();
              setSection('chats');
              setTimeout(() => {
                setSelectedChat(chats.find(c => c.id === res.chat_id) || null);
              }, 500);
            }}
          />
        );
      case 'settings':
        return <SettingsView onLogout={() => { localStorage.removeItem('vzuh_token'); setUser(null); }} />;
      case 'profile':
        return <ProfileView user={user} />;
      case 'admin':
        return <AdminPanel />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar active={section} onChange={(s) => { setSection(s); if (!['chats', 'channels', 'groups'].includes(s)) setSelectedChat(null); }} />
      <main className="flex flex-1 overflow-hidden">{renderContent()}</main>

      {createModal && (
        <CreateChatModal
          type={createModal}
          onClose={() => setCreateModal(null)}
          onCreated={async () => { setCreateModal(null); await loadChats(); }}
        />
      )}

      {activeCall && (
        <CallScreen
          callId={activeCall.callId}
          callerName={activeCall.callerName}
          callerAvatar={activeCall.callerAvatar}
          callType={activeCall.callType}
          isIncoming={activeCall.isIncoming}
          offerSdp={activeCall.offerSdp}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {incomingCall && !activeCall && (
        <div className="fixed bottom-6 right-6 z-40 bg-card border border-border rounded-2xl p-4 shadow-2xl w-72 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold">{incomingCall.caller_avatar}</div>
            <div>
              <p className="font-semibold text-sm">{incomingCall.caller_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon name={incomingCall.call_type === 'video' ? 'Video' : 'Phone'} size={11} />
                {incomingCall.call_type === 'video' ? 'Видеозвонок' : 'Аудиозвонок'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleIncomingDecline} className="flex-1 h-10 bg-destructive/15 text-destructive rounded-xl text-sm font-medium hover:bg-destructive/25 transition-colors flex items-center justify-center gap-1.5">
              <Icon name="PhoneOff" size={14} /> Отклонить
            </button>
            <button onClick={handleIncomingAccept} className="flex-1 h-10 bg-green-500/15 text-green-400 rounded-xl text-sm font-medium hover:bg-green-500/25 transition-colors flex items-center justify-center gap-1.5">
              <Icon name="Phone" size={14} /> Ответить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Real Chat List ───────────────────────────────────────────────────────────
function RealChatList({ title, items, selectedId, onSelect, onNew }: {
  title: string; items: ChatItem[]; selectedId?: number;
  onSelect: (c: ChatItem) => void; onNew: () => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-72 h-screen flex flex-col border-r border-border bg-card shrink-0">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        <button onClick={onNew} className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
          <Icon name="Plus" size={16} className="text-primary" />
        </button>
      </div>
      <div className="px-3 pb-3">
        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className="w-full h-9 bg-secondary rounded-xl pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
            <Icon name="Inbox" size={32} />
            <span>Пусто</span>
          </div>
        )}
        {filtered.map(chat => (
          <button key={chat.id} onClick={() => onSelect(chat)} className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-secondary transition-colors text-left ${selectedId === chat.id ? 'bg-primary/10' : ''}`}>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-semibold shrink-0 ${chat.type === 'secret' ? 'bg-green-500/20 text-green-400' : chat.type === 'channel' ? 'bg-blue-500/20 text-blue-400' : chat.type === 'group' ? 'bg-purple-500/20 text-purple-400' : 'bg-primary/20 text-primary'}`}>
              {chat.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-medium text-foreground truncate">{chat.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{chat.time}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-muted-foreground truncate">{chat.lastMessage || 'Нет сообщений'}</span>
                {chat.unread > 0 && <span className="ml-1 min-w-5 h-5 bg-primary text-white text-[10px] rounded-full flex items-center justify-center px-1 shrink-0">{chat.unread}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Real Chat Window ─────────────────────────────────────────────────────────
function RealChatWindow({ chat, user, onStartCall }: {
  chat: ChatItem | null; user: User;
  onStartCall: (name: string, avatar: string, type: 'audio' | 'video', calleeId: number) => void;
}) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async () => {
    if (!chat) return;
    try {
      const msgs = await api.messages.list(chat.id);
      setMessages(msgs);
    } catch (_e) { /* ignore */ }
  }, [chat]);

  useEffect(() => {
    setMessages([]);
    if (chat) {
      loadMessages();
      pollRef.current = setInterval(loadMessages, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [chat, loadMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !chat || loading) return;
    setLoading(true);
    try {
      const msg = await api.messages.send(chat.id, input.trim());
      setMessages(prev => [...prev, msg]);
      setInput('');
    } catch (_e) { /* ignore */ }
    setLoading(false);
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
          <Icon name="MessageCircle" size={40} className="text-primary/60" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Выберите чат</p>
          <p className="text-sm mt-1">Все сообщения защищены сквозным шифрованием</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full">
          <Icon name="Lock" size={12} /><span>E2E шифрование активно</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card/50 shrink-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold ${chat.type === 'secret' ? 'bg-green-500/20 text-green-400' : chat.type === 'channel' ? 'bg-blue-500/20 text-blue-400' : chat.type === 'group' ? 'bg-purple-500/20 text-purple-400' : 'bg-primary/20 text-primary'}`}>
          {chat.avatar}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{chat.name}</p>
          <p className="text-xs text-muted-foreground">{chat.type === 'channel' ? 'Канал' : chat.type === 'group' ? 'Группа' : chat.type === 'secret' ? '🔒 Секретный чат' : 'Личный чат'}</p>
        </div>
        {chat.type === 'personal' && (
          <div className="flex gap-1">
            <button onClick={() => onStartCall(chat.name, chat.avatar, 'audio', chat.id)} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
              <Icon name="Phone" size={16} className="text-muted-foreground" />
            </button>
            <button onClick={() => onStartCall(chat.name, chat.avatar, 'video', chat.id)} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
              <Icon name="Video" size={16} className="text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2 opacity-50">
            <Icon name="MessageSquare" size={24} /><span>Начните диалог</span>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-3 py-2 text-sm ${msg.from === 'me' ? 'msg-bubble-out' : 'msg-bubble-in'}`}>
              {msg.from === 'other' && msg.sender_name && <p className="text-xs font-semibold text-primary mb-1 opacity-80">{msg.sender_name}</p>}
              <p>{msg.text}</p>
              <div className={`flex items-center gap-1 mt-1 ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                {msg.encrypted && <Icon name="Lock" size={9} className={msg.from === 'me' ? 'text-white/60' : 'text-muted-foreground'} />}
                <span className={`text-[10px] ${msg.from === 'me' ? 'text-white/70' : 'text-muted-foreground'}`}>{msg.time}</span>
                {msg.from === 'me' && <Icon name="CheckCheck" size={11} className="text-white/60" />}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {chat.type !== 'channel' && (
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex items-center gap-2 bg-secondary rounded-2xl px-3 py-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Сообщение..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
            {input.trim() && (
              <button onClick={send} disabled={loading} className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50">
                <Icon name="Send" size={15} className="text-white" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

