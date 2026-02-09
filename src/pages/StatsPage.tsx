import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShifts } from '@/hooks/useShifts';
import { calculateStats, groupByWeekday, filterByMonth, filterByWeek, calcChange } from '@/services/statisticsService';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Sun, Moon } from 'lucide-react';

type Period = 'week' | 'month' | 'all';

export default function StatsPage() {
  const navigate = useNavigate();
  const { data: shifts, isLoading } = useShifts();
  const [period, setPeriod] = useState<Period>('month');

  const { filteredShifts, stats, weekdayData, comparison } = useMemo(() => {
    if (!shifts) return { filteredShifts: [], stats: null, weekdayData: [], comparison: null };

    const now = new Date();
    let filtered = shifts;
    let prevFiltered = shifts;

    if (period === 'month') {
      filtered = filterByMonth(shifts, now.getFullYear(), now.getMonth());
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevFiltered = filterByMonth(shifts, prevDate.getFullYear(), prevDate.getMonth());
    } else if (period === 'week') {
      filtered = filterByWeek(shifts, now);
      const prevWeek = new Date(now);
      prevWeek.setDate(prevWeek.getDate() - 7);
      prevFiltered = filterByWeek(shifts, prevWeek);
    }

    const s = calculateStats(filtered);
    const ps = calculateStats(prevFiltered);
    const comp = s && ps ? calcChange(s.totalTips, ps.totalTips) : null;

    return {
      filteredShifts: filtered,
      stats: s,
      weekdayData: groupByWeekday(filtered),
      comparison: comp,
    };
  }, [shifts, period]);

  // Comparison: Früh vs Spät
  const shiftComparison = useMemo(() => {
    if (!filteredShifts.length) return null;
    const frueh = filteredShifts.filter(s => s.schicht === 'f');
    const spaet = filteredShifts.filter(s => s.schicht === 's');
    const avgFrueh = frueh.length > 0 ? frueh.reduce((s, x) => s + x.betrag, 0) / frueh.length : 0;
    const avgSpaet = spaet.length > 0 ? spaet.reduce((s, x) => s + x.betrag, 0) / spaet.length : 0;
    return { avgFrueh, avgSpaet, countFrueh: frueh.length, countSpaet: spaet.length };
  }, [filteredShifts]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="skeleton h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const todayDay = new Date().toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '');

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Statistiken</h1>
      </div>

      <div className="px-6 space-y-5">
        {/* Period Toggle */}
        <div className="flex bg-bg-secondary rounded-xl p-1">
          {[
            { key: 'week' as Period, label: 'Woche' },
            { key: 'month' as Period, label: 'Monat' },
            { key: 'all' as Period, label: 'Gesamt' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                period === key ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {!stats ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-text-secondary">Keine Daten für diesen Zeitraum</p>
          </div>
        ) : (
          <>
            {/* Total */}
            <div className="glass rounded-2xl p-5 text-center animate-fade-in">
              <p className="text-text-muted text-sm">Gesamt-Trinkgeld</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalTips)}</p>
              {comparison && comparison.direction !== 'flat' && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  {comparison.direction === 'up' ? (
                    <TrendingUp size={14} className="text-positive" />
                  ) : (
                    <TrendingDown size={14} className="text-negative" />
                  )}
                  <span className={`text-sm font-medium ${comparison.direction === 'up' ? 'text-positive' : 'text-negative'}`}>
                    {comparison.direction === 'up' ? '+' : ''}{comparison.value}%
                  </span>
                  <span className="text-text-muted text-sm">vs. Vorzeitraum</span>
                </div>
              )}
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-3 animate-fade-in animate-fade-in-delay-1">
              {[
                { label: 'Ø / Schicht', value: formatCurrency(stats.avgPerShift) },
                { label: 'Ø / Stunde', value: formatCurrency(stats.avgPerHour) },
                { label: 'Beste Schicht', value: formatCurrency(stats.bestShift) },
                { label: 'Schichten', value: stats.totalShifts.toString() },
              ].map(({ label, value }) => (
                <div key={label} className="glass rounded-2xl p-4">
                  <p className="text-text-muted text-xs">{label}</p>
                  <p className="text-xl font-bold mt-1">{value}</p>
                </div>
              ))}
            </div>

            {stats.avgTipRate !== null && (
              <div className="glass rounded-2xl p-4 flex items-center justify-between animate-fade-in animate-fade-in-delay-2">
                <p className="text-text-secondary text-sm">Ø Tip-Rate</p>
                <span className="bg-accent/20 text-accent px-3 py-1 rounded-lg text-sm font-bold">
                  {stats.avgTipRate}%
                </span>
              </div>
            )}

            {/* Bar Chart */}
            <div className="glass rounded-2xl p-5 animate-fade-in animate-fade-in-delay-2">
              <p className="text-text-secondary text-sm mb-4">Trinkgeld nach Wochentag</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weekdayData} barCategoryGap="20%">
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#A8B2C8', fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: '#1E2D4F',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Ø Trinkgeld']}
                  />
                  <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                    {weekdayData.map((entry) => (
                      <Cell
                        key={entry.day}
                        fill={entry.day === todayDay ? '#4A90E2' : '#2D5F9E'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Früh vs Spät */}
            {shiftComparison && (shiftComparison.countFrueh > 0 || shiftComparison.countSpaet > 0) && (
              <div className="glass rounded-2xl p-5 animate-fade-in animate-fade-in-delay-3">
                <p className="text-text-secondary text-sm mb-3">Früh vs. Spät</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-500/10 rounded-xl p-3 text-center">
                    <Sun size={18} className="text-amber-400 mx-auto mb-1" />
                    <p className="font-bold">{formatCurrency(shiftComparison.avgFrueh)}</p>
                    <p className="text-text-muted text-xs">{shiftComparison.countFrueh} Schichten</p>
                  </div>
                  <div className="bg-indigo-500/10 rounded-xl p-3 text-center">
                    <Moon size={18} className="text-indigo-400 mx-auto mb-1" />
                    <p className="font-bold">{formatCurrency(shiftComparison.avgSpaet)}</p>
                    <p className="text-text-muted text-xs">{shiftComparison.countSpaet} Schichten</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
