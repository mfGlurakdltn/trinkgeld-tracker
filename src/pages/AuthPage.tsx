import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Coins, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setSuccessMsg('Konto erstellt! Du kannst dich jetzt einloggen.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-bg-primary">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-4">
            <Coins className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
            Trinkgeld Tracker
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Dein Trinkgeld im Blick
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="deine@email.de"
              className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1.5">Passwort</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-xl px-4 py-3 pr-12 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-negative/10 border border-negative/30 rounded-xl px-4 py-3 text-negative text-sm">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-positive/10 border border-positive/30 rounded-xl px-4 py-3 text-positive text-sm">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-light text-white font-semibold rounded-xl py-3.5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {isLogin ? 'Einloggen' : 'Registrieren'}
          </button>
        </form>

        <p className="text-center text-text-secondary text-sm mt-6">
          {isLogin ? 'Noch kein Konto?' : 'Bereits ein Konto?'}{' '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}
            className="text-accent hover:text-accent-light transition-colors font-medium"
          >
            {isLogin ? 'Registrieren' : 'Einloggen'}
          </button>
        </p>
      </div>
    </div>
  );
}
