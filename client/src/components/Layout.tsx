import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import {
  AlertOctagon, CheckSquare, Flower2, KanbanSquare,
  Settings as SettingsIcon, Sun, Moon, Wand2, BookOpen,
  Heart, CalendarDays, ListChecks, Target, Smile, Crosshair,
  Play, Pause, Square, Timer, LogIn, LogOut, ShieldCheck, Users
} from 'lucide-react';
import { useApp } from '@/lib/useAppState';
import { useTheme } from 'next-themes';
import { QuickCapture, QuickCaptureFAB } from './QuickCapture';
import { FocusMode } from './FocusMode';
import { useAuth } from '@/hooks/use-auth';

const NAV_SECTIONS = [
  {
    label: 'Productivity',
    items: [
      { href: '/', icon: CheckSquare, label: 'Do Now & Inbox' },
      { href: '/projects', icon: KanbanSquare, label: 'Projects' },
      { href: '/planner', icon: CalendarDays, label: 'Day Planner' },
    ],
  },
  {
    label: 'ADHD Tools',
    items: [
      { href: '/fun-tools', icon: Wand2, label: 'Fun Tools' },
      { href: '/body-double', icon: Users, label: 'Body Doubling' },
      { href: '/mindfulness', icon: Heart, label: 'Calm Corner' },
      { href: '/research', icon: BookOpen, label: 'Research + Reading' },
    ],
  },
  {
    label: 'Life',
    items: [
      { href: '/routines', icon: ListChecks, label: 'Routines' },
      { href: '/goals', icon: Target, label: 'Goals' },
      { href: '/mood', icon: Smile, label: 'Mood Tracker' },
      { href: '/settings', icon: SettingsIcon, label: 'Settings' },
    ],
  },
];

const ALL_NAV = NAV_SECTIONS.flatMap(s => s.items);

function formatTimerTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location] = useLocation();
  const { panicMode, setPanicMode } = useApp();
  const { theme, setTheme } = useTheme();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // Persistent focus session state
  const [focusStartedAt, setFocusStartedAt] = useState<number | null>(null);
  const [focusDurationSecs, setFocusDurationSecs] = useState(25 * 60);
  const [focusPaused, setFocusPaused] = useState(false);
  const [focusPausedTimeLeft, setFocusPausedTimeLeft] = useState(0);
  const [focusIntention, setFocusIntention] = useState('');
  const [tick, setTick] = useState(0);

  const timeLeft = focusStartedAt
    ? focusPaused
      ? focusPausedTimeLeft
      : Math.max(0, focusDurationSecs - Math.floor((Date.now() - focusStartedAt) / 1000))
    : focusDurationSecs;

  useEffect(() => {
    if (!focusStartedAt || focusPaused) return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - focusStartedAt) / 1000);
      if (elapsed >= focusDurationSecs) {
        clearInterval(id);
        handleSessionComplete();
        setFocusStartedAt(null);
        setFocusPaused(false);
      } else {
        setTick(t => t + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [focusStartedAt, focusPaused, focusDurationSecs]);

  const startFocusSession = (durationMins: number, intention = '') => {
    setFocusDurationSecs(durationMins * 60);
    setFocusIntention(intention);
    setFocusStartedAt(Date.now());
    setFocusPaused(false);
  };

  const pauseSession = () => {
    setFocusPausedTimeLeft(timeLeft);
    setFocusPaused(true);
  };

  const resumeSession = () => {
    setFocusStartedAt(Date.now() - (focusDurationSecs - focusPausedTimeLeft) * 1000);
    setFocusPaused(false);
  };

  const stopSession = () => {
    setFocusStartedAt(null);
    setFocusPaused(false);
  };

  const handleSessionComplete = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus session complete! 🎯', { body: 'Great work — take a short break.' });
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyK') {
        e.preventDefault();
        e.stopPropagation();
        setCaptureOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true as any });
  }, []);

  if (panicMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden border border-destructive/20 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-destructive animate-pulse" />
          <div className="p-6 md:p-10">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-destructive flex items-center gap-3">
                <AlertOctagon className="w-8 h-8" /> PANIC MODE
              </h1>
              <button onClick={() => setPanicMode(false)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors">
                Exit Panic Mode
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    );
  }

  const sessionActive = !!focusStartedAt;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-60 bg-card border-b md:border-b-0 md:border-r border-border flex flex-col z-10 shrink-0">
        <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
          <img src="/adhdpenguin-logo.png" alt="ADHD Penguin" className="w-9 h-9 object-contain" />
          <h1 className="font-bold text-lg tracking-tight leading-none">ADHD<span className="text-blue-400">Penguin</span></h1>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto hidden md:block space-y-5">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="px-3 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 font-medium text-sm ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Mobile Nav */}
        <nav className="flex md:hidden overflow-x-auto px-3 pb-3 gap-1.5 no-scrollbar">
          {ALL_NAV.map(item => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium text-xs transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                <item.icon className="w-3.5 h-3.5" /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 mt-auto hidden md:block space-y-2 border-t border-border">
          {/* Admin link */}
          {user?.isAdmin && (
            <Link href="/admin" className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 font-medium text-sm ${location === '/admin' ? 'bg-primary text-primary-foreground' : 'text-amber-500 hover:bg-amber-500/10'}`}>
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Admin Panel
            </Link>
          )}
          {/* Auth section */}
          {authLoading ? (
            <div className="h-8 bg-secondary/50 rounded-lg animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/40">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary">{(user.username?.[0] ?? '?').toUpperCase()}</span>
              </div>
              <span className="text-xs text-foreground font-medium truncate flex-1" data-testid="text-username">
                {user.username}
              </span>
              <button onClick={() => logout()} className="text-muted-foreground hover:text-destructive transition-colors" title="Sign out" data-testid="button-signout">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {sessionActive && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-mono text-primary font-bold text-sm flex-1">{formatTimerTime(timeLeft)}</span>
              <button onClick={focusPaused ? resumeSession : pauseSession} className="text-primary/60 hover:text-primary transition-colors">
                {focusPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button onClick={stopSession} className="text-muted-foreground hover:text-destructive transition-colors">
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button onClick={() => setFocusOpen(true)} className="w-full py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg font-bold text-xs tracking-wide hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2">
            <Crosshair className="w-3.5 h-3.5" /> FOCUS MODE
          </button>
          <button onClick={() => setPanicMode(true)} className="w-full py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg font-bold text-xs tracking-wide hover:bg-destructive hover:text-destructive-foreground transition-all flex items-center justify-center gap-2">
            <AlertOctagon className="w-3.5 h-3.5" /> PANIC BUTTON
          </button>
          <button onClick={toggleTheme} className="w-full py-2 bg-secondary text-secondary-foreground rounded-lg font-medium text-xs hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2">
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <p className="text-center text-[10px] text-muted-foreground/40 pt-1">
            <kbd className="font-mono">Ctrl+Shift+K</kbd> quick capture
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto relative">
          <div className="md:hidden absolute top-3 right-3 flex gap-2 z-20">
            <button onClick={() => setFocusOpen(true)} className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center border border-primary/20">
              <Crosshair className="w-4 h-4" />
            </button>
            <button onClick={() => setPanicMode(true)} className="w-9 h-9 bg-destructive/10 text-destructive rounded-full flex items-center justify-center border border-destructive/20">
              <AlertOctagon className="w-4 h-4" />
            </button>
            <button onClick={toggleTheme} className="w-9 h-9 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <div className={`p-4 md:p-8 max-w-6xl mx-auto pb-28 md:pb-8 ${sessionActive ? 'mb-14' : ''}`}>
            {children}
          </div>
        </div>
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-1 px-6 py-3 bg-muted border-t-2 border-border text-xs font-medium text-foreground dark:text-white shrink-0">
          <span>© 2026 ADHDPenguin</span>
          <span>This project is dedicated to my BFF Kari ❤️</span>
        </footer>
      </main>

      {/* Persistent mini timer bar when session is running and focus mode is closed */}
      {sessionActive && !focusOpen && (
        <div className="fixed bottom-0 left-0 right-0 md:left-60 z-30 bg-card/95 backdrop-blur-sm border-t border-primary/20 px-4 py-2.5 flex items-center gap-3">
          <span className="text-lg">{focusPaused ? '⏸️' : '🎯'}</span>
          <span className="text-sm text-muted-foreground flex-1 truncate">{focusIntention || 'Focus session'}</span>
          <span className="font-mono font-bold text-primary text-sm">{formatTimerTime(timeLeft)}</span>
          <button onClick={focusPaused ? resumeSession : pauseSession} className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            {focusPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setFocusOpen(true)} className="px-3 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium hover:bg-primary/20 transition-colors">
            Open
          </button>
          <button onClick={stopSession} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Square className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <QuickCaptureFAB onClick={() => setCaptureOpen(true)} />
      <QuickCapture open={captureOpen} onClose={() => setCaptureOpen(false)} />
      <FocusMode
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        focusStartedAt={focusStartedAt}
        focusDurationSecs={focusDurationSecs}
        focusPaused={focusPaused}
        focusPausedTimeLeft={focusPausedTimeLeft}
        timeLeft={timeLeft}
        focusIntention={focusIntention}
        onStart={startFocusSession}
        onPause={pauseSession}
        onResume={resumeSession}
        onStop={stopSession}
      />
    </div>
  );
};

export default Layout;
