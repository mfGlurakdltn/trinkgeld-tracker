import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddShift } from '@/hooks/useShifts';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Loader2, Sun, Moon } from 'lucide-react';

const SHIFT_HOURS = 5.5;

export default function AddShiftPage() {
  const navigate = useNavigate();
  const addShift = useAddShift();

  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [betrag, setBetrag] = useState('');
  const [schicht, setSchicht] = useState<'f' | 's' | null>(null);
  const [mitarbeiter, setMitarbeiter] = useState<number>(1);
  const [umsatz, setUmsatz] = useState('');
  const [notiz, setNotiz] = useState('');

  const betragNum = parseFloat(betrag) || 0;
  const umsatzNum = parseFloat(umsatz) || 0;
  const euroPerHour = betragNum > 0 ? betragNum / SHIFT_HOURS : 0;
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
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Schicht hinzufügen</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-6 space-y-5">
        {/* Preview Card */}
        {betragNum > 0 && (
          <div className="glass rounded-2xl p-4 flex gap-4 animate-fade-in">
            <div className="flex-1 text-center">
              <p className="text-text-muted text-xs mb-1">€/Stunde</p>
              <p className="text-accent font-bold text-lg">{formatCurrency(euroPerHour)}</p>
            </div>
            {tipPercent > 0 && (
              <div className="flex-1 text-center border-l border-border">
                <p className="text-text-muted text-xs mb-1">Tip-Rate</p>
                <p className="text-accent font-bold text-lg">{tipPercent.toFixed(1)}%</p>
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
            className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent transition-colors [color-scheme:dark]"
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
            className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-xl px-4 py-3 text-text-primary text-2xl font-bold placeholder:text-text-muted placeholder:font-normal placeholder:text-base focus:outline-none focus:border-accent transition-colors"
          />
          <div className="flex gap-2 mt-2">
            {[5, 10, 20, 50].map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => quickAdd(amount)}
                className="flex-1 bg-bg-card/60 hover:bg-bg-card text-text-secondary hover:text-text-primary py-2 rounded-lg text-sm font-medium transition-colors active:scale-95"
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
              { value: 'f' as const, label: 'Frühschicht', icon: Sun, color: 'amber' },
              { value: 's' as const, label: 'Spätschicht', icon: Moon, color: 'indigo' },
            ].map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSchicht(schicht === value ? null : value)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all active:scale-95 ${
                  schicht === value
                    ? value === 'f'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-bg-secondary border border-[#2D3E5F] text-text-secondary hover:text-text-primary'
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
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'bg-bg-secondary border border-[#2D3E5F] text-text-secondary hover:text-text-primary'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
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
            className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
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
            className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-2 pb-4">
          <button
            type="submit"
            disabled={addShift.isPending || betragNum <= 0}
            className="w-full bg-accent hover:bg-accent-light text-white font-semibold rounded-xl py-4 text-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {addShift.isPending && <Loader2 size={20} className="animate-spin" />}
            Schicht speichern
          </button>
        </div>
      </form>
    </div>
  );
}
