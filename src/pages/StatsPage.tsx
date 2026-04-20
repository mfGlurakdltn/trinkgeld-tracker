import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShifts } from '@/hooks/useShifts';
import { calculateStats, groupByWeekday, filterByMonth, filterByWeek, calcChange } from '@/services/statisticsService';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Sun, Moon, ChevronDown, Calendar } from 'lucide-react';
import type { ShiftExtended } from '@/types';

type Period = 'week' | 'month' | 'all';
type ShiftFilter = 'all' | 'f' | 's';

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

interface MonthData {
  month: number;
  name: string;
  total: number;
  avg: number;
  avgRevenue: number | null;
  tipRate: number | null;
  count: number;
}

function getAvailableYears(shifts: ShiftExtended[]): number[] {
  const years = new Set(shifts.map(s => new Date(s.datum).getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
}

function getMonthlyBreakdown(shifts: ShiftExtended[], year: number): MonthData[] {
  const months: MonthData[] = [];

  for (let m = 0; m < 12; m++) {
    const monthShifts = shifts.filter(s => {
      const d = new Date(s.datum);
      return d.getFullYear() === year && d.getMonth() === m;
    });

    if (monthShifts.length === 0) continue;

    const total = monthShifts.reduce((sum, s) => sum + s.betrag, 0);
    const avg = total / monthShifts.length;
    const shiftsWithRevenue = monthShifts.filter(s => s.umsatz && s.umsatz > 0);
    const totalRevenue = shiftsWithRevenue.reduce((sum, s) => sum + (s.umsatz || 0), 0);
    const tipRate = totalRevenue > 0 ? (total / totalRevenue) * 100 : null;
    const avgRevenue = shiftsWithRevenue.length > 0
      ? totalRevenue / shiftsWithRevenue.length
      : null;

    months.push({
      month: m,
      name: MONTH_NAMES[m],
      total: Math.round(total * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      avgRevenue: avgRevenue !== null ? Math.round(avgRevenue * 100) / 100 : null,
      tipRate: tipRate !== null ? Math.round(tipRate * 10) / 10 : null,
      count: monthShifts.length,
    });
  }

  return months;
}

export default function StatsPage() {
  const navigate = useNavigate();
  const { data: shifts, isLoading } = useShifts();
  const [period, setPeriod] = useState<Period>('all');
  const [weekdayShiftFilter, setWeekdayShiftFilter] = useState<ShiftFilter>('all');
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  const shiftComparison = useMemo(() => {
    if (!filteredShifts.length) return null;
    const frueh = filteredShifts.filter(s => s.schicht === 'f');
    const spaet = filteredShifts.filter(s => s.schicht === 's');
    const avgFrueh = frueh.length > 0 ? frueh.reduce((s, x) => s + x.betrag, 0) / frueh.length : 0;
    const avgSpaet = spaet.length > 0 ? spaet.reduce((s, x) => s + x.betrag, 0) / spaet.length : 0;
    return { avgFrueh, avgSpaet, countFrueh: frueh.length, countSpaet: spaet.length };
  }, [filteredShifts]);

  const { availableYears, monthlyData } = useMemo(() => {
    if (!shifts || shifts.length === 0) return { availableYears: [], monthlyData: [] };
    return {
      availableYears: getAvailableYears(shifts),
      monthlyData: getMonthlyBreakdown(shifts, selectedYear),
    };
  }, [shifts, selectedYear]);

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
  const currentMonth = new Date().getMonth();

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

            {/* Bar Chart - Trinkgeld nach Wochentag */}
            <div className="glass rounded-2xl p-5 animate-fade-in animate-fade-in-delay-2">
              <div className="flex items-center justify-between mb-4 gap-3">
                <p className="text-text-secondary text-sm">Ø Trinkgeld nach Wochentag</p>
                <div className="flex bg-bg-secondary rounded-lg p-0.5 shrink-0">
                  {[
                    { key: 'all' as ShiftFilter, label: 'Alle', icon: null },
                    { key: 'f' as ShiftFilter, label: 'Früh', icon: <Sun size={12} /> },
                    { key: 's' as ShiftFilter, label: 'Spät', icon: <Moon size={12} /> },
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => setWeekdayShiftFilter(key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        weekdayShiftFilter === key
                          ? key === 'f'
                            ? 'bg-amber-500/20 text-amber-400'
                            : key === 's'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-accent text-white'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {(() => {
                const dataKey = weekdayShiftFilter === 'f' ? 'avgFrueh' : weekdayShiftFilter === 's' ? 'avgSpaet' : 'avg';
                const countKey = weekdayShiftFilter === 'f' ? 'countFrueh' : weekdayShiftFilter === 's' ? 'countSpaet' : 'count';
                const baseColor = weekdayShiftFilter === 'f' ? '#B45309' : weekdayShiftFilter === 's' ? '#4338CA' : '#2D5F9E';
                const activeColor = weekdayShiftFilter === 'f' ? '#F59E0B' : weekdayShiftFilter === 's' ? '#818CF8' : '#4A90E2';
                const hasData = weekdayData.some(d => (d[countKey] as number) > 0);
                if (!hasData) {
                  return (
                    <div className="h-[180px] flex items-center justify-center">
                      <p className="text-text-muted text-sm">
                        Keine {weekdayShiftFilter === 'f' ? 'Früh' : 'Spät'}schichten in diesem Zeitraum
                      </p>
                    </div>
                  );
                }
                return (
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
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
                        {weekdayData.map((entry) => (
                          <Cell
                            key={entry.day}
                            fill={entry.day === todayDay ? activeColor : baseColor}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>

            {/* Wochentag-Häufigkeit */}
            <div className="glass rounded-2xl p-5 animate-fade-in animate-fade-in-delay-3">
              <p className="text-text-secondary text-sm mb-3">Arbeitstage-Häufigkeit</p>
              <div className="grid grid-cols-7 gap-1.5">
                {weekdayData.map((wd) => {
                  const maxCount = Math.max(...weekdayData.map(d => d.count), 1);
                  const intensity = wd.count > 0 ? Math.max(0.2, wd.count / maxCount) : 0;
                  return (
                    <div key={wd.day} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                        style={{
                          backgroundColor: wd.count > 0
                            ? `rgba(74, 144, 226, ${intensity})`
                            : 'rgba(26, 40, 71, 0.5)',
                          color: wd.count > 0 ? '#fff' : '#6B7A99',
                        }}
                      >
                        {wd.count}
                      </div>
                      <span className={`text-[10px] font-medium ${
                        wd.day === todayDay ? 'text-accent' : 'text-text-muted'
                      }`}>
                        {wd.day}
                      </span>
                    </div>
                  );
                })}
              </div>
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

        {/* ===== MONATSÜBERSICHT ===== */}
        {availableYears.length > 0 && (
          <div className="animate-fade-in animate-fade-in-delay-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-accent" />
                <h2 className="text-lg font-semibold">Monatsübersicht</h2>
              </div>

              {/* Year Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                  className="flex items-center gap-1.5 bg-bg-secondary border border-[#2D3E5F] rounded-lg px-3 py-2 text-sm font-medium text-text-primary hover:border-accent transition-colors"
                >
                  {selectedYear}
                  <ChevronDown size={14} className={`text-text-muted transition-transform ${yearDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {yearDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setYearDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-bg-secondary border border-[#2D3E5F] rounded-lg shadow-xl overflow-hidden min-w-[100px]">
                      {availableYears.map(year => (
                        <button
                          key={year}
                          onClick={() => {
                            setSelectedYear(year);
                            setYearDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                            year === selectedYear
                              ? 'bg-accent/20 text-accent font-medium'
                              : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Monthly Cards */}
            {monthlyData.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center">
                <p className="text-text-secondary text-sm">Keine Daten für {selectedYear}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {monthlyData.map((m, i) => (
                  <div
                    key={m.month}
                    className="glass rounded-2xl p-4 animate-fade-in"
                    style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s`, opacity: 0 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          selectedYear === new Date().getFullYear() && m.month === currentMonth
                            ? 'text-accent'
                            : 'text-text-primary'
                        }`}>
                          {m.name}
                        </span>
                        <span className="text-text-muted text-xs">{m.count} Schichten</span>
                      </div>
                      <p className="text-positive font-bold">{formatCurrency(m.total)}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-bg-secondary/50 rounded-lg px-3 py-2">
                        <p className="text-text-muted text-[10px] uppercase tracking-wider">Ø Trinkgeld</p>
                        <p className="text-sm font-semibold mt-0.5">{formatCurrency(m.avg)}</p>
                      </div>
                      <div className="bg-bg-secondary/50 rounded-lg px-3 py-2">
                        <p className="text-text-muted text-[10px] uppercase tracking-wider">Ø Umsatz</p>
                        <p className="text-sm font-semibold mt-0.5">
                          {m.avgRevenue !== null ? formatCurrency(m.avgRevenue) : '–'}
                        </p>
                      </div>
                      <div className="bg-bg-secondary/50 rounded-lg px-3 py-2">
                        <p className="text-text-muted text-[10px] uppercase tracking-wider">Tip-Rate</p>
                        <p className="text-sm font-semibold mt-0.5">
                          {m.tipRate !== null ? `${m.tipRate}%` : '–'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
