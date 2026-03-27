import { useState } from 'react';
import { CALLS } from './data';
import Icon from '@/components/ui/icon';

export default function CallsView() {
  const [activeCall, setActiveCall] = useState<string | null>(null);

  return (
    <div className="flex-1 flex h-screen">
      {/* List */}
      <div className="w-72 h-screen flex flex-col border-r border-border bg-card shrink-0">
        <div className="px-4 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Звонки</h2>
          <button className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
            <Icon name="PhoneCall" size={15} className="text-primary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {CALLS.map(call => (
            <button
              key={call.id}
              onClick={() => setActiveCall(call.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-secondary transition-colors text-left ${activeCall === call.id ? 'bg-primary/10' : ''}`}
            >
              <div className="w-11 h-11 rounded-2xl bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                {call.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{call.name}</span>
                  <Icon
                    name={call.callType === 'video' ? 'Video' : 'Phone'}
                    size={13}
                    className="text-muted-foreground"
                  />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Icon
                    name={call.type === 'incoming' ? 'PhoneIncoming' : call.type === 'outgoing' ? 'PhoneOutgoing' : 'PhoneMissed'}
                    size={12}
                    className={call.type === 'missed' ? 'text-destructive' : 'text-green-400'}
                  />
                  <span className={`text-xs ${call.type === 'missed' ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {call.type === 'incoming' ? 'Входящий' : call.type === 'outgoing' ? 'Исходящий' : 'Пропущенный'}
                    {call.duration && ` · ${call.duration}`}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{call.time}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active call screen */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
        {!activeCall ? (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Icon name="Phone" size={40} className="text-primary/60" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">Звонки</p>
              <p className="text-sm mt-1">Выберите контакт для звонка</p>
            </div>
          </div>
        ) : (() => {
          const call = CALLS.find(c => c.id === activeCall)!;
          return (
            <div className="flex flex-col items-center gap-6 animate-scale-in">
              <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                {call.avatar}
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold">{call.name}</p>
                <p className="text-muted-foreground mt-1">{call.duration || call.time}</p>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <button className="w-14 h-14 rounded-2xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-all hover:scale-105" title="Аудио">
                  <Icon name="Mic" size={22} className="text-foreground" />
                </button>
                <button className="w-16 h-16 rounded-2xl bg-primary hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-105 shadow-lg" title="Позвонить">
                  <Icon name={call.callType === 'video' ? 'Video' : 'Phone'} size={26} className="text-white" />
                </button>
                <button className="w-14 h-14 rounded-2xl bg-destructive/20 hover:bg-destructive/30 flex items-center justify-center transition-all hover:scale-105" title="Завершить">
                  <Icon name="PhoneOff" size={22} className="text-destructive" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
