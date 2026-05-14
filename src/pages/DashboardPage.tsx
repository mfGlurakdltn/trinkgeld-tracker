import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShifts } from '@/hooks/useShifts';
import { useAuth } from '@/hooks/useAuth';
import { useBackground } from '@/contexts/BackgroundContext';
import { calculateStats, calcChange, filterByMonth } from '@/services/statisticsService';
import { formatCurrency, formatDateShort, getWeekday } from '@/lib/utils';
import { Plus, BarChart3, Download, Clock, Sun, Moon, TrendingUp, TrendingDown } from 'lucide-react';
import LiquidGlass from '@/components/LiquidGlass';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: shifts, isLoading } = useShifts();
  const { def } = useBackground();
  const useLiquid = def.liquid;

  const { currentStats, change, recentShifts } = useMemo(() => {
    if (!shifts) return { currentStats: null, change: null, recentShifts: [] };

    const now = new Date();
    const currentMonth = filterByMonth(shifts, now.getFullYear(), now.getMonth());
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = filterByMonth(shifts, prevDate.getFullYear(), prevDate.getMonth());

    const cs = calculateStats(currentMonth);
    const ps = calculateStats(previousMonth);
    const ch = cs && ps ? calcChange(cs.totalTips, ps.totalTips) : null;

    return {
      currentStats: cs,
      change: ch,
      recentShifts: shifts.slice(0, 5),
    };
  }, [shifts]);

  const userName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'User';

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
        <div className="skeleton h-6 w-36" />
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 w-full rounded-2xl" />)}
      </div>
    );
  }

  const quickActions = [
    { icon: Plus, label: 'Hinzufügen', path: '/add', accent: true },
    { icon: BarChart3, label: 'Statistik', path: '/stats' },
    { icon: Download, label: 'Download', path: '/profile' },
    { icon: Clock, label: 'Historie', path: '/history' },
  ];

  return (
    <div className="p-6 pb-28 space-y-5">
      {/* Header */}
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-xs font-medium tracking-wide">Willkommen zurück</p>
          <h1 className="text-[22px] font-extrabold capitalize">{`Hallo, ${userName}`}</h1>
        </div>
      </div>

      {/* Balance Card */}
      <div className="animate-fade-in animate-fade-in-delay-1">
        {useLiquid ? (
          <LiquidGlass
            id="balance"
            borderRadius={28}
            depth={12}
            strength={70}
            chromaticAberration={2}
            blur={0.8}
            tintColor="rgba(255,255,255,0.03)"
          >
            <div className="px-7 pt-6 pb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-secondary text-[11px] font-bold tracking-[1.5px] uppercase">
                  Dieser Monat
                </span>
                {change && change.direction !== 'flat' && (
                  <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    change.direction === 'up'
                      ? 'bg-positive/10 border-positive/25 text-positive'
                      : 'bg-negative/10 border-negative/25 text-negative'
                  }`}>
                    {change.direction === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {change.direction === 'up' ? '+' : ''}{change.value}%
                  </span>
                )}
              </div>
              <p className="text-white font-extrabold leading-tight tracking-tight" style={{ fontSize: 46, letterSpacing: '-1.5px' }}>
                {currentStats ? formatCurrency(currentStats.totalTips) : '0,00 €'}
              </p>
              {currentStats && (
                <p className="text-text-muted text-xs mt-1.5">
                  {currentStats.totalShifts} Schichten · Ø {formatCurrency(currentStats.avgPerShift)} pro Schicht
                </p>
              )}
              {currentStats && (
                <div className="flex gap-5 mt-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider">Ø/Stunde</p>
                    <p className="font-bold text-sm mt-0.5">{formatCurrency(currentStats.avgPerHour)}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider">Beste</p>
                    <p className="font-bold text-sm mt-0.5">{formatCurrency(currentStats.bestShift)}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider">Schichten</p>
                    <p className="font-bold text-sm mt-0.5">{currentStats.totalShifts}</p>
                  </div>
                </div>
              )}
            </div>
          </LiquidGlass>
        ) : (
          <div className="balance-gradient rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <p className="text-white/70 text-sm mb-1">Dieser Monat</p>
            <p className="text-[40px] font-bold leading-tight tracking-tight">
              {currentStats ? formatCurrency(currentStats.totalTips) : '0,00 €'}
            </p>
            {change && change.direction !== 'flat' && (
              <div className="flex items-center gap-1.5 mt-2">
                {change.direction === 'up'
                  ? <TrendingUp size={14} className="text-green-300" />
                  : <TrendingDown size={14} className="text-red-300" />}
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
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 animate-fade-in animate-fade-in-delay-2">
        {quickActions.map(({ icon: Icon, label, path, accent }, i) =>
          useLiquid ? (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <LiquidGlass
                id={`qa-${i}`}
                width={56}
                height={56}
                borderRadius={18}
                depth={6}
                strength={40}
                chromaticAberration={1}
                tintColor={accent ? 'rgba(74,144,226,0.18)' : 'rgba(255,255,255,0.03)'}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <Icon size={20} className={accent ? 'text-accent-light' : 'text-white'} />
                </div>
              </LiquidGlass>
              <span className="text-text-secondary text-[10px] font-medium">{label}</span>
            </button>
          ) : (
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
          )
        )}
      </div>

      {/* Recent Shifts */}
      <div className="animate-fade-in animate-fade-in-delay-3">
        <h2 className="text-base font-semibold mb-3 px-1">Letzte Schichten</h2>
        {recentShifts.length === 0 ? (
          useLiquid ? (
            <LiquidGlass id="empty" borderRadius={20} depth={8} strength={45}>
              <div className="p-7 text-center">
                <Coins className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary text-sm">Noch keine Schichten erfasst</p>
                <button
                  onClick={() => navigate('/add')}
                  className="mt-3 text-accent text-sm font-medium hover:text-accent-light"
                >
                  Erste Schicht hinzufügen →
                </button>
              </div>
            </LiquidGlass>
          ) : (
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
          )
        ) : useLiquid ? (
          <LiquidGlass id="shifts" borderRadius={22} depth={10} strength={50} tintColor="rgba(255,255,255,0.02)">
            <div className="px-5 py-3">
              {recentShifts.map((shift, i) => (
                <button
                  key={shift.id}
                  onClick={() => navigate('/history')}
                  className={`w-full flex items-center gap-3 py-3 text-left active:opacity-70 transition-opacity ${
                    i < recentShifts.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: shift.schicht === 'f'
                        ? 'linear-gradient(135deg, rgba(255,183,77,0.18), rgba(255,152,0,0.06))'
                        : 'linear-gradient(135deg, rgba(74,144,226,0.18), rgba(45,95,158,0.06))',
                      border: `1px solid ${shift.schicht === 'f' ? 'rgba(255,183,77,0.18)' : 'rgba(74,144,226,0.18)'}`,
                    }}
                  >
                    {shift.schicht === 'f'
                      ? <Sun size={16} className="text-amber-400" />
                      : <Moon size={16} className="text-indigo-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white">
                      {shift.schicht === 'f' ? 'Frühschicht' : shift.schicht === 's' ? 'Spätschicht' : 'Schicht'}
                      {shift.mitarbeiter ? <span className="text-text-muted font-normal"> · {shift.mitarbeiter} MA</span> : null}
                    </p>
                    <p className="text-text-muted text-[11px] mt-0.5">
                      {formatDateShort(shift.datum)} · {getWeekday(shift.datum)}
                    </p>
                  </div>
                  <p className="text-positive font-bold text-sm tabular-nums">
                    +{formatCurrency(shift.betrag)}
                  </p>
                </button>
              ))}
            </div>
          </LiquidGlass>
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
