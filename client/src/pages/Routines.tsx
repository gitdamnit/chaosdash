import React, { useState, useEffect, useRef } from 'react';
import { useApp, Routine, RoutineStep } from '@/lib/useAppState';
import { Check, Flame, Plus, Play, ChevronDown, ChevronRight, Trash2, Timer, X, SkipForward, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const WEEKLY_RESET_STEPS = [
  { id: 1, emoji: '📥', label: 'Clear your task inbox to zero', detail: 'Move every item to Do Now, Projects, or trash it.' },
  { id: 2, emoji: '🗂️', label: 'Review your projects & in-progress work', detail: 'What moved forward this week? What is still stuck?' },
  { id: 3, emoji: '🔄', label: 'Review your routines and habit grid', detail: 'Which routines served you? Any to tweak or drop?' },
  { id: 4, emoji: '🎯', label: 'Set 3 priorities for next week', detail: 'Write your 3 most important outcomes for the coming week.' },
  { id: 5, emoji: '💚', label: 'Do something kind for yourself', detail: 'Schedule one thing that restores your energy.' },
];

function WeeklyResetModal({ onClose }: { onClose: () => void }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const done = checked.size === WEEKLY_RESET_STEPS.length;

  const toggle = (id: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleComplete = () => {
    localStorage.setItem('chaos-weekly-reset-date', new Date().toISOString());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Weekly Reset</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-muted-foreground mb-4">A quick guided review to close out the week and set up for the next one. Check each step as you go.</p>
          {WEEKLY_RESET_STEPS.map(step => (
            <button
              key={step.id}
              onClick={() => toggle(step.id)}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${checked.has(step.id) ? 'bg-primary/10 border-primary/30' : 'bg-secondary/30 border-border hover:border-primary/30'}`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${checked.has(step.id) ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                {checked.has(step.id) && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </div>
              <div>
                <p className={`font-medium text-sm flex items-center gap-2 ${checked.has(step.id) ? 'line-through text-muted-foreground' : ''}`}>
                  <span>{step.emoji}</span> {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="px-6 pb-6">
          {done ? (
            <button onClick={handleComplete} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Week complete — see you next Sunday! 🎉
            </button>
          ) : (
            <p className="text-center text-sm text-muted-foreground">{WEEKLY_RESET_STEPS.length - checked.size} step{WEEKLY_RESET_STEPS.length - checked.size !== 1 ? 's' : ''} remaining</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StepTimer({ step, onComplete, onSkip }: { step: RoutineStep; onComplete: () => void; onSkip: () => void }) {
  const totalSeconds = (step.durationMinutes || 1) * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(intervalRef.current); onComplete(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const pct = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const circumference = 2 * Math.PI * 36;

  return (
    <div className="flex flex-col items-center justify-center py-6 gap-4">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
        <circle cx="48" cy="48" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary transition-all" strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * pct) / 100} strokeLinecap="round" />
      </svg>
      <div className="text-center -mt-16">
        <p className="text-2xl font-mono font-bold text-primary">{mins}:{secs.toString().padStart(2, '0')}</p>
      </div>
      <button onClick={onSkip} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <SkipForward className="w-3.5 h-3.5" /> Skip step
      </button>
    </div>
  );
}

function RunMode({ routine, onClose }: { routine: Routine; onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const steps = routine.steps;
  const current = steps[stepIndex];
  const isDone = stepIndex >= steps.length;

  const advance = () => {
    setCompleted(c => [...c, stepIndex]);
    setStepIndex(i => i + 1);
  };

  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No steps defined for this routine. Add steps first.</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-secondary rounded-lg text-sm">Close</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{routine.title}</p>
            <p className="text-sm text-muted-foreground">{isDone ? 'All done!' : `Step ${stepIndex + 1} of ${steps.length}`}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {!isDone ? (
          <div className="p-6 space-y-4">
            <div className="flex gap-1 mb-2">
              {steps.map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${i < stepIndex ? 'bg-green-500' : i === stepIndex ? 'bg-primary' : 'bg-secondary'}`} />
              ))}
            </div>
            <h2 className="text-2xl font-bold text-center py-4">{current.title}</h2>
            {current.durationMinutes ? (
              <StepTimer key={stepIndex} step={current} onComplete={advance} onSkip={advance} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-6">Take your time with this step.</p>
                <button onClick={advance} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium">
                  Done ✓
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold">Routine complete!</h2>
            <p className="text-muted-foreground">You finished all {steps.length} steps.</p>
            <button onClick={onClose} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HabitGrid({ routines }: { routines: Routine[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dailyRoutines = routines.filter(r => r.type === 'daily');
  if (dailyRoutines.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-500" />
        7-Day Habit Grid
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left font-normal text-muted-foreground pb-2 pr-4 text-xs">Habit</th>
              {days.map(d => {
                const dateObj = new Date(d + 'T00:00:00');
                const isToday = d === new Date().toISOString().split('T')[0];
                return (
                  <th key={d} className="pb-2 text-center min-w-[40px]">
                    <div className="text-[10px] text-muted-foreground">{dateObj.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className={`text-xs font-medium ${isToday ? 'text-primary' : ''}`}>{dateObj.getDate()}</div>
                  </th>
                );
              })}
              <th className="pb-2 text-center text-xs font-normal text-muted-foreground pl-2">Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {dailyRoutines.map(routine => {
              const completionDates = routine.completionDates || [];
              return (
                <tr key={routine.id}>
                  <td className="py-2 pr-4 text-xs font-medium truncate max-w-[120px]" title={routine.title}>{routine.title}</td>
                  {days.map(d => {
                    const done = completionDates.includes(d);
                    return (
                      <td key={d} className="py-2 text-center">
                        <div className={`w-7 h-7 rounded-md mx-auto flex items-center justify-center ${done ? 'bg-green-500/20 border border-green-500/40' : 'bg-secondary border border-border'}`}>
                          {done && <Check className="w-3.5 h-3.5 text-green-500" />}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-2 text-center pl-2">
                    <span className="font-mono font-bold text-xs text-orange-500 flex items-center justify-center gap-0.5">
                      <Flame className="w-3 h-3" />{routine.streak}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Routines() {
  const { routines, setRoutines } = useApp();
  const [newRoutine, setNewRoutine] = useState('');
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newStep, setNewStep] = useState({ title: '', duration: '' });
  const [runningRoutine, setRunningRoutine] = useState<Routine | null>(null);
  const [weeklyResetOpen, setWeeklyResetOpen] = useState(false);

  const lastResetDate = localStorage.getItem('chaos-weekly-reset-date');
  const daysSinceReset = lastResetDate
    ? Math.floor((Date.now() - new Date(lastResetDate).getTime()) / 86400000)
    : 999;
  const showResetPrompt = daysSinceReset >= 7;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutine.trim()) return;
    setRoutines([...routines, { id: Date.now().toString(), title: newRoutine.trim(), type, streak: 0, lastCompleted: null, steps: [] }]);
    setNewRoutine('');
  };

  const todayStr = () => new Date().toISOString().split('T')[0];

  const toggleComplete = (id: string) => {
    const now = Date.now();
    const today = todayStr();
    setRoutines(routines.map(r => {
      if (r.id !== id) return r;
      const isCompletedToday = r.lastCompleted && (now - r.lastCompleted < 86400000);
      const dates = r.completionDates || [];
      if (isCompletedToday) {
        return { ...r, streak: Math.max(0, r.streak - 1), lastCompleted: null, completionDates: dates.filter(d => d !== today) };
      }
      return { ...r, streak: r.streak + 1, lastCompleted: now, completionDates: [...dates.filter(d => d !== today), today] };
    }));
  };

  const deleteRoutine = (id: string) => setRoutines(routines.filter(r => r.id !== id));

  const addStep = (routineId: string) => {
    if (!newStep.title.trim()) return;
    const step: RoutineStep = {
      id: Date.now().toString(),
      title: newStep.title.trim(),
      durationMinutes: newStep.duration ? parseInt(newStep.duration) : null,
    };
    setRoutines(routines.map(r => r.id === routineId ? { ...r, steps: [...r.steps, step] } : r));
    setNewStep({ title: '', duration: '' });
  };

  const deleteStep = (routineId: string, stepId: string) => {
    setRoutines(routines.map(r => r.id === routineId ? { ...r, steps: r.steps.filter(s => s.id !== stepId) } : r));
  };

  const renderSection = (sectionType: 'daily' | 'weekly' | 'monthly') => {
    const filtered = routines.filter(r => r.type === sectionType);
    if (filtered.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold capitalize mb-4 text-muted-foreground border-b border-border pb-2">{sectionType} Routines</h2>
        <div className="space-y-3">
          {filtered.map(routine => {
            const isCompleted = routine.lastCompleted && (Date.now() - routine.lastCompleted < 86400000);
            const isExpanded = expandedId === routine.id;
            return (
              <div key={routine.id} className={`rounded-xl border transition-all ${isCompleted ? 'bg-secondary/20 border-green-500/20 opacity-80' : 'bg-card border-border shadow-sm'}`}>
                <div className="flex items-center gap-3 p-4">
                  <button onClick={() => toggleComplete(routine.id)} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground hover:border-primary'}`}>
                    {isCompleted && <Check className="w-4 h-4" />}
                  </button>
                  <span className={`font-medium text-lg flex-1 ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>{routine.title}</span>

                  <div className="flex items-center gap-2">
                    {routine.steps.length > 0 && (
                      <button onClick={() => setRunningRoutine(routine)} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors" title="Run step-by-step">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setExpandedId(isExpanded ? null : routine.id)} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Edit steps">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="flex items-center gap-1.5 bg-background px-2.5 py-1.5 rounded-full border border-border">
                      <Flame className={`w-3.5 h-3.5 ${routine.streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                      <span className="font-mono font-bold text-xs">{routine.streak}</span>
                    </div>
                    <button onClick={() => deleteRoutine(routine.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="border-t border-border p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <Timer className="w-3.5 h-3.5" /> Steps ({routine.steps.length})
                        </h4>
                        {routine.steps.map((step, i) => (
                          <div key={step.id} className="flex items-center gap-3 p-2.5 bg-secondary/30 rounded-lg">
                            <span className="w-5 h-5 bg-primary/20 text-primary text-xs font-bold rounded-full flex items-center justify-center shrink-0">{i + 1}</span>
                            <span className="flex-1 text-sm">{step.title}</span>
                            {step.durationMinutes && (
                              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{step.durationMinutes}m</span>
                            )}
                            <button onClick={() => deleteStep(routine.id, step.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <Input value={newStep.title} onChange={e => setNewStep(s => ({ ...s, title: e.target.value }))} placeholder="Step description" className="flex-1 h-9 text-sm bg-background" onKeyDown={e => e.key === 'Enter' && addStep(routine.id)} />
                          <Input value={newStep.duration} onChange={e => setNewStep(s => ({ ...s, duration: e.target.value }))} placeholder="mins" className="w-20 h-9 text-sm bg-background" type="number" min="1" />
                          <button onClick={() => addStep(routine.id)} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm hover:bg-primary/90">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {routine.steps.length > 0 && (
                          <button onClick={() => setRunningRoutine(routine)} className="w-full py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
                            <Play className="w-4 h-4" /> Run this routine step-by-step
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const brokenStreakRoutines = routines.filter(r =>
    r.type === 'daily' && r.streak > 0 && r.lastCompleted && (Date.now() - r.lastCompleted > 2 * 86400000)
  );

  const restartFresh = (id: string) => {
    setRoutines(routines.map(r => r.id === id ? { ...r, streak: 0, lastCompleted: null } : r));
  };

  return (
    <>
      {runningRoutine && <RunMode routine={runningRoutine} onClose={() => setRunningRoutine(null)} />}
      {weeklyResetOpen && <WeeklyResetModal onClose={() => setWeeklyResetOpen(false)} />}
      <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Habits & Routines</h1>
            <p className="text-muted-foreground">Break routines into steps. Run them guided with optional timers.</p>
          </div>
          <button
            onClick={() => setWeeklyResetOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shrink-0 transition-all ${showResetPrompt ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
          >
            <RefreshCw className="w-4 h-4" /> Weekly Reset
          </button>
        </header>

        {showResetPrompt && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl mt-0.5">🗓️</span>
            <div className="flex-1">
              <p className="font-semibold text-primary">Time for your weekly reset!</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {lastResetDate ? `It's been ${daysSinceReset} days since your last review.` : "You haven't done a weekly review yet."} It takes about 10 minutes and makes next week easier.
              </p>
            </div>
            <button onClick={() => setWeeklyResetOpen(true)} className="shrink-0 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              Let's go →
            </button>
          </div>
        )}

        {brokenStreakRoutines.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🌱</span>
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-300">Had a rough patch? That's okay.</p>
                <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-0.5">ADHD makes streaks hard. Every day you show up is a win. You can start fresh — no shame, no judgement.</p>
              </div>
            </div>
            <div className="space-y-2">
              {brokenStreakRoutines.map(r => (
                <div key={r.id} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                  <span className="flex-1 text-sm font-medium">{r.title}</span>
                  <span className="text-xs text-muted-foreground">streak was {r.streak}</span>
                  <button onClick={() => restartFresh(r.id)} className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-500/30 transition-colors">
                    Restart fresh ✨
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h3 className="font-semibold mb-3 text-sm">Add New Routine</h3>
          <form onSubmit={handleAdd} className="flex gap-3 flex-wrap sm:flex-nowrap">
            <Input value={newRoutine} onChange={e => setNewRoutine(e.target.value)} placeholder="e.g., Morning Launch Sequence..." className="flex-1 bg-background" />
            <select value={type} onChange={e => setType(e.target.value as any)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>
        </div>
        <HabitGrid routines={routines} />

        <div className="mt-2">
          {renderSection('daily')}
          {renderSection('weekly')}
          {renderSection('monthly')}
          {routines.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              No routines yet. Start with a simple morning checklist.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
