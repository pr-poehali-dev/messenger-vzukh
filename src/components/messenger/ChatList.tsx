import { useState } from 'react';
import { CHATS, Chat } from './data';
import Icon from '@/components/ui/icon';

interface ChatListProps {
  title: string;
  filterType?: Chat['type'] | Chat['type'][];
  selectedId?: string;
  onSelect: (chat: Chat) => void;
  onNewChat?: () => void;
}

export default function ChatList({ title, filterType, selectedId, onSelect, onNewChat }: ChatListProps) {
  const [search, setSearch] = useState('');

  const filtered = CHATS.filter(c => {
    const typeMatch = !filterType || (Array.isArray(filterType) ? filterType.includes(c.type) : c.type === filterType);
    const searchMatch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return typeMatch && searchMatch;
  });

  return (
    <div className="w-72 h-screen flex flex-col border-r border-border bg-card shrink-0">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
          >
            <Icon name="Plus" size={16} className="text-primary" />
          </button>
        )}
      </div>

      <div className="px-3 pb-3">
        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full h-9 bg-secondary rounded-xl pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
            <Icon name="Inbox" size={32} />
            <span>Ничего не найдено</span>
          </div>
        )}
        {filtered.map(chat => (
          <button
            key={chat.id}
            onClick={() => onSelect(chat)}
            className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-secondary transition-colors text-left ${selectedId === chat.id ? 'bg-primary/10' : ''}`}
          >
            <div className="relative shrink-0">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-semibold ${
                chat.type === 'secret' ? 'bg-green-500/20 text-green-400' :
                chat.type === 'channel' ? 'bg-blue-500/20 text-blue-400' :
                chat.type === 'group' ? 'bg-purple-500/20 text-purple-400' :
                'bg-primary/20 text-primary'
              }`}>
                {chat.avatar}
              </div>
              {chat.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                  {chat.name}
                  {chat.type === 'secret' && <Icon name="Lock" size={11} className="text-green-400 shrink-0" />}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">{chat.time}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-muted-foreground truncate">{chat.lastMessage}</span>
                {chat.unread > 0 && (
                  <span className="ml-1 min-w-5 h-5 bg-primary text-white text-[10px] rounded-full flex items-center justify-center px-1 shrink-0">
                    {chat.unread > 99 ? '99+' : chat.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
