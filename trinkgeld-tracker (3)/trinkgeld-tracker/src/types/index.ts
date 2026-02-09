export interface Shift {
  id: string;
  user_id: string;
  datum: string;
  betrag: number;
  schicht: 'f' | 's' | null;
  mitarbeiter: number | null;
  umsatz: number | null;
  notiz: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftExtended extends Shift {
  wochentag: string;
  monat: string;
  kalenderwoche: number;
  euro_pro_stunde: number;
  tip_prozent: number;
}

export interface ShiftInput {
  datum: string;
  betrag: number;
  schicht: 'f' | 's' | null;
  mitarbeiter: number;
  umsatz: number | null;
  notiz: string | null;
}

export interface Stats {
  totalTips: number;
  totalRevenue: number;
  avgPerShift: number;
  avgPerHour: number;
  avgTipRate: number | null;
  bestShift: number;
  worstShift: number;
  totalShifts: number;
}

export interface WeekdayData {
  day: string;
  avg: number;
  total: number;
  count: number;
}
