import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShifts } from '@/hooks/useShifts';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft, LogOut, Download, User, Info, Lock, Loader2, Check, Mail,
  Clock, UserCog, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_SHIFT_HOURS = 5.5;

type Tab = 'profil' | 'einstellungen';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: shifts } = useShifts();

  const [tab, setTab] = useState<Tab>('profil');

  // Collapsible section state
  const [openSection, setOpenSection] = useState<
    'name' | 'arbeitszeit' | 'email' | 'passwort' | null
  >(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const currentDisplayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    '';
  const currentArbeitszeit =
    Number(user?.user_metadata?.default_arbeitszeit) || DEFAULT_SHIFT_HOURS;

  // Form state
  const [newName, setNewName] = useState(currentDisplayName);
  const [nameLoading, setNameLoading] = useState(false);
  const [newArbeitszeit, setNewArbeitszeit] = useState(currentArbeitszeit.toString());
  const [arbeitszeitLoading, setArbeitszeitLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const toggleSection = (section: 'name' | 'arbeitszeit' | 'email' | 'passwort') => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleNameChange = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error('Name darf nicht leer sein');
      return;
    }
    setNameLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: trimmed },
      });
      if (error) throw error;
      toast.success('Profilname geändert!');
      setOpenSection(null);
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Ändern des Namens');
    } finally {
      setNameLoading(false);
    }
  };

  const handleArbeitszeitChange = async () => {
    const n = parseFloat(newArbeitszeit);
    if (!n || n <= 0 || n > 24) {
      toast.error('Bitte eine gültige Stundenzahl eingeben');
      return;
    }
    setArbeitszeitLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { default_arbeitszeit: n },
      });
      if (error) throw error;
      toast.success('Standard-Arbeitszeit gespeichert!');
      setOpenSection(null);
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Speichern');
    } finally {
      setArbeitszeitLoading(false);
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
      setOpenSection(null);
      setNewEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Ändern der Email');
    } finally {
      setEmailLoading(false);
    }
  };

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
      setOpenSection(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Ändern des Passworts');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExport = () => {
    if (!shifts || shifts.length === 0) return;
    const sorted = [...shifts].sort(
      (a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime()
    );
    const headers = [
      'Datum', 'Wochentag', 'Schicht', 'Mitarbeiter',
      'Trinkgeld (€)', 'Umsatz (€)', 'Arbeitszeit (h)', '€/Stunde', 'Tip-Rate (%)', 'Notiz',
    ];
    const rows = sorted.map(s => {
      const schicht = s.schicht === 'f' ? 'Früh' : s.schicht === 's' ? 'Spät' : '';
      const ma = s.mitarbeiter ? s.mitarbeiter.toString().replace('.', ',') : '';
      const betrag = s.betrag.toFixed(2).replace('.', ',');
      const umsatz = s.umsatz ? s.umsatz.toFixed(2).replace('.', ',') : '';
      const az = s.arbeitszeit ? s.arbeitszeit.toString().replace('.', ',') : '';
      const eph = s.euro_pro_stunde ? s.euro_pro_stunde.toFixed(2).replace('.', ',') : '';
      const tip = s.tip_prozent && s.tip_prozent > 0 ? s.tip_prozent.toFixed(1).replace('.', ',') : '';
      const notiz = s.notiz ? `"${s.notiz.replace(/"/g, '""')}"` : '';
      return [
        formatDate(s.datum),
        s.wochentag?.trim() || '',
        schicht, ma, betrag, umsatz, az, eph, tip, notiz,
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
        {/* Tabs */}
        <div className="flex bg-bg-secondary rounded-xl p-1">
          {[
            { key: 'profil' as Tab, label: 'Profil' },
            { key: 'einstellungen' as Tab, label: 'Einstellungen' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setOpenSection(null); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'profil' && (
          <>
            {/* User Card */}
            <div className="glass rounded-2xl p-5 animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <User size={22} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{currentDisplayName}</p>
                  <p className="text-text-muted text-sm truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="glass rounded-2xl overflow-hidden animate-fade-in animate-fade-in-delay-1">
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

            {/* App Info (click to expand) */}
            <div className="glass rounded-2xl overflow-hidden animate-fade-in animate-fade-in-delay-2">
              <button
                onClick={() => setInfoOpen(!infoOpen)}
                className="w-full flex items-center gap-4 p-4 hover:bg-bg-card/50 transition-colors text-left"
              >
                <Info size={18} className="text-text-muted" />
                <div className="flex-1">
                  <p className="text-text-secondary text-sm">Trinkgeld Tracker</p>
                  <p className="text-text-muted text-xs">Version 1.5</p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-text-muted transition-transform ${infoOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {infoOpen && (
                <div className="px-4 pb-4 pt-1 text-sm text-text-secondary leading-relaxed animate-fade-in">
                  Hi, ich bin Mischa. Ich habe diese App mit Claude gemacht und hoffe, sie gefällt dir.
                  <br />
                  <span className="text-text-muted">PS: Besuche die Hamburgerei Augsburg ❤️</span>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="w-full glass rounded-2xl p-4 flex items-center gap-4 hover:bg-negative/5 transition-colors group animate-fade-in animate-fade-in-delay-3"
            >
              <LogOut size={18} className="text-negative" />
              <p className="text-negative font-medium text-sm">Abmelden</p>
            </button>
          </>
        )}

        {tab === 'einstellungen' && (
          <div className="glass rounded-2xl overflow-hidden animate-fade-in">
            {/* Profilname */}
            <button
              onClick={() => toggleSection('name')}
              className="w-full flex items-center gap-4 p-4 hover:bg-bg-card/50 transition-colors border-b border-border"
            >
              <UserCog size={18} className="text-accent" />
              <div className="text-left flex-1">
                <p className="font-medium text-sm">Profilname</p>
                <p className="text-text-muted text-xs">{currentDisplayName}</p>
              </div>
              <ChevronDown
                size={14}
                className={`text-text-muted transition-transform ${openSection === 'name' ? 'rotate-180' : ''}`}
              />
            </button>
            {openSection === 'name' && (
              <div className="p-4 space-y-3 bg-bg-secondary/30 border-b border-border animate-fade-in">
                <div>
                  <label className="text-text-muted text-xs mb-1 block">Neuer Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    maxLength={50}
                    placeholder="Dein Name"
                    className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setOpenSection(null); setNewName(currentDisplayName); }}
                    className="flex-1 py-2.5 rounded-lg text-xs bg-bg-secondary text-text-secondary font-medium"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleNameChange}
                    disabled={nameLoading || !newName.trim() || newName.trim() === currentDisplayName}
                    className="flex-1 py-2.5 rounded-lg text-xs bg-accent text-white font-medium disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    {nameLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Speichern
                  </button>
                </div>
              </div>
            )}

            {/* Default Arbeitszeit */}
            <button
              onClick={() => toggleSection('arbeitszeit')}
              className="w-full flex items-center gap-4 p-4 hover:bg-bg-card/50 transition-colors border-b border-border"
            >
              <Clock size={18} className="text-accent" />
              <div className="text-left flex-1">
                <p className="font-medium text-sm">Standard-Arbeitszeit</p>
                <p className="text-text-muted text-xs">{currentArbeitszeit} Stunden pro Schicht</p>
              </div>
              <ChevronDown
                size={14}
                className={`text-text-muted transition-transform ${openSection === 'arbeitszeit' ? 'rotate-180' : ''}`}
              />
            </button>
            {openSection === 'arbeitszeit' && (
              <div className="p-4 space-y-3 bg-bg-secondary/30 border-b border-border animate-fade-in">
                <div>
                  <label className="text-text-muted text-xs mb-1 block">Stunden pro Schicht</label>
                  <input
                    type="number"
                    value={newArbeitszeit}
                    onChange={e => setNewArbeitszeit(e.target.value)}
                    min="0.1"
                    max="24"
                    step="0.25"
                    className="w-full bg-bg-secondary border border-[#2D3E5F] rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setOpenSection(null); setNewArbeitszeit(currentArbeitszeit.toString()); }}
                    className="flex-1 py-2.5 rounded-lg text-xs bg-bg-secondary text-text-secondary font-medium"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleArbeitszeitChange}
                    disabled={arbeitszeitLoading || parseFloat(newArbeitszeit) === currentArbeitszeit}
                    className="flex-1 py-2.5 rounded-lg text-xs bg-accent text-white font-medium disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    {arbeitszeitLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Speichern
                  </button>
                </div>
              </div>
            )}

            {/* Email */}
            <button
              onClick={() => toggleSection('email')}
              className="w-full flex items-center gap-4 p-4 hover:bg-bg-card/50 transition-colors border-b border-border"
            >
              <Mail size={18} className="text-accent" />
              <div className="text-left flex-1">
                <p className="font-medium text-sm">Email ändern</p>
                <p className="text-text-muted text-xs truncate">{user?.email}</p>
              </div>
              <ChevronDown
                size={14}
                className={`text-text-muted transition-transform ${openSection === 'email' ? 'rotate-180' : ''}`}
              />
            </button>
            {openSection === 'email' && (
              <div className="p-4 space-y-3 bg-bg-secondary/30 border-b border-border animate-fade-in">
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
                    onClick={() => { setOpenSection(null); setNewEmail(''); }}
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

            {/* Passwort */}
            <button
              onClick={() => toggleSection('passwort')}
              className="w-full flex items-center gap-4 p-4 hover:bg-bg-card/50 transition-colors"
            >
              <Lock size={18} className="text-accent" />
              <div className="text-left flex-1">
                <p className="font-medium text-sm">Passwort ändern</p>
                <p className="text-text-muted text-xs">Mindestens 6 Zeichen</p>
              </div>
              <ChevronDown
                size={14}
                className={`text-text-muted transition-transform ${openSection === 'passwort' ? 'rotate-180' : ''}`}
              />
            </button>
            {openSection === 'passwort' && (
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
                    onClick={() => { setOpenSection(null); setNewPassword(''); setConfirmPassword(''); }}
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
        )}
      </div>
    </div>
  );
}
