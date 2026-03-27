import { useState } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface SearchUser {
  id: number;
  username: string;
  display_name: string;
  avatar_initials: string;
}

interface Props {
  type: 'group' | 'channel';
  onClose: () => void;
  onCreated: (chatId: number) => void;
}

export default function CreateChatModal({ type, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selected, setSelected] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);

  const doSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const users = await api.auth.searchUsers(q);
      setSearchResults(users.filter((u: SearchUser) => !selected.find(s => s.id === u.id)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const toggleUser = (u: SearchUser) => {
    if (selected.find(s => s.id === u.id)) {
      setSelected(prev => prev.filter(s => s.id !== u.id));
    } else {
      setSelected(prev => [...prev, u]);
    }
    setSearch('');
    setSearchResults([]);
  };

  const create = async () => {
    if (!name.trim()) { setError('Введите название'); return; }
    setLoading(true);
    setError('');
    try {
      const memberIds = type === 'group' ? selected.map(u => u.id) : [];
      const res = await api.chats.create(type, name.trim(), description.trim(), memberIds);
      onCreated(res.chat_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${type === 'channel' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
              <Icon name={type === 'channel' ? 'Radio' : 'Users'} size={18} className={type === 'channel' ? 'text-blue-400' : 'text-purple-400'} />
            </div>
            <h3 className="font-semibold">{type === 'channel' ? 'Новый канал' : 'Новая группа'}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
            <Icon name="X" size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Название *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={type === 'channel' ? 'Мой канал' : 'Моя группа'}
              className="w-full h-11 bg-secondary rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Описание</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="О чём этот чат..."
              className="w-full h-11 bg-secondary rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {type === 'group' && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Добавить участников</label>

              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selected.map(u => (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u)}
                      className="flex items-center gap-1.5 bg-primary/15 text-primary text-xs px-2 py-1 rounded-full hover:bg-destructive/15 hover:text-destructive transition-colors"
                    >
                      <span>{u.display_name}</span>
                      <Icon name="X" size={11} />
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => doSearch(e.target.value)}
                  placeholder="Поиск пользователей..."
                  className="w-full h-10 bg-secondary rounded-xl pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>

              {searching && <p className="text-xs text-muted-foreground mt-2 px-1">Поиск...</p>}

              {searchResults.length > 0 && (
                <div className="mt-2 bg-secondary rounded-xl overflow-hidden">
                  {searchResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-border transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {u.avatar_initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.display_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">@{u.username}</p>
                      </div>
                      <Icon name="Plus" size={14} className="text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-destructive text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={14} />
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-border">
          <button onClick={onClose} className="flex-1 h-11 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors">
            Отмена
          </button>
          <button
            onClick={create}
            disabled={loading || !name.trim()}
            className="flex-1 h-11 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <>{type === 'channel' ? 'Создать канал' : 'Создать группу'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
