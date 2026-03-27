import { useState } from 'react';
import Icon from '@/components/ui/icon';

export default function SettingsView({ onLogout }: { onLogout?: () => void }) {
  const [notifications, setNotifications] = useState(true);
  const [e2e, setE2e] = useState(true);
  const [twoFa, setTwoFa] = useState(false);
  const [autoDelete, setAutoDelete] = useState(false);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-all duration-200 relative ${value ? 'bg-primary' : 'bg-border'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${value ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
    </button>
  );

  const Section = ({ icon, title, desc, value, onChange }: {
    icon: string; title: string; desc: string; value: boolean; onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon name={icon} size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto px-6 py-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-6">Настройки</h2>

      <div className="max-w-lg space-y-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 px-1">Безопасность</p>
          <div className="space-y-2">
            <Section icon="Lock" title="Сквозное шифрование" desc="E2E для всех сообщений и звонков" value={e2e} onChange={setE2e} />
            <Section icon="ShieldCheck" title="Двухфакторная аутентификация" desc="Дополнительная защита аккаунта" value={twoFa} onChange={setTwoFa} />
            <Section icon="Trash2" title="Автоудаление сообщений" desc="Сообщения удаляются через 7 дней" value={autoDelete} onChange={setAutoDelete} />
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 px-1">Уведомления</p>
          <div className="space-y-2">
            <Section icon="Bell" title="Push-уведомления" desc="Получать уведомления о сообщениях" value={notifications} onChange={setNotifications} />
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 px-1">Аккаунт</p>
          <div className="space-y-2">
            {[
              { icon: 'Globe', label: 'Язык интерфейса', value: 'Русский' },
              { icon: 'HardDrive', label: 'Занято места', value: '1.2 ГБ' },
              { icon: 'Info', label: 'Версия', value: 'Вжух 1.0.0' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                    <Icon name={item.icon} size={18} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
                <span className="text-sm text-muted-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onLogout} className="w-full p-4 bg-destructive/10 text-destructive rounded-2xl text-sm font-medium hover:bg-destructive/20 transition-colors border border-destructive/20">
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}