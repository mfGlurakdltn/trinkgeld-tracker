import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShifts, useDeleteShift } from '@/hooks/useShifts';
import { formatCurrency, formatDate, getWeekday } from '@/lib/utils';
import { ArrowLeft, Sun, Moon, Trash2, Search, X } from 'lucide-react';

type SortKey = 'datum' | 'betrag' | 'euro_pro_stunde';
type FilterSchicht = 'all' | 'f' | 's';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { data: shifts, isLoading } = useShifts();
  const deleteShift = useDeleteShift();

  const [sortKey, setSortKey] = useState<SortKey>('datum');
  const [filterSchicht, setFilterSchicht] = useState<FilterSchicht>('all');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredShifts = useMemo(() => {
    if (!shifts) return [];
    let result = [...shifts];

    // Filter by schicht
    if (filterSchicht !== 'all') {
      result = result.filter(s => s.schicht === filterSchicht);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.notiz?.toLowerCase().includes(q) ||
        formatDate(s.datum).includes(q) ||
        getWeekday(s.datum).toLowerCase().includes(q)
      );
    }

    // Sort
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
      {/* Header */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Historie</h1>
        <span className="text-text-muted text-sm ml-auto">{filteredShifts.length} Einträge</span>
      </div>

      <div className="px-6 space-y-4">
        {/* Search */}
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

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {/* Sort */}
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

          {/* Schicht Filter */}
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

        {/* List */}
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

                  <div className="flex-1 min-w-0">
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

                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-positive font-bold">{formatCurrency(shift.betrag)}</p>
                    <button
                      onClick={() => setDeleteConfirm(shift.id)}
                      className="text-text-muted hover:text-negative transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Delete Confirm */}
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
