import React, { useState } from 'react';
import { useApp, MoodEntry } from '@/lib/useAppState';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOODS = [
  { score: 1, emoji: '😞', label: 'Very Rough', color: 'from-red-500 to-red-400', bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-500' },
  { score: 2, emoji: '😕', label: 'Rough', color: 'from-orange-500 to-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-500' },
  { score: 3, emoji: '😐', label: 'Okay', color: 'from-yellow-500 to-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-500' },
  { score: 4, emoji: '😊', label: 'Good', color: 'from-green-400 to-emerald-400', bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-500' },
  { score: 5, emoji: '😄', label: 'Amazing', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-500' },
];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = todayStr();
  if (dateStr === today) return 'Today';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
}

function WeeklyChart({ moods }: { moods: MoodEntry[] }) {
  const days = getLast30Days();
  const moodMap = new Map(moods.map(m => [m.date, m]));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold mb-4">Last 30 Days</h3>
      <div className="flex items-end gap-0.5 h-20">
        {days.map(day => {
          const entry = moodMap.get(day);
          const mood = entry ? MOODS.find(m => m.score === entry.score) : null;
          return (
            <div key={day} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
              {mood ? (
                <>
                  <div
                    className={`w-full rounded-t bg-gradient-to-t ${mood.color} transition-all`}
                    style={{ height: `${(mood.score / 5) * 100}%`, minHeight: 4 }}
                  />
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                    <div className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-center shadow-md whitespace-nowrap">
                      <p>{mood.emoji} {mood.label}</p>
                      <p className="text-muted-foreground">{formatDay(day)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full bg-secondary/30 rounded-t" style={{ height: 4 }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function MoodStats({ moods }: { moods: MoodEntry[] }) {
  if (moods.length === 0) return null;
  const avg = moods.reduce((s, m) => s + m.score, 0) / moods.length;
  const avgMood = MOODS.find(m => m.score === Math.round(avg)) || MOODS[2];
  const streak = (() => {
    const days = getLast30Days().reverse();
    const moodSet = new Set(moods.map(m => m.date));
    let s = 0;
    for (const day of days) {
      if (moodSet.has(day)) s++;
      else break;
    }
    return s;
  })();

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-card border border-border rounded-xl p-4 text-center">
        <p className="text-3xl">{avgMood.emoji}</p>
        <p className="text-xs text-muted-foreground mt-1">Average mood</p>
        <p className={`text-sm font-medium ${avgMood.text}`}>{avgMood.label}</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-4 text-center">
        <p className="text-3xl font-bold text-primary">{moods.length}</p>
        <p className="text-xs text-muted-foreground mt-1">Entries logged</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-4 text-center">
        <p className="text-3xl font-bold text-orange-500">{streak}</p>
        <p className="text-xs text-muted-foreground mt-1">Day streak</p>
      </div>
    </div>
  );
}

export default function MoodTracker() {
  const { moods, setMoods } = useApp();
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const today = todayStr();
  const todayEntry = moods.find(m => m.date === today);
  const recentMoods = [...moods].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);

  const logMood = () => {
    if (!selectedScore) return;
    const mood = MOODS.find(m => m.score === selectedScore)!;
    const newEntry: MoodEntry = { id: Date.now().toString(), date: today, score: selectedScore, emoji: mood.emoji, note: note.trim() || undefined };
    setMoods(prev => [...prev.filter(m => m.date !== today), newEntry]);
    setNote('');
    setSelectedScore(null);
  };

  const deleteEntry = (id: string) => setMoods(prev => prev.filter(m => m.id !== id));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Mood Tracker</h1>
        <p className="text-muted-foreground">Spot patterns. ADHD moods fluctuate — tracking helps you understand your rhythms.</p>
      </header>

      {/* Today's check-in */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        {todayEntry ? (
          <div className={`flex items-center gap-4 p-4 rounded-xl border ${MOODS.find(m => m.score === todayEntry.score)?.bg}`}>
            <span className="text-5xl">{todayEntry.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold">Today you logged: <span className={MOODS.find(m => m.score === todayEntry.score)?.text}>{MOODS.find(m => m.score === todayEntry.score)?.label}</span></p>
              {todayEntry.note && <p className="text-sm text-muted-foreground mt-1 italic">"{todayEntry.note}"</p>}
            </div>
            <button onClick={() => setMoods(prev => prev.filter(m => m.date !== today))} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-semibold text-lg">How are you feeling right now?</h2>
            <div className="flex gap-2 justify-between">
              {MOODS.map(mood => (
                <button key={mood.score} onClick={() => setSelectedScore(mood.score)}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${selectedScore === mood.score ? `border-primary ${mood.bg}` : 'border-border hover:border-muted-foreground/50'}`}>
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="text-xs text-muted-foreground">{mood.label}</span>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {selectedScore && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional) — what's making you feel this way?" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none min-h-[72px] focus:ring-1 focus:ring-primary outline-none" />
                  <button onClick={logMood} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Log my mood
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Stats */}
      <MoodStats moods={moods} />

      {/* Chart */}
      {moods.length > 0 && <WeeklyChart moods={moods} />}

      {/* History */}
      {recentMoods.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors">
            <span className="font-semibold">Recent Entries</span>
            <span className="text-muted-foreground text-sm">{showHistory ? 'Hide' : 'Show'}</span>
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="divide-y divide-border border-t border-border">
                  {recentMoods.map(entry => {
                    const mood = MOODS.find(m => m.score === entry.score)!;
                    return (
                      <div key={entry.id} className="flex items-center gap-4 px-5 py-3 group">
                        <span className="text-2xl">{mood.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${mood.text}`}>{mood.label}</span>
                            <span className="text-xs text-muted-foreground">{formatDay(entry.date)}</span>
                          </div>
                          {entry.note && <p className="text-xs text-muted-foreground italic mt-0.5">"{entry.note}"</p>}
                        </div>
                        <button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {moods.length === 0 && (
        <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          Log your first mood above to start tracking your patterns.
        </div>
      )}
    </div>
  );
}
