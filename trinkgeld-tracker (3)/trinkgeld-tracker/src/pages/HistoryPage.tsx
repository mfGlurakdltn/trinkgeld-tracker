import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShifts, useDeleteShift, useUpdateShift } from '@/hooks/useShifts';
import { formatCurrency, formatDate, getWeekday } from '@/lib/utils';
import { ArrowLeft, Sun, Moon, Trash2, Search, X, Pencil, Check, Loader2 } from 'lucide-react';
import type { ShiftExtended } from '@/types';

type SortKey = 'datum' | 'betrag' | 'euro_pro_stunde';
type FilterSchicht = 'all' | 'f' | 's';

function EditForm({ shift, onClose }: { shift: ShiftExtended; onClose: () => void }) {
  const updateShift = useUpdateShift();

  const [datum, setDatum] = useState(shift.datum);
  const [betrag, setBetrag] = useState(shift.betrag.toString());
  const [schicht, setSchicht] = useState<'f' | 's' | null>(shift.schicht);
  const [mitarbeiter, setMitarbeiter] = useState<number>(shift.mitarbeiter || 1);
  const [umsatz, setUmsatz] = useState(shift.umsatz?.toString() || '');
  const [notiz, setNotiz] = useState(shift.notiz || '');

  const handleSave = async () => {
    const betragNum = parseFloat(betrag) || 0;
    if (betragNum <= 0) return;

    await updateShift.mutateAsync({
      id: shift.id,
      updates: {
        datum,
        betrag: betragNum,
        schicht,
        mitarbeiter,
        umsatz: parseFloat(umsatz) || null,
        notiz: notiz.trim() || null,
      },
    });
    onClose();
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3 animate-fade-in">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-text-muted text-xs mb-1 block">Datum</label>
          <input
            type="date"
            value={datum}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setDatum(e.target.value)}
            className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="text-text-muted text-xs mb-1 block">Betrag (€)</label>
          <input
            type="number"
            value={betrag}
            onChange={e => setBetrag(e.target.value)}
            min="0.01"
            step="0.01"
            className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-lg px-3 py-2 text-sm text-text-primary font-bold focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="text-text-muted text-xs mb-1 block">Schicht</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'f' as const, label: 'Früh', icon: Sun },
            { value: 's' as const, label: 'Spät', icon: Moon },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSchicht(schicht === value ? null : value)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                schicht === value
                  ? value === 'f'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-bg-secondary border border-[#2D3E5F] text-text-secondary'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-text-muted text-xs mb-1 block">Mitarbeiter</label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 1.5, 2].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => setMitarbeiter(val)}
              className={`py-2 rounded-lg text-xs font-medium transition-all ${
                mitarbeiter === val
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-bg-secondary border border-[#2D3E5F] text-text-secondary'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-text-muted text-xs mb-1 block">Umsatz (€)</label>
          <input
            type="number"
            value={umsatz}
            onChange={e => setUmsatz(e.target.value)}
            min="0"
            step="0.01"
            placeholder="optional"
            className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="text-text-muted text-xs mb-1 block">Notiz</label>
          <input
            type="text"
            value={notiz}
            onChange={e => setNotiz(e.target.value)}
            maxLength={200}
            placeholder="optional"
            className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg text-xs bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors font-medium"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          disabled={updateShift.isPending || (parseFloat(betrag) || 0) <= 0}
          className="flex-1 py-2.5 rounded-lg text-xs bg-accent text-white hover:bg-accent-light transition-colors font-medium disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          {updateShift.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Speichern
        </button>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { data: shifts, isLoading } = useShifts();
  const deleteShift = useDeleteShift();

  const [sortKey, setSortKey] = useState<SortKey>('datum');
  const [filterSchicht, setFilterSchicht] = useState<FilterSchicht>('all');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const filteredShifts = useMemo(() => {
    if (!shifts) return [];
    let result = [...shifts];

    if (filterSchicht !== 'all') {
      result = result.filter(s => s.schicht === filterSchicht);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.notiz?.toLowerCase().includes(q) ||
        formatDate(s.datum).includes(q) ||
        getWeekday(s.datum).toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortKey === 'datum') return new Date(b.datum).getTime() - new Date(a.datum).getTime();
      if (sortKey === 'betrag') return b.betrag - a.betrag;
      if (sortKey === 'euro_pro_stunde') return b.euro_pro_stunde - a.euro_pro_stunde;
      return 0;
    });

    return result;
  }, [shifts, sortKey, filterSchicht, search]);

  const handleDelete = async (id: string) => {
    await deleteShift.mutateAsync(id);
    setDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-8 w-32" />
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="flex items-center gap-3 p-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Historie</h1>
        <span className="text-text-muted text-sm ml-auto">{filteredShifts.length} Einträge</span>
      </div>

      <div className="px-6 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <div className="flex bg-bg-secondary rounded-lg p-0.5 text-xs shrink-0">
            {[
              { key: 'datum' as SortKey, label: 'Datum' },
              { key: 'betrag' as SortKey, label: 'Betrag' },
              { key: 'euro_pro_stunde' as SortKey, label: '€/h' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  sortKey === key ? 'bg-accent text-white' : 'text-text-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex bg-bg-secondary rounded-lg p-0.5 text-xs shrink-0">
            {[
              { key: 'all' as FilterSchicht, label: 'Alle' },
              { key: 'f' as FilterSchicht, label: 'Früh' },
              { key: 's' as FilterSchicht, label: 'Spät' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterSchicht(key)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  filterSchicht === key ? 'bg-accent text-white' : 'text-text-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredShifts.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-text-secondary">Keine Schichten gefunden</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredShifts.map((shift, i) => (
              <div
                key={shift.id}
                className="glass rounded-2xl p-4 animate-fade-in"
                style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s`, opacity: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    shift.schicht === 'f' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'
                  }`}>
                    {shift.schicht === 'f' ? <Sun size={18} /> : <Moon size={18} />}
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      setEditId(editId === shift.id ? null : shift.id);
                      setDeleteConfirm(null);
                    }}
                  >
                    <div className="flex items-baseline gap-2">
                      <p className="font-medium text-sm">{formatDate(shift.datum)}</p>
                      <p className="text-text-muted text-xs">{getWeekday(shift.datum)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                      <span>{shift.schicht === 'f' ? 'Früh' : 'Spät'}</span>
                      {shift.mitarbeiter && <span>• {shift.mitarbeiter} MA</span>}
                      <span>• {formatCurrency(shift.euro_pro_stunde)}/h</span>
                      {shift.tip_prozent > 0 && <span>• {shift.tip_prozent}%</span>}
                    </div>
                    {shift.notiz && (
                      <p className="text-text-muted text-xs mt-1 truncate">{shift.notiz}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <p className="text-positive font-bold">{formatCurrency(shift.betrag)}</p>
                    <button
                      onClick={() => {
                        setEditId(editId === shift.id ? null : shift.id);
                        setDeleteConfirm(null);
                      }}
                      className="text-text-muted hover:text-accent transition-colors p-1"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirm(deleteConfirm === shift.id ? null : shift.id);
                        setEditId(null);
                      }}
                      className="text-text-muted hover:text-negative transition-colors p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {editId === shift.id && (
                  <EditForm shift={shift} onClose={() => setEditId(null)} />
                )}

                {deleteConfirm === shift.id && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                    <p className="text-xs text-text-muted flex-1">Wirklich löschen?</p>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => handleDelete(shift.id)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-negative/20 text-negative hover:bg-negative/30 transition-colors"
                    >
                      Löschen
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
