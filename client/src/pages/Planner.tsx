import React, { useState } from 'react';
import { useApp } from '@/lib/useAppState';
import { Calendar, Plus, Trash2, Clock, ChevronLeft, ChevronRight, ExternalLink, Grid3X3 } from 'lucide-react';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { MicButton } from '@/components/ui/mic-button';

const COLORS = [
  { id: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-400', light: 'bg-indigo-500/15' },
  { id: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-400', light: 'bg-emerald-500/15' },
  { id: 'amber', bg: 'bg-amber-500', border: 'border-amber-400', light: 'bg-amber-500/15' },
  { id: 'rose', bg: 'bg-rose-500', border: 'border-rose-400', light: 'bg-rose-500/15' },
  { id: 'purple', bg: 'bg-purple-500', border: 'border-purple-400', light: 'bg-purple-500/15' },
  { id: 'cyan', bg: 'bg-cyan-500', border: 'border-cyan-400', light: 'bg-cyan-500/15' },
];

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 || 12;
  return m === 0 ? `${hour12}${ampm}` : `${hour12}:${m.toString().padStart(2, '0')}${ampm}`;
}

function toDateString(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

function friendlyDate(dateStr: string) {
  const today = toDateString(0);
  const tomorrow = toDateString(1);
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function exportToIcs(blocks: any[], date: string) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ADHD Navigator//EN'];
  blocks.forEach(b => {
    const start = new Date(`${date}T00:00:00`);
    start.setMinutes(b.startMinutes);
    const end = new Date(start.getTime() + b.durationMinutes * 60000);
    const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    lines.push('BEGIN:VEVENT', `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:${b.title}`, 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `schedule-${date}.ics`;
  a.click();
}

function MonthCalendar({ timeBlocks, onDayClick }: { timeBlocks: any[]; onDayClick: (dateStr: string) => void }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const blocksByDate = new Map<string, number>();
  timeBlocks.forEach(b => {
    blocksByDate.set(b.date, (blocksByDate.get(b.date) || 0) + 1);
  });

  const todayStr = today.toISOString().split('T')[0];
  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const nextMonth = () => {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={prevMonth} className="p-1.5 hover:bg-secondary rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
        <h3 className="font-semibold">{monthName}</h3>
        <button onClick={nextMonth} className="p-1.5 hover:bg-secondary rounded-lg"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 border-b border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-2 text-center text-xs text-muted-foreground font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="h-16 border-b border-r border-border/30" />
        ))}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const count = blocksByDate.get(dateStr) || 0;
          const isToday = dateStr === todayStr;
          return (
            <div key={day} onClick={() => onDayClick(dateStr)} className={`h-16 border-b border-r border-border/30 p-1.5 cursor-pointer hover:bg-secondary/50 transition-colors ${isToday ? 'bg-primary/5' : ''}`}>
              <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>{day}</div>
              {count > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {Array.from({ length: Math.min(count, 3) }).map((_, ci) => (
                    <div key={ci} className="w-1.5 h-1.5 rounded-full bg-primary" />
                  ))}
                  {count > 3 && <span className="text-[9px] text-muted-foreground">+{count - 3}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3 text-xs text-muted-foreground bg-secondary/20 border-t border-border">
        Click any day to jump to it in Day view
      </div>
    </div>
  );
}

export default function Planner() {
  const { timeBlocks, setTimeBlocks, tasks } = useApp();
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [dayOffset, setDayOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', startHour: 9, startMin: 0, durationMins: 30, color: 'indigo' });

  const selectedDate = toDateString(dayOffset);
  const todayBlocks = timeBlocks.filter(b => b.date === selectedDate).sort((a, b) => a.startMinutes - b.startMinutes);

  const speech = useSpeechToText({ continuous: false, onTranscript: (t) => setForm(f => ({ ...f, title: t.trim() })) });

  const addBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const block = {
      id: Date.now().toString(),
      title: form.title.trim(),
      startMinutes: form.startHour * 60 + form.startMin,
      durationMinutes: form.durationMins,
      color: form.color,
      date: selectedDate,
    };
    setTimeBlocks(prev => [...prev, block]);
    setForm(f => ({ ...f, title: '' }));
    setShowForm(false);
  };

  const deleteBlock = (id: string) => setTimeBlocks(prev => prev.filter(b => b.id !== id));

  const addTaskAsBlock = (title: string) => {
    const now = new Date();
    const startMins = now.getHours() * 60 + now.getMinutes();
    const block = { id: Date.now().toString(), title, startMinutes: startMins, durationMinutes: 30, color: 'indigo', date: selectedDate };
    setTimeBlocks(prev => [...prev, block]);
  };

  const jumpToDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
    setDayOffset(diff);
    setViewMode('day');
  };

  const unscheduledTasks = tasks.filter(t => t.status !== 'done').slice(0, 5);
  const colorObj = (id: string) => COLORS.find(c => c.id === id) || COLORS[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Day Planner</h1>
          <p className="text-muted-foreground">Block out your time visually. Export to Google, Outlook, or Apple Calendar.</p>
        </div>
        <div className="flex bg-secondary rounded-lg p-1 gap-1 shrink-0">
          <button onClick={() => setViewMode('day')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'day' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            <Clock className="w-3.5 h-3.5" /> Day
          </button>
          <button onClick={() => setViewMode('month')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'month' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            <Grid3X3 className="w-3.5 h-3.5" /> Month
          </button>
        </div>
      </header>

      {viewMode === 'month' && (
        <MonthCalendar timeBlocks={timeBlocks} onDayClick={jumpToDate} />
      )}

      {viewMode === 'day' && (
        <>
          <div className="flex items-center gap-4">
            <button onClick={() => setDayOffset(d => d - 1)} className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold">{friendlyDate(selectedDate)}</p>
              <p className="text-sm text-muted-foreground">{selectedDate}</p>
            </div>
            <button onClick={() => setDayOffset(d => d + 1)} className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h2 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" /> Schedule</h2>
                  <div className="flex gap-2">
                    {todayBlocks.length > 0 && (
                      <button onClick={() => exportToIcs(todayBlocks, selectedDate)} className="text-xs bg-secondary text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-secondary/80 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Export .ics
                      </button>
                    )}
                    <button onClick={() => setShowForm(true)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add block
                    </button>
                  </div>
                </div>

                {showForm && (
                  <div className="p-4 border-b border-border bg-secondary/30">
                    <form onSubmit={addBlock} className="space-y-3">
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <div className="flex gap-2 items-center">
                            <input
                              value={form.title}
                              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                              placeholder="What are you doing?"
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                              autoFocus
                            />
                            <MicButton isListening={speech.isListening} isSupported={speech.isSupported} onToggle={speech.toggleListening} size="sm" />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <select value={form.startHour} onChange={e => setForm(f => ({ ...f, startHour: +e.target.value }))} className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary">
                            {HOURS.map(h => <option key={h} value={h}>{h > 12 ? h - 12 : h}{h >= 12 ? 'pm' : 'am'}</option>)}
                          </select>
                          <select value={form.startMin} onChange={e => setForm(f => ({ ...f, startMin: +e.target.value }))} className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary">
                            {[0, 15, 30, 45].map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
                          </select>
                        </div>
                        <select value={form.durationMins} onChange={e => setForm(f => ({ ...f, durationMins: +e.target.value }))} className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary">
                          {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d >= 60 ? `${d / 60}h` : `${d}m`}</option>)}
                        </select>
                        <div className="flex gap-1">
                          {COLORS.map(c => (
                            <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, color: c.id }))} className={`w-6 h-6 rounded-full ${c.bg} ${form.color === c.id ? 'ring-2 ring-offset-1 ring-primary' : ''}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">Add</button>
                        <button type="button" onClick={() => setShowForm(false)} className="bg-secondary text-muted-foreground px-4 py-2 rounded-lg text-sm">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
                  {HOURS.map(hour => {
                    const slotBlocks = todayBlocks.filter(b => Math.floor(b.startMinutes / 60) === hour);
                    return (
                      <div key={hour} className="flex min-h-[56px]">
                        <div className="w-16 shrink-0 px-3 py-2 text-xs text-muted-foreground text-right border-r border-border/50 pt-2.5">
                          {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'pm' : 'am'}
                        </div>
                        <div className="flex-1 p-1.5 space-y-1">
                          {slotBlocks.map(block => {
                            const c = colorObj(block.color);
                            return (
                              <div key={block.id} className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${c.light} border-l-4 ${c.border} group`}>
                                <div>
                                  <p className="text-sm font-medium">{block.title}</p>
                                  <p className="text-xs text-muted-foreground">{formatTime(block.startMinutes)} · {block.durationMinutes >= 60 ? `${block.durationMinutes / 60}h` : `${block.durationMinutes}m`}</p>
                                </div>
                                <button onClick={() => deleteBlock(block.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  Inbox Tasks
                  <span className="text-xs text-muted-foreground">(click to schedule now)</span>
                </h3>
                <div className="space-y-2">
                  {unscheduledTasks.length === 0
                    ? <p className="text-xs text-muted-foreground italic">No tasks in inbox</p>
                    : unscheduledTasks.map(task => (
                      <button key={task.id} onClick={() => addTaskAsBlock(task.title)} className="w-full text-left p-3 rounded-lg bg-secondary/50 border border-border text-sm hover:border-primary/40 hover:bg-secondary transition-colors">
                        {task.title}
                      </button>
                    ))}
                </div>
              </div>

              <div className="bg-secondary/50 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-sm text-foreground">Calendar sync</p>
                <p>Use the <strong>Export .ics</strong> button above to download your schedule and import it into:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><a href="https://calendar.google.com" target="_blank" rel="noopener" className="text-primary hover:underline">Google Calendar</a></li>
                  <li><a href="https://outlook.live.com" target="_blank" rel="noopener" className="text-primary hover:underline">Microsoft Outlook</a></li>
                  <li>Apple Calendar (double-click .ics file)</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
