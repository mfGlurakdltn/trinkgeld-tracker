import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Clock, BarChart3, User, Plus } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Clock, label: 'Historie', path: '/history' },
  { icon: null, label: 'Add', path: '/add' }, // FAB placeholder
  { icon: BarChart3, label: 'Statistik', path: '/stats' },
  { icon: User, label: 'Profil', path: '/profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on auth page
  if (location.pathname === '/auth') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] px-4">
      <div
        className="max-w-lg mx-auto mb-3 flex items-end justify-around px-2 rounded-3xl border border-white/10"
        style={{
          background: 'linear-gradient(160deg, rgba(24,36,66,0.82) 0%, rgba(10,17,40,0.88) 100%)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          boxShadow: '0 -4px 30px rgba(3,7,18,0.45), 0 12px 40px rgba(3,7,18,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;

          // FAB (center button)
          if (!Icon) {
            return (
              <button
                key={label}
                onClick={() => navigate(path)}
                aria-label="Schicht hinzufügen"
                className="relative -top-5 w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #5BA3FF 0%, #4A90E2 45%, #2D5F9E 100%)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  boxShadow: '0 8px 24px rgba(74,144,226,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
                }}
              >
                <Plus size={24} className="text-white" strokeWidth={2.5} />
              </button>
            );
          }

          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`relative flex flex-col items-center gap-1 py-3 px-3 transition-all duration-300 ${
                isActive ? 'text-accent-light' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <span
                className={`absolute top-1.5 h-1 w-1 rounded-full bg-accent-light transition-all duration-300 ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
                style={{ boxShadow: isActive ? '0 0 8px rgba(91,163,255,0.9)' : 'none' }}
              />
              <Icon
                size={20}
                strokeWidth={isActive ? 2.4 : 2}
                className={`transition-transform duration-300 ${isActive ? '-translate-y-0.5' : ''}`}
              />
              <span className={`text-[10px] transition-all ${isActive ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
