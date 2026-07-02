import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddShift } from '@/hooks/useShifts';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Loader2, Sun, Moon } from 'lucide-react';

const DEFAULT_SHIFT_HOURS = 5.5;

export default function AddShiftPage() {
  const navigate = useNavigate();
  const addShift = useAddShift();
  const { user } = useAuth();

  const defaultArbeitszeit = Number(user?.user_metadata?.default_arbeitszeit) || DEFAULT_SHIFT_HOURS;

  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [betrag, setBetrag] = useState('');
  const [schicht, setSchicht] = useState<'f' | 's' | null>(null);
  const [mitarbeiter, setMitarbeiter] = useState<number>(1);
  const [umsatz, setUmsatz] = useState('');
  const [useStandardTime, setUseStandardTime] = useState(true);
  const [arbeitszeit, setArbeitszeit] = useState(defaultArbeitszeit.toString());
  const [notiz, setNotiz] = useState('');

  const betragNum = parseFloat(betrag) || 0;
  const umsatzNum = parseFloat(umsatz) || 0;
  const arbeitszeitNum = useStandardTime
    ? defaultArbeitszeit
    : (parseFloat(arbeitszeit) || defaultArbeitszeit);
  const euroPerHour = betragNum > 0 && arbeitszeitNum > 0 ? betragNum / arbeitszeitNum : 0;
  const tipPercent = betragNum > 0 && umsatzNum > 0 ? (betragNum / umsatzNum) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (betragNum <= 0) return;

    await addShift.mutateAsync({
      datum,
      betrag: betragNum,
      schicht,
      mitarbeiter,
      umsatz: umsatzNum > 0 ? umsatzNum : null,
      arbeitszeit: arbeitszeitNum,
      notiz: notiz.trim() || null,
    });
    navigate('/');
  };

  const quickAdd = (amount: number) => {
    setBetrag(prev => {
      const current = parseFloat(prev) || 0;
      return (current + amount).toString();
    });
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="chip w-9 h-9 rounded-xl flex items-center justify-center"
          aria-label="Zurück"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold font-[family-name:var(--font-display)]">Schicht hinzufügen</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-6 space-y-5">
        {/* Preview Card */}
        {betragNum > 0 && (
          <div className="glass rounded-2xl p-4 flex gap-4 animate-pop-in">
            <div className="flex-1 text-center">
              <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">€/Stunde</p>
              <p className="text-accent-light font-bold text-lg tabular-nums">{formatCurrency(euroPerHour)}</p>
            </div>
            {tipPercent > 0 && (
              <div className="flex-1 text-center border-l border-border">
                <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">Tip-Rate</p>
                <p className="text-accent-light font-bold text-lg tabular-nums">{tipPercent.toFixed(1)}%</p>
              </div>
            )}
          </div>
        )}

        {/* Datum */}
        <div>
          <label className="block text-text-secondary text-sm mb-1.5">Datum</label>
          <input
            type="date"
            value={datum}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setDatum(e.target.value)}
            required
            className="input"
          />
        </div>

        {/* Betrag */}
        <div>
          <label className="block text-text-secondary text-sm mb-1.5">Trinkgeld (€)</label>
          <input
            type="number"
            value={betrag}
            onChange={e => setBetrag(e.target.value)}
            required
            min="0.01"
            step="0.01"
            placeholder="0,00"
            className="input text-2xl font-bold tabular-nums placeholder:font-normal placeholder:text-base"
          />
          <div className="flex gap-2 mt-2">
            {[5, 10, 20, 50].map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => quickAdd(amount)}
                className="chip flex-1 py-2 rounded-lg text-sm font-semibold"
              >
                +{amount}
              </button>
            ))}
          </div>
        </div>

        {/* Schicht Toggle */}
        <div>
          <label className="block text-text-secondary text-sm mb-1.5">Schicht</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'f' as const, label: 'Frühschicht', icon: Sun },
              { value: 's' as const, label: 'Spätschicht', icon: Moon },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSchicht(schicht === value ? null : value)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all active:scale-95 ${
                  schicht === value
                    ? value === 'f'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_2px_14px_rgba(245,158,11,0.20)]'
                      : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-[0_2px_14px_rgba(99,102,241,0.25)]'
                    : 'chip'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mitarbeiter */}
        <div>
          <label className="block text-text-secondary text-sm mb-1.5">Mitarbeiter (Trinkgeld-Teilung)</label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 1.5, 2].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setMitarbeiter(val)}
                className={`py-3 rounded-xl font-medium text-sm transition-all active:scale-95 ${
                  mitarbeiter === val
                    ? 'bg-accent/20 text-accent-light border border-accent/40 shadow-[0_2px_14px_rgba(74,144,226,0.25)]'
                    : 'chip'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Arbeitszeit */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-text-secondary text-sm">
              Arbeitszeit (Stunden) <span className="text-text-muted">optional</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useStandardTime}
                onChange={e => setUseStandardTime(e.target.checked)}
                className="w-4 h-4 rounded accent-accent cursor-pointer"
              />
              Standard ({defaultArbeitszeit}h)
            </label>
          </div>
          <input
            type="number"
            value={useStandardTime ? defaultArbeitszeit : arbeitszeit}
            onChange={e => setArbeitszeit(e.target.value)}
            disabled={useStandardTime}
            min="0.1"
            step="0.25"
            placeholder="z.B. 6.5"
            className="input"
          />
        </div>

        {/* Umsatz */}
        <div>
          <label className="block text-text-secondary text-sm mb-1.5">Umsatz (€) <span className="text-text-muted">optional</span></label>
          <input
            type="number"
            value={umsatz}
            onChange={e => setUmsatz(e.target.value)}
            min="0"
            step="0.01"
            placeholder="Gesamtumsatz der Schicht"
            className="input"
          />
        </div>

        {/* Notiz */}
        <div>
          <label className="block text-text-secondary text-sm mb-1.5">Notiz <span className="text-text-muted">optional</span></label>
          <textarea
            value={notiz}
            onChange={e => setNotiz(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="z.B. Event, Wetter, Besonderheit..."
            className="input resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-2 pb-4">
          <button
            type="submit"
            disabled={addShift.isPending || betragNum <= 0}
            className="btn-primary w-full font-semibold rounded-xl py-4 text-lg disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {addShift.isPending && <Loader2 size={20} className="animate-spin" />}
            Schicht speichern
          </button>
        </div>
      </form>
    </div>
  );
}
