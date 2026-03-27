import { useState } from 'react';
import { ADMIN_CODE } from './data';
import Icon from '@/components/ui/icon';

const STATS = [
  { icon: 'Users', label: 'Пользователей', value: '2,847', change: '+12 сегодня', color: 'text-blue-400' },
  { icon: 'MessageCircle', label: 'Сообщений', value: '148,392', change: '+1,203 сегодня', color: 'text-green-400' },
  { icon: 'Radio', label: 'Каналов', value: '391', change: '+5 сегодня', color: 'text-purple-400' },
  { icon: 'Users2', label: 'Групп', value: '724', change: '+8 сегодня', color: 'text-orange-400' },
];

const USERS_TABLE = [
  { id: 1, name: 'Алексей Громов', username: '@alexgromov', status: 'Активен', role: 'user', joined: '12.01.2024' },
  { id: 2, name: 'Мария Ковалёва', username: '@masha_k', status: 'Активен', role: 'moderator', joined: '15.02.2024' },
  { id: 3, name: 'Дмитрий Фёдоров', username: '@dfedorov', status: 'Заблокирован', role: 'user', joined: '03.03.2024' },
  { id: 4, name: 'Наталья Соколова', username: '@nat_sok', status: 'Активен', role: 'user', joined: '20.03.2024' },
  { id: 5, name: 'Игорь Белов', username: '@ibelov', status: 'Активен', role: 'admin', joined: '01.01.2024' },
];

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports'>('dashboard');

  const handleSubmit = () => {
    if (code === ADMIN_CODE) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Неверный код доступа');
      setShake(true);
      setCode('');
      setTimeout(() => setShake(false), 500);
    }
  };

  if (!authenticated) {
    return (
      <div className="flex-1 flex items-center justify-center animate-fade-in">
        <div className={`w-full max-w-sm mx-6 ${shake ? 'animate-shake' : ''}`}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Icon name="Shield" size={32} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Панель администратора</h2>
            <p className="text-muted-foreground text-sm mt-2">Введите секретный код доступа</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Код доступа</label>
              <input
                type="password"
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••"
                className="w-full h-12 bg-secondary rounded-xl px-4 text-center text-xl font-mono text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40 tracking-widest"
                maxLength={8}
              />
              {error && (
                <p className="text-destructive text-xs mt-2 flex items-center gap-1">
                  <Icon name="AlertCircle" size={12} />
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={code.length < 4}
              className="w-full h-12 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Войти
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Код по умолчанию: <span className="font-mono text-primary">142857</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in">
      {/* Admin header */}
      <div className="h-14 flex items-center gap-4 px-6 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-2">
          <Icon name="Shield" size={18} className="text-primary" />
          <span className="font-semibold text-sm">Панель администратора</span>
        </div>
        <div className="flex gap-1 ml-4">
          {(['dashboard', 'users', 'reports'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === tab ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            >
              {tab === 'dashboard' ? 'Дашборд' : tab === 'users' ? 'Пользователи' : 'Отчёты'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs bg-green-500/15 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full pulse-dot" />
            Сервер активен
          </span>
          <button
            onClick={() => setAuthenticated(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Icon name="LogOut" size={14} />
            Выйти
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {STATS.map(stat => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <Icon name={stat.icon} size={16} className={stat.color} />
                  </div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="text-sm font-semibold mb-4">Быстрые действия</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: 'Bell', label: 'Рассылка', desc: 'Отправить всем пользователям' },
                  { icon: 'Download', label: 'Экспорт', desc: 'Скачать данные пользователей' },
                  { icon: 'ShieldOff', label: 'Блокировки', desc: 'Управление заблокированными' },
                  { icon: 'BarChart3', label: 'Аналитика', desc: 'Подробная статистика' },
                ].map(item => (
                  <button key={item.label} className="flex items-center gap-3 p-3 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors text-left">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icon name={item.icon} size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Пользователи ({USERS_TABLE.length})</h3>
              <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors">
                <Icon name="UserPlus" size={13} />
                Добавить
              </button>
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Пользователь</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Статус</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Роль</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Регистрация</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {USERS_TABLE.map(user => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{user.username}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${user.status === 'Активен' ? 'bg-green-500/15 text-green-400' : 'bg-destructive/15 text-destructive'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.role === 'admin' ? 'bg-primary/15 text-primary' :
                          user.role === 'moderator' ? 'bg-purple-500/15 text-purple-400' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {user.role === 'admin' ? 'Админ' : user.role === 'moderator' ? 'Модератор' : 'Пользователь'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{user.joined}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
                            <Icon name="Pencil" size={13} className="text-muted-foreground" />
                          </button>
                          <button className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors">
                            <Icon name={user.status === 'Заблокирован' ? 'ShieldCheck' : 'Ban'} size={13} className="text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-fade-in space-y-4">
            <h3 className="text-sm font-semibold">Отчёты</h3>
            {[
              { icon: 'Flag', label: 'Жалобы на контент', count: 3, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { icon: 'Bug', label: 'Ошибки системы', count: 0, color: 'text-green-400', bg: 'bg-green-500/10' },
              { icon: 'AlertTriangle', label: 'Подозрительная активность', count: 1, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { icon: 'ShieldAlert', label: 'Нарушения правил', count: 2, color: 'text-destructive', bg: 'bg-destructive/10' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <Icon name={item.icon} size={18} className={item.color} />
                  </div>
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${item.color}`}>{item.count}</span>
                  <button className="px-3 py-1.5 bg-secondary rounded-lg text-xs hover:bg-secondary/80 transition-colors">
                    Просмотр
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
