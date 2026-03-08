import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/useAppState';
import { Users, Play, Pause, RotateCcw, Check, X, Clock } from 'lucide-react';

const FOCUS_TIPS = [
  "Put your phone face down.",
  "Close unnecessary browser tabs.",
  "Get a glass of water before you start.",
  "Tell yourself: 'I just need to start.'",
  "You don't have to finish. Just begin.",
];

function useSimulatedUsers() {
  const [count, setCount] = useState(() => Math.floor(Math.random() * 30) + 12);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(8, Math.min(60, c + delta));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  return count;
}

function useWhiteNoise(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (active) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = 0.04;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      nodeRef.current = source;
      gainRef.current = gain;
    } else {
      nodeRef.current?.stop();
      ctxRef.current?.close();
      nodeRef.current = null;
      ctxRef.current = null;
    }
    return () => {
      nodeRef.current?.stop();
      ctxRef.current?.close();
    };
  }, [active]);
}

function TimerRing({ totalSeconds, timeLeft }: { totalSeconds: number; timeLeft: number }) {
  const pct = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const r = 70;
  const circumference = 2 * Math.PI * r;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
        <circle
          cx="90" cy="90" r={r} fill="none" stroke="currentColor" strokeWidth="8"
          className="text-primary transition-all duration-1000"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * pct) / 100}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-mono font-bold">{mins}:{secs.toString().padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground mt-1">remaining</span>
      </div>
    </div>
  );
}

export default function BodyDouble() {
  const { bodyDoubleSessions, setBodyDoubleSessions } = useApp();
  const activeUsers = useSimulatedUsers();

  const [phase, setPhase] = useState<'setup' | 'session' | 'checkin' | 'done'>('setup');
  const [intention, setIntention] = useState('');
  const [durationMins, setDurationMins] = useState(25);
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [whiteNoise, setWhiteNoise] = useState(false);
  const [goalMet, setGoalMet] = useState<boolean | null>(null);
  const [tip] = useState(() => FOCUS_TIPS[Math.floor(Math.random() * FOCUS_TIPS.length)]);

  useWhiteNoise(whiteNoise && phase === 'session');

  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setPhase('checkin');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, timeLeft]);

  const startSession = () => {
    if (!intention.trim()) return;
    setTimeLeft(durationMins * 60);
    setRunning(true);
    setPhase('session');
  };

  const finishCheckin = (completed: boolean) => {
    setGoalMet(completed);
    const session = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      intention: intention.trim(),
      durationMinutes: durationMins,
      completed,
    };
    setBodyDoubleSessions(prev => [...prev, session]);
    setPhase('done');
  };

  const resetSession = () => {
    setPhase('setup');
    setIntention('');
    setRunning(false);
    setTimeLeft(0);
    setGoalMet(null);
    setWhiteNoise(false);
  };

  const completedCount = bodyDoubleSessions.filter(s => s.completed).length;
  const totalCount = bodyDoubleSessions.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" /> Body Double
        </h1>
        <p className="text-muted-foreground">Work alongside others virtually. Set an intention, commit to a session, check in when done.</p>
      </header>

      {/* Live room indicator */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-semibold text-green-600 dark:text-green-400">{activeUsers} people</span>
        </div>
        <span className="text-muted-foreground text-sm">are working right now · join them</span>
        {totalCount > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">{completedCount}/{totalCount} sessions completed</span>
        )}
      </div>

      {phase === 'setup' && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">What will you work on?</p>
            <input
              value={intention}
              onChange={e => setIntention(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && intention.trim() && startSession()}
              placeholder="Be specific: 'Write the first paragraph of my report'"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1.5">Tip: {tip}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">How long?</p>
            <div className="flex gap-2 flex-wrap">
              {[15, 25, 45, 60].map(m => (
                <button
                  key={m}
                  onClick={() => setDurationMins(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${durationMins === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'}`}
                >
                  {m} minutes
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setWhiteNoise(w => !w)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${whiteNoise ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground'}`}
            >
              🔊 {whiteNoise ? 'White noise on' : 'White noise off'}
            </button>
          </div>

          <button
            onClick={startSession}
            disabled={!intention.trim()}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-base disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" /> Start session · join {activeUsers} others
          </button>
        </div>
      )}

      {phase === 'session' && (
        <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Working on</p>
            <p className="font-semibold text-lg">"{intention}"</p>
          </div>

          <TimerRing totalSeconds={durationMins * 60} timeLeft={timeLeft} />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {activeUsers} others are working alongside you
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setRunning(r => !r)}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-muted-foreground rounded-xl font-medium text-sm hover:bg-secondary/80 transition-colors"
            >
              {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
            </button>
            <button
              onClick={() => setPhase('checkin')}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-muted-foreground rounded-xl font-medium text-sm hover:bg-secondary/80 transition-colors"
            >
              <Check className="w-4 h-4" /> I'm done
            </button>
          </div>
        </div>
      )}

      {phase === 'checkin' && (
        <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center gap-6 text-center">
          <div className="text-5xl">⏱️</div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Session complete!</h2>
            <p className="text-muted-foreground">You set out to: <em>"{intention}"</em></p>
          </div>
          <p className="font-semibold text-lg">Did you achieve your goal?</p>
          <div className="flex gap-4">
            <button onClick={() => finishCheckin(true)} className="flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-xl font-semibold hover:bg-green-500/20 transition-colors">
              <Check className="w-5 h-5" /> Yes, I did it!
            </button>
            <button onClick={() => finishCheckin(false)} className="flex items-center gap-2 px-6 py-3 bg-secondary border border-border text-muted-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-colors">
              <X className="w-5 h-5" /> Partially / No
            </button>
          </div>
          <p className="text-xs text-muted-foreground">No judgement. Either answer is honest and useful.</p>
        </div>
      )}

      {phase === 'done' && (
        <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center gap-5 text-center">
          <div className="text-6xl">{goalMet ? '🎉' : '💚'}</div>
          <div>
            <h2 className="text-2xl font-bold mb-2">{goalMet ? 'Great work!' : 'You showed up. That counts.'}</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {goalMet
                ? 'You completed your session and hit your goal. The fact you sat down and did the work matters most.'
                : "Partial progress is still progress. ADHD makes follow-through hard. The fact you tried is what matters."}
            </p>
          </div>
          <button onClick={resetSession} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold">
            Start another session
          </button>
        </div>
      )}

      {bodyDoubleSessions.length > 0 && phase === 'setup' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Past sessions
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...bodyDoubleSessions].reverse().slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center gap-3 text-sm py-2 border-b border-border/50 last:border-0">
                <span className="text-lg">{s.completed ? '✅' : '💙'}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{s.intention}</p>
                  <p className="text-xs text-muted-foreground">{s.durationMinutes}m · {new Date(s.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
