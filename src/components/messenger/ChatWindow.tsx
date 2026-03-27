import { useState, useRef, useEffect } from 'react';
import { Chat, MESSAGES, Message } from './data';
import Icon from '@/components/ui/icon';

interface ChatWindowProps {
  chat: Chat | null;
}

export default function ChatWindow({ chat }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat) {
      setMessages(MESSAGES[chat.id] || []);
    }
  }, [chat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim() || !chat) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      text: input.trim(),
      time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
      from: 'me',
      status: 'sent',
      encrypted: true,
    };
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
          <Icon name="MessageCircle" size={40} className="text-primary/60" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Выберите чат</p>
          <p className="text-sm mt-1">Все сообщения защищены сквозным шифрованием</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full">
          <Icon name="Lock" size={12} />
          <span>E2E шифрование активно</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen animate-fade-in">
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card/50">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold ${
          chat.type === 'secret' ? 'bg-green-500/20 text-green-400' :
          chat.type === 'channel' ? 'bg-blue-500/20 text-blue-400' :
          chat.type === 'group' ? 'bg-purple-500/20 text-purple-400' :
          'bg-primary/20 text-primary'
        }`}>
          {chat.avatar}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            {chat.name}
            {chat.type === 'secret' && <Icon name="Lock" size={12} className="text-green-400" />}
          </p>
          <p className="text-xs text-muted-foreground">
            {chat.online ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full pulse-dot inline-block" />
                в сети
              </span>
            ) : chat.type === 'channel' ? 'канал' : chat.type === 'group' ? 'группа' : 'был(а) недавно'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors" title="Аудио звонок">
            <Icon name="Phone" size={16} className="text-muted-foreground" />
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors" title="Видео звонок">
            <Icon name="Video" size={16} className="text-muted-foreground" />
          </button>
          <button className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
            <Icon name="MoreVertical" size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Encryption banner */}
      {chat.type === 'secret' && (
        <div className="flex items-center justify-center gap-2 py-2 bg-green-500/5 border-b border-green-500/20 text-green-400 text-xs">
          <Icon name="ShieldCheck" size={13} />
          <span>Секретный чат — сквозное шифрование</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2 opacity-50">
            <Icon name="MessageSquare" size={24} />
            <span>Начните диалог</span>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[70%] px-3 py-2 text-sm ${msg.from === 'me' ? 'msg-bubble-out' : 'msg-bubble-in'}`}>
              <p>{msg.text}</p>
              <div className={`flex items-center gap-1 mt-1 ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                {msg.encrypted && <Icon name="Lock" size={9} className={msg.from === 'me' ? 'text-white/60' : 'text-muted-foreground'} />}
                <span className={`text-[10px] ${msg.from === 'me' ? 'text-white/70' : 'text-muted-foreground'}`}>{msg.time}</span>
                {msg.from === 'me' && (
                  <Icon
                    name={msg.status === 'read' ? 'CheckCheck' : 'Check'}
                    size={11}
                    className={msg.status === 'read' ? 'text-white' : 'text-white/60'}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {chat.type !== 'channel' && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 bg-secondary rounded-2xl px-3 py-2">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Paperclip" size={18} />
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Сообщение..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              onMouseDown={() => setIsRecording(true)}
              onMouseUp={() => setIsRecording(false)}
            >
              <Icon name={isRecording ? 'MicOff' : 'Mic'} size={18} className={isRecording ? 'text-destructive' : ''} />
            </button>
            {input.trim() && (
              <button
                onClick={send}
                className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <Icon name="Send" size={15} className="text-white" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
