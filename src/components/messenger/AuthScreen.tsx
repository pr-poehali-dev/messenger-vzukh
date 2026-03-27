import { useState } from 'react';
import { api, User } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  onAuth: (user: User) => void;
}

export default function AuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      let data: User & { token: string };
      if (mode === 'register') {
        data = await api.auth.register(username, displayName, password);
      } else {
        data = await api.auth.login(username, password);
      }
      localStorage.setItem('vzuh_token', data.token);
      onAuth(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold font-mono">В</span>
          </div>
          <h1 className="text-2xl font-bold">Вжух</h1>
          <p className="text-muted-foreground text-sm mt-1">Защищённый мессенджер</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex bg-secondary rounded-xl p-1">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Имя пользователя</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ivan_petrov"
                className="w-full h-11 bg-secondary rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40 font-mono"
                autoCapitalize="none"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Отображаемое имя</label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Иван Петров"
                  className="w-full h-11 bg-secondary rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="••••••••"
                className="w-full h-11 bg-secondary rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-xl">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading || !username || !password || (mode === 'register' && !displayName)}
            className="w-full h-12 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Icon name={mode === 'login' ? 'LogIn' : 'UserPlus'} size={16} />
                {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Icon name="Lock" size={11} />
          <span>Сквозное шифрование всех сообщений</span>
        </div>
      </div>
    </div>
  );
}
