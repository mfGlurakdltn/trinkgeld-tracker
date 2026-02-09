import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShifts } from '@/hooks/useShifts';
import { ArrowLeft, LogOut, Download, User, Info, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: shifts } = useShifts();

  const handleExport = () => {
    if (!shifts || shifts.length === 0) return;

    const headers = ['Datum', 'Wochentag', 'Betrag (€)', 'Schicht', 'Mitarbeiter', 'Umsatz (€)', '€/Stunde', 'Tip %', 'Notiz'];
    const rows = shifts.map(s => [
      s.datum,
      s.wochentag,
      s.betrag,
      s.schicht === 'f' ? 'Früh' : s.schicht === 's' ? 'Spät' : '',
      s.mitarbeiter || '',
      s.umsatz || '',
      s.euro_pro_stunde,
      s.tip_prozent,
      s.notiz || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trinkgeld-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold">Profil</h1>
      </div>

      <div className="px-6 space-y-4">
        {/* User Card */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <User size={22} className="text-accent" />
            </div>
            <div>
              <p className="font-semibold">{user?.email?.split('@')[0]}</p>
              <p className="text-text-muted text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="glass rounded-2xl overflow-hidden">
          <button
            onClick={handleExport}
            disabled={!shifts || shifts.length === 0}
            className="w-full flex items-center gap-4 p-4 hover:bg-bg-card/50 transition-colors disabled:opacity-40"
          >
            <Download size={18} className="text-accent" />
            <div className="text-left flex-1">
              <p className="font-medium text-sm">Daten exportieren</p>
              <p className="text-text-muted text-xs">CSV-Download aller Schichten</p>
            </div>
          </button>
        </div>

        {/* App Info */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <Info size={18} className="text-text-muted" />
            <div className="flex-1">
              <p className="text-text-secondary text-sm">Trinkgeld Tracker</p>
              <p className="text-text-muted text-xs">Version 1.0 • Made with ❤️</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-negative/5 transition-colors group"
        >
          <LogOut size={18} className="text-negative" />
          <p className="text-negative font-medium text-sm">Abmelden</p>
        </button>
      </div>
    </div>
  );
}
