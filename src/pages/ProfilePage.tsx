import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShifts } from '@/hooks/useShifts';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, LogOut, Download, User, Info, Lock, Loader2, Check, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: shifts } = useShifts();

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Email change state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen haben');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Passwort erfolgreich geändert!');
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Ändern des Passworts');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Bitte gib eine gültige Email ein');
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('Bestätigungsmail gesendet! Prüfe dein Postfach.');
      setShowEmailForm(false);
      setNewEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Ändern der Email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleExport = () => {
    if (!shifts || shifts.length === 0) return;

    // Sort by date ascending for the export
    const sorted = [...shifts].sort((a, b) =>
      new Date(a.datum).getTime() - new Date(b.datum).getTime()
    );

    const headers = [
      'Datum',
      'Wochentag',
      'Schicht',
      'Mitarbeiter',
      'Trinkgeld (€)',
      'Umsatz (€)',
      '€/Stunde',
      'Tip-Rate (%)',
      'Notiz',
    ];

    const rows = sorted.map(s => {
      const schicht = s.schicht === 'f' ? 'Früh' : s.schicht === 's' ? 'Spät' : '';
      const ma = s.mitarbeiter ? s.mitarbeiter.toString().replace('.', ',') : '';
      const betrag = s.betrag.toFixed(2).replace('.', ',');
      const umsatz = s.umsatz ? s.umsatz.toFixed(2).replace('.', ',') : '';
      const eph = s.euro_pro_stunde ? s.euro_pro_stunde.toFixed(2).replace('.', ',') : '';
      const tip = s.tip_prozent && s.tip_prozent > 0 ? s.tip_prozent.toFixed(1).replace('.', ',') : '';
      const notiz = s.notiz ? `"${s.notiz.replace(/"/g, '""')}"` : '';

      return [
        formatDate(s.datum),
        s.wochentag?.trim() || '',
        schicht,
        ma,
        betrag,
        umsatz,
        eph,
        tip,
        notiz,
      ];
    });

    const csv = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trinkgeld-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportiert!');
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
        <div className="glass rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <User size={22} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-semibold capitalize">{user?.email?.split('@')[0]}</p>
              <p className="text-text-muted text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in animate-fade-in-delay-1">
          {/* Email ändern */}
          <button
            onClick={() => { setShowEmailForm(!showEmailForm); setShowPasswordForm(false); }}
            className="w-full flex items-center gap-4 p-4 hover:bg-bg-card/50 transition-colors border-b border-border"
          >
            <Mail size={18} className="text-accent" />
            <div className="text-left flex-1">
              <p className="font-medium text-sm">Email ändern</p>
              <p className="text-text-muted text-xs">{user?.email}</p>
            </div>
          </button>

          {showEmailForm && (
            <div className="p-4 space-y-3 bg-bg-secondary/30 animate-fade-in">
              <div>
                <label className="text-text-muted text-xs mb-1 block">Neue Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="neue@email.de"
                  className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowEmailForm(false); setNewEmail(''); }}
                  className="flex-1 py-2.5 rounded-lg text-xs bg-bg-secondary text-text-secondary font-medium"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleEmailChange}
                  disabled={emailLoading || !newEmail}
                  className="flex-1 py-2.5 rounded-lg text-xs bg-accent text-white font-medium disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {emailLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Ändern
                </button>
              </div>
            </div>
          )}

          {/* Passwort ändern */}
          <button
            onClick={() => { setShowPasswordForm(!showPasswordForm); setShowEmailForm(false); }}
            className="w-full flex items-center gap-4 p-4 hover:bg-bg-card/50 transition-colors"
          >
            <Lock size={18} className="text-accent" />
            <div className="text-left flex-1">
              <p className="font-medium text-sm">Passwort ändern</p>
              <p className="text-text-muted text-xs">Mindestens 6 Zeichen</p>
            </div>
          </button>

          {showPasswordForm && (
            <div className="p-4 space-y-3 bg-bg-secondary/30 animate-fade-in">
              <div>
                <label className="text-text-muted text-xs mb-1 block">Neues Passwort</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="text-text-muted text-xs mb-1 block">Passwort bestätigen</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-negative text-xs">Passwörter stimmen nicht überein</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); }}
                  className="flex-1 py-2.5 rounded-lg text-xs bg-bg-secondary text-text-secondary font-medium"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="flex-1 py-2.5 rounded-lg text-xs bg-accent text-white font-medium disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {passwordLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Speichern
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Export */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in animate-fade-in-delay-2">
          <button
            onClick={handleExport}
            disabled={!shifts || shifts.length === 0}
            className="w-full flex items-center gap-4 p-4 hover:bg-bg-card/50 transition-colors disabled:opacity-40"
          >
            <Download size={18} className="text-accent" />
            <div className="text-left flex-1">
              <p className="font-medium text-sm">Daten exportieren</p>
              <p className="text-text-muted text-xs">
                CSV-Download {shifts && shifts.length > 0 ? `(${shifts.length} Einträge)` : ''}
              </p>
            </div>
          </button>
        </div>

        {/* App Info */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in animate-fade-in-delay-2">
          <div className="flex items-center gap-4 p-4">
            <Info size={18} className="text-text-muted" />
            <div className="flex-1">
              <p className="text-text-secondary text-sm">Trinkgeld Tracker</p>
              <p className="text-text-muted text-xs">Version 1.0</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-negative/5 transition-colors group animate-fade-in animate-fade-in-delay-3"
        >
          <LogOut size={18} className="text-negative" />
          <p className="text-negative font-medium text-sm">Abmelden</p>
        </button>
      </div>
    </div>
  );
}
