import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShifts } from '@/hooks/useShifts';
import { useAuth } from '@/hooks/useAuth';
import { calculateStats, calcChange, filterByMonth } from '@/services/statisticsService';
import { formatCurrency, formatDateShort, getWeekday } from '@/lib/utils';
import { Plus, BarChart3, Download, Clock, Sun, Moon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: shifts, isLoading } = useShifts();

  const { currentStats, previousStats, change, recentShifts } = useMemo(() => {
    if (!shifts) return { currentStats: null, previousStats: null, change: null, recentShifts: [] };

    const now = new Date();
    const currentMonth = filterByMonth(shifts, now.getFullYear(), now.getMonth());
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = filterByMonth(shifts, prevDate.getFullYear(), prevDate.getMonth());

    const cs = calculateStats(currentMonth);
    const ps = calculateStats(previousMonth);
    const ch = cs && ps ? calcChange(cs.totalTips, ps.totalTips) : null;

    return {
      currentStats: cs,
      previousStats: ps,
      change: ch,
      recentShifts: shifts.slice(0, 5),
    };
  }, [shifts]);

  const userName = user?.email?.split('@')[0] || 'User';

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
        <div className="skeleton h-6 w-36" />
        {[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <p className="text-text-secondary text-sm">Willkommen zurück</p>
        <h1 className="text-2xl font-bold capitalize">{`Hallo, ${userName}`}</h1>
      </div>

      {/* Balance Card */}
      <div className="balance-gradient rounded-2xl p-6 relative overflow-hidden animate-fade-in animate-fade-in-delay-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <p className="text-white/70 text-sm mb-1">Dieser Monat</p>
        <p className="text-[40px] font-bold leading-tight tracking-tight">
          {currentStats ? formatCurrency(currentStats.totalTips) : '0,00 €'}
        </p>
        {change && change.direction !== 'flat' && (
          <div className="flex items-center gap-1.5 mt-2">
            {change.direction === 'up' ? (
              <TrendingUp size={14} className="text-green-300" />
            ) : (
              <TrendingDown size={14} className="text-red-300" />
            )}
            <span className={`text-sm font-medium ${change.direction === 'up' ? 'text-green-300' : 'text-red-300'}`}>
              {change.direction === 'up' ? '+' : ''}{change.value}%
            </span>
            <span className="text-white/50 text-sm">vs. Vormonat</span>
          </div>
        )}
        {currentStats && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-white/50 text-xs">Ø/Schicht</p>
              <p className="font-semibold">{formatCurrency(currentStats.avgPerShift)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Ø/Stunde</p>
              <p className="font-semibold">{formatCurrency(currentStats.avgPerHour)}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Schichten</p>
              <p className="font-semibold">{currentStats.totalShifts}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 animate-fade-in animate-fade-in-delay-2">
        {[
          { icon: Plus, label: 'Hinzufügen', path: '/add', accent: true },
          { icon: BarChart3, label: 'Statistik', path: '/stats' },
          { icon: Download, label: 'Export', path: '/profile' },
          { icon: Clock, label: 'Historie', path: '/history' },
        ].map(({ icon: Icon, label, path, accent }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95 ${
              accent
                ? 'bg-accent/20 text-accent hover:bg-accent/30'
                : 'bg-bg-card/60 text-text-secondary hover:bg-bg-card hover:text-text-primary'
            }`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Recent Shifts */}
      <div className="animate-fade-in animate-fade-in-delay-3">
        <h2 className="text-lg font-semibold mb-3">Letzte Schichten</h2>
        {recentShifts.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Coins className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">Noch keine Schichten erfasst</p>
            <button
              onClick={() => navigate('/add')}
              className="mt-3 text-accent text-sm font-medium hover:text-accent-light"
            >
              Erste Schicht hinzufügen →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentShifts.map(shift => (
              <button
                key={shift.id}
                onClick={() => navigate('/history')}
                className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-bg-card/80 transition-colors active:scale-[0.98]"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  shift.schicht === 'f' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'
                }`}>
                  {shift.schicht === 'f' ? <Sun size={18} /> : <Moon size={18} />}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">
                    {shift.schicht === 'f' ? 'Frühschicht' : shift.schicht === 's' ? 'Spätschicht' : 'Schicht'}
                    {shift.mitarbeiter && <span className="text-text-muted"> • {shift.mitarbeiter} MA</span>}
                  </p>
                  <p className="text-text-muted text-xs">
                    {formatDateShort(shift.datum)} • {getWeekday(shift.datum)}
                  </p>
                </div>
                <p className="text-positive font-semibold">{formatCurrency(shift.betrag)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Coins({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}
