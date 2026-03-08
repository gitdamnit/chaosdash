import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/useAppState';
import { useTheme } from 'next-themes';
import { Download, Upload, AlertTriangle, Bell, CheckCircle, Clock, Sun, Moon, Info, Smartphone } from 'lucide-react';

const NOTIF_KEY = 'chaos-notification-prefs';

function loadNotifPrefs() {
  try {
    const s = localStorage.getItem(NOTIF_KEY);
    return s ? JSON.parse(s) : { enabled: false, routineHour: 20, taskReminders: true };
  } catch { return { enabled: false, routineHour: 20, taskReminders: true }; }
}

export default function Settings() {
  const { exportData, importData, resetData, routines, tasks } = useApp();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prefs, setPrefs] = useState(loadNotifPrefs);
  const [permState, setPermState] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    if ('Notification' in window) setPermState(Notification.permission);
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermState(result);
    if (result === 'granted') setPrefs((p: any) => ({ ...p, enabled: true }));
  };

  const sendTest = () => {
    if (Notification.permission !== 'granted') return;
    new Notification('ChaosDash Reminder 🧠', { body: 'This is what your reminders look like.', icon: '/favicon.png' });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chaosdash-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = ev.target?.result as string;
        JSON.parse(json); // validate
        if (confirm('This will replace all current data. Continue?')) {
          importData(json);
          setImportSuccess(true);
          setImportError('');
          setTimeout(() => setImportSuccess(false), 3000);
        }
      } catch {
        setImportError('Invalid JSON file. Make sure you\'re importing a ChaosDash backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('This will wipe all your data and restore the sample content. Are you absolutely sure?')) {
      resetData();
      alert('Reset complete. Sample data restored.');
    }
  };

  const isGranted = permState === 'granted';
  const isDenied = permState === 'denied';
  const pendingRoutines = routines.filter(r => r.type === 'daily' && !(r.lastCompleted && Date.now() - r.lastCompleted < 86400000));
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < Date.now());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Everything stays in your browser. No account, no cloud, no tracking.</p>
      </header>

      {/* Appearance */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />} Appearance
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
          >
            <div className="w-12 h-8 bg-gray-900 rounded-md border border-gray-700 flex items-center justify-center">
              <Moon className="w-4 h-4 text-gray-300" />
            </div>
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`}>Dark</span>
            {theme === 'dark' && <CheckCircle className="w-4 h-4 text-primary" />}
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
          >
            <div className="w-12 h-8 bg-white rounded-md border border-gray-200 flex items-center justify-center">
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <span className={`text-sm font-medium ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`}>Light</span>
            {theme === 'light' && <CheckCircle className="w-4 h-4 text-primary" />}
          </button>
        </div>
      </section>

      {/* Reminders */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Reminders</h2>
        {'Notification' in window ? (
          isDenied ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-muted-foreground">
              Notification permission was denied. Go to your browser settings to re-enable it for this site, then refresh.
            </div>
          ) : !isGranted ? (
            <button onClick={requestPermission} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-sm">
              <Bell className="w-4 h-4" /> Enable Reminders
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Notifications enabled
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Daily routine reminder</p>
                  <p className="text-xs text-muted-foreground">Nudge if daily routines are incomplete</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    value={prefs.routineHour}
                    onChange={e => setPrefs((p: any) => ({ ...p, routineHour: +e.target.value }))}
                    className="bg-background border border-border rounded-lg px-2 py-1 text-sm outline-none"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 7).map(h => (
                      <option key={h} value={h}>{h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Overdue task nudges</p>
                  <p className="text-xs text-muted-foreground">Remind me about overdue tasks</p>
                </div>
                <button
                  onClick={() => setPrefs((p: any) => ({ ...p, taskReminders: !p.taskReminders }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${prefs.taskReminders ? 'bg-primary' : 'bg-secondary'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${prefs.taskReminders ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p>· {pendingRoutines.length} daily routine{pendingRoutines.length !== 1 ? 's' : ''} still pending today</p>
                <p>· {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}</p>
                <p className="pt-1 italic">Reminders only fire when this app tab is open.</p>
              </div>
              <button onClick={sendTest} className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm font-medium transition-colors ${testSent ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}>
                {testSent ? <CheckCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                {testSent ? 'Test sent!' : 'Send test notification'}
              </button>
            </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Browser notifications not supported. Try Chrome or Edge.</p>
        )}
      </section>

      {/* Install as App (PWA) */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Smartphone className="w-5 h-5 text-primary" /> Install on Android / Desktop</h2>
        <p className="text-sm text-muted-foreground">ChaosDash works as a standalone app — no app store needed.</p>
        <div className="space-y-2 text-sm">
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <p className="font-medium">Android (Chrome):</p>
            <p className="text-muted-foreground">Tap the three-dot menu → "Add to Home screen". It will install like a real app with its own icon.</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <p className="font-medium">Desktop (Chrome / Edge):</p>
            <p className="text-muted-foreground">Click the install icon in the address bar (rightmost), or go to menu → "Install ChaosDash".</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <p className="font-medium">Voice input:</p>
            <p className="text-muted-foreground">Tap the mic button in Quick Capture. Works on Android Chrome and desktop Chrome/Edge. For best results, speak clearly after the mic turns red.</p>
          </div>
        </div>
      </section>

      {/* Keyboard shortcuts */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Info className="w-5 h-5 text-primary" /> Keyboard Shortcuts</h2>
        <div className="space-y-2 text-sm">
          {[
            { keys: 'Ctrl+Shift+K', desc: 'Open Quick Capture from anywhere' },
            { keys: 'Enter', desc: 'Submit Quick Capture' },
            { keys: 'Esc', desc: 'Close any modal or overlay' },
          ].map(s => (
            <div key={s.keys} className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono whitespace-nowrap">{s.keys}</kbd>
              <span className="text-muted-foreground">{s.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Data & Backup */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Download className="w-5 h-5 text-primary" /> Data & Backup</h2>
        <p className="text-sm text-muted-foreground">All your data lives in your browser's local storage. Export it regularly to avoid losing it if you clear your browser.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-sm">Export Backup</h3>
            <p className="text-xs text-muted-foreground">Download a JSON file with all your tasks, goals, routines, and settings.</p>
            <button onClick={handleExport} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
              <Download className="w-4 h-4" /> Download JSON
            </button>
          </div>

          <div className="border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-sm">Import Backup</h3>
            <p className="text-xs text-muted-foreground">Restore from a previously exported JSON file. This will replace all current data.</p>
            {importSuccess && <p className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Data imported successfully!</p>}
            {importError && <p className="text-xs text-destructive">{importError}</p>}
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileImport} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Upload className="w-4 h-4" /> Choose File
            </button>
          </div>
        </div>
      </section>

      {/* Integrations note */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-lg">Google & Microsoft Sync</h2>
        <p className="text-sm text-muted-foreground">Syncing with Gmail, Outlook, Google Drive, OneDrive, To-Do, and Keep Notes requires OAuth authorization with those services. This is on the roadmap.</p>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
          <p className="font-medium text-primary mb-1">Coming soon:</p>
          <ul className="text-muted-foreground space-y-0.5 text-xs">
            <li>· Import tasks from Google Tasks & Microsoft To-Do</li>
            <li>· Sync calendar with Google Calendar & Outlook</li>
            <li>· Attach files from Google Drive & OneDrive</li>
            <li>· Import notes from Google Keep</li>
          </ul>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-destructive flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</h2>
        <p className="text-sm text-muted-foreground">Reset everything back to the sample starter data. This cannot be undone — export first if you want to keep anything.</p>
        <button onClick={handleReset} className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors">
          Factory Reset
        </button>
      </section>
    </div>
  );
}
