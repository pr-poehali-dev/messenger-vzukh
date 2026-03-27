import { useState } from 'react';
import { CONTACTS, Contact } from './data';
import Icon from '@/components/ui/icon';

export default function ContactsView() {
  const [selected, setSelected] = useState<Contact | null>(null);

  return (
    <div className="flex-1 flex h-screen">
      <div className="w-72 h-screen flex flex-col border-r border-border bg-card shrink-0">
        <div className="px-4 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Контакты</h2>
          <button className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
            <Icon name="UserPlus" size={15} className="text-primary" />
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="relative">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Поиск..."
              className="w-full h-9 bg-secondary rounded-xl pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {CONTACTS.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-secondary transition-colors text-left ${selected?.id === c.id ? 'bg-primary/10' : ''}`}
            >
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-2xl bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                  {c.avatar}
                </div>
                {c.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.username}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
        {!selected ? (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Icon name="BookUser" size={40} className="text-primary/60" />
            </div>
            <p className="text-lg font-medium text-foreground">Контакты</p>
            <p className="text-sm">Выберите контакт для просмотра</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 animate-scale-in w-full max-w-sm px-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold">
                {selected.avatar}
              </div>
              {selected.online && <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />}
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{selected.name}</p>
              <p className="text-muted-foreground text-sm mt-1">{selected.username}</p>
              <p className="text-xs mt-1 text-muted-foreground">{selected.online ? '🟢 Онлайн' : `Был(а): ${selected.lastSeen}`}</p>
            </div>

            <div className="w-full bg-card rounded-2xl border border-border p-4 space-y-3">
              {selected.phone && (
                <div className="flex items-center gap-3">
                  <Icon name="Phone" size={16} className="text-muted-foreground" />
                  <span className="text-sm">{selected.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Icon name="AtSign" size={16} className="text-muted-foreground" />
                <span className="text-sm">{selected.username}</span>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button className="flex-1 flex items-center justify-center gap-2 h-11 bg-primary rounded-2xl text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                <Icon name="MessageCircle" size={16} />
                Написать
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 h-11 bg-secondary rounded-2xl text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
                <Icon name="Phone" size={16} />
                Позвонить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
