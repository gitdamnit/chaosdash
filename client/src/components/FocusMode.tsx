import React, { useState, useEffect } from 'react';
import { X, Check, ChevronRight, RotateCcw, Play, Pause, Square } from 'lucide-react';
import { useApp } from '@/lib/useAppState';

const MOTIVATIONAL = [
  "One thing at a time. You've got this.",
  "Progress beats perfection every time.",
  "Small steps still move you forward.",
  "You showed up. That already matters.",
  "Your brain works differently. That's okay.",
  "Done is better than perfect.",
  "Pick one thing. Just one.",
];


function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TimerRing({ timeLeft, totalSecs }: { timeLeft: number; totalSecs: number }) {
  const pct = totalSecs > 0 ? ((totalSecs - timeLeft) / totalSecs) * 100 : 0;
  const r = 52;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative">
      <svg width="136" height="136" className="-rotate-90">
        <circle cx="68" cy="68" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
        <circle
          cx="68" cy="68" r={r} fill="none" stroke="currentColor" strokeWidth="8"
          className="text-primary transition-all duration-1000"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * pct) / 100}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-mono font-bold text-white">{formatTime(timeLeft)}</span>
        <span className="text-xs text-white/50 mt-0.5">remaining</span>
      </div>
    </div>
  );
}

interface FocusModeProps {
  open: boolean;
  onClose: () => void;
  focusStartedAt: number | null;
  focusDurationSecs: number;
  focusPaused: boolean;
  focusPausedTimeLeft: number;
  timeLeft: number;
  focusIntention: string;
  onStart: (durationMins: number, intention?: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function FocusMode({
  open, onClose,
  focusStartedAt, focusDurationSecs, focusPaused, timeLeft, focusIntention,
  onStart, onPause, onResume, onStop,
}: FocusModeProps) {
  const { tasks, setTasks } = useApp();
  const [selectedMins, setSelectedMins] = useState(25);
  const [intention, setIntention] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [quote] = useState(() => MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)]);

  const sessionActive = !!focusStartedAt;
  const doNowTasks = tasks.filter(t => t.status === 'do_now');

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const markDone = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' as const } : t));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs uppercase tracking-widest">Focus Mode</span>
        </div>
        <button onClick={onClose} className="p-2 text-white/40 hover:text-white/80 rounded-xl hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 max-w-xl mx-auto w-full">
        <p className="text-white/60 text-base italic text-center">"{quote}"</p>

        {!sessionActive ? (
          <>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest text-center mb-3">What will you work on? (optional)</p>
              <input
                value={intention}
                onChange={e => setIntention(e.target.value)}
                placeholder="e.g. Write the first paragraph..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-primary/60 mb-4"
              />
              <p className="text-white/50 text-xs uppercase tracking-widest text-center mb-3">Duration</p>
              <div className="flex items-center gap-2 justify-center flex-wrap">
                {[15, 25, 45, 60].map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMins(m)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedMins === m ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => onStart(selectedMins, intention)}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold text-base flex items-center gap-2"
            >
              <Play className="w-5 h-5" /> Start {selectedMins}m Session
            </button>
            <p className="text-white/20 text-xs">The timer runs in the background if you close this overlay</p>
          </>
        ) : (
          <>
            {focusIntention && (
              <div className="text-center">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Working on</p>
                <p className="text-white font-medium">"{focusIntention}"</p>
              </div>
            )}
            <TimerRing timeLeft={timeLeft} totalSecs={focusDurationSecs} />
            <div className="flex gap-3">
              <button
                onClick={focusPaused ? onResume : onPause}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
              >
                {focusPaused ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
              </button>
              <button
                onClick={onStop}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/10 text-white/60 text-sm hover:bg-white/20 transition-colors"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            </div>
            <p className="text-white/30 text-xs text-center">Timer keeps running when you close this overlay — check the sidebar or bottom bar.</p>
          </>
        )}

        <div className="w-full space-y-3">
          <p className="text-white/40 text-xs uppercase tracking-widest">Your Focus Tasks</p>
          {doNowTasks.length === 0 ? (
            <div className="text-center py-6 text-white/30 border border-white/10 rounded-xl">
              No tasks in "Do Now". Add some on the Home page.
            </div>
          ) : (
            <div className="space-y-2">
              {doNowTasks.map((task, i) => (
                <div key={task.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <span className="text-white/30 text-sm font-mono">{i + 1}</span>
                  <span className="flex-1 text-white text-sm">{task.title}</span>
                  <button
                    onClick={() => markDone(task.id)}
                    className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/40 hover:border-green-400 hover:text-green-400 hover:bg-green-400/10 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Next physical action</p>
          <div className="flex gap-2">
            <input
              value={nextAction}
              onChange={e => setNextAction(e.target.value)}
              placeholder="e.g. Open the email app and type the first line..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-primary/60"
            />
            <button className="p-2.5 rounded-xl bg-white/10 text-white/60 hover:bg-white/20">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white/20 text-xs mt-1.5">Writing it out makes it concrete and easier to start.</p>
        </div>
      </div>
    </div>
  );
}
