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
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/80 backdrop-blur-xl border-t border-border z-50">
      <div className="max-w-lg mx-auto flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;

          // FAB (center button)
          if (!Icon) {
            return (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="relative -top-3 w-14 h-14 bg-accent hover:bg-accent-light rounded-2xl flex items-center justify-center shadow-lg shadow-accent/25 transition-all active:scale-90"
              >
                <Plus size={24} className="text-white" />
              </button>
            );
          }

          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 py-3 px-3 transition-colors ${
                isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
