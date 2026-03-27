import Icon from '@/components/ui/icon';

type Section = 'chats' | 'calls' | 'channels' | 'groups' | 'contacts' | 'settings' | 'profile' | 'admin';

interface SidebarProps {
  active: Section;
  onChange: (s: Section) => void;
}

const NAV = [
  { id: 'chats', icon: 'MessageCircle', label: 'Чаты' },
  { id: 'calls', icon: 'Phone', label: 'Звонки' },
  { id: 'channels', icon: 'Radio', label: 'Каналы' },
  { id: 'groups', icon: 'Users', label: 'Группы' },
  { id: 'contacts', icon: 'BookUser', label: 'Контакты' },
] as const;

const BOTTOM_NAV = [
  { id: 'settings', icon: 'Settings', label: 'Настройки' },
  { id: 'profile', icon: 'CircleUser', label: 'Профиль' },
  { id: 'admin', icon: 'Shield', label: 'Админ' },
] as const;

export default function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <aside className="w-16 h-screen flex flex-col items-center py-4 gap-1 border-r border-border bg-card shrink-0">
      <div className="mb-4 flex flex-col items-center">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm font-mono">В</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {NAV.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => onChange(id as Section)}
            className={`nav-item w-12 h-12 ${active === id ? 'active' : ''}`}
            title={label}
          >
            <Icon name={icon} size={20} />
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {BOTTOM_NAV.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => onChange(id as Section)}
            className={`nav-item w-12 h-12 ${active === id ? 'active' : ''}`}
            title={label}
          >
            <Icon name={icon} size={20} />
          </button>
        ))}
      </div>
    </aside>
  );
}
