import { useState } from 'react';
import Icon from '@/components/ui/icon';

export default function ProfileView() {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('Иван Петров');
  const [username, setUsername] = useState('@ivan_petrov');
  const [bio, setBio] = useState('Разработчик · Москва');

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto animate-fade-in">
      <div className="flex flex-col items-center pt-12 pb-6 px-6 border-b border-border">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-3xl bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold">
            ИП
          </div>
          <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors">
            <Icon name="Camera" size={14} className="text-white" />
          </button>
        </div>

        {editing ? (
          <div className="w-full max-w-xs space-y-2">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-10 bg-secondary rounded-xl px-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/40 text-center font-semibold"
            />
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full h-10 bg-secondary rounded-xl px-3 text-sm text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40 text-center font-mono"
            />
            <input
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full h-10 bg-secondary rounded-xl px-3 text-sm text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40 text-center"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 h-10 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Сохранить
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 h-10 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold">{name}</h2>
            <p className="text-sm text-muted-foreground font-mono mt-1">{username}</p>
            <p className="text-sm text-muted-foreground mt-1">{bio}</p>
            <button
              onClick={() => setEditing(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl text-sm text-foreground hover:bg-secondary/80 transition-colors"
            >
              <Icon name="Pencil" size={14} />
              Редактировать
            </button>
          </>
        )}
      </div>

      <div className="px-6 py-6 max-w-lg mx-auto w-full space-y-3">
        {[
          { icon: 'MessageCircle', label: 'Все чаты', value: '47' },
          { icon: 'Users', label: 'Групп', value: '8' },
          { icon: 'Radio', label: 'Подписки', value: '12' },
          { icon: 'Phone', label: 'Звонков', value: '124' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <Icon name={item.icon} size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{item.label}</p>
            </div>
            <span className="text-sm font-semibold text-primary">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
