import type { ShiftExtended, Stats, WeekdayData } from '@/types';

const SHIFT_HOURS = 5.5;

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function calculateStats(shifts: ShiftExtended[]): Stats | null {
  if (shifts.length === 0) return null;

  const totalTips = sum(shifts.map(s => s.betrag));
  const shiftsWithRevenue = shifts.filter(s => s.umsatz && s.umsatz > 0);
  const totalRevenue = sum(shiftsWithRevenue.map(s => s.umsatz!));
  const avgPerShift = totalTips / shifts.length;

  return {
    totalTips: round(totalTips),
    totalRevenue: round(totalRevenue),
    avgPerShift: round(avgPerShift),
    avgPerHour: round(avgPerShift / SHIFT_HOURS),
    avgTipRate: totalRevenue > 0 ? round((totalTips / totalRevenue) * 100) : null,
    bestShift: Math.max(...shifts.map(s => s.betrag)),
    worstShift: Math.min(...shifts.map(s => s.betrag)),
    totalShifts: shifts.length,
  };
}

export function groupByWeekday(shifts: ShiftExtended[]): WeekdayData[] {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const grouped = new Map<string, number[]>(days.map(d => [d, []]));

  shifts.forEach(s => {
    const day = new Date(s.datum).toLocaleDateString('de-DE', { weekday: 'short' });
    // Remove trailing dot if present (e.g. "Mo." -> "Mo")
    const cleanDay = day.replace('.', '');
    grouped.get(cleanDay)?.push(s.betrag);
  });

  return days.map(day => ({
    day,
    avg: average(grouped.get(day) || []),
    total: round(sum(grouped.get(day) || [])),
    count: (grouped.get(day) || []).length,
  }));
}

export function calcChange(
  current: number,
  previous: number
): { value: number; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) return { value: 0, direction: 'flat' };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.round(change * 10) / 10,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
  };
}

export function filterByMonth(shifts: ShiftExtended[], year: number, month: number): ShiftExtended[] {
  return shifts.filter(s => {
    const d = new Date(s.datum);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function filterByWeek(shifts: ShiftExtended[], date: Date): ShiftExtended[] {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return shifts.filter(s => {
    const d = new Date(s.datum);
    return d >= startOfWeek && d <= endOfWeek;
  });
}
