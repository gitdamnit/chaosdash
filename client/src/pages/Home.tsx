import React, { useState, useRef } from 'react';
import { useApp, Task } from '@/lib/useAppState';
import { Play, Square, Volume2, VolumeX, Plus, ArrowRight, X, ListTodo, AlertCircle, Clock, Pin, Trash2, Brain, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { MicButton } from '@/components/ui/mic-button';

const NOTE_COLORS = [
  { id: 'yellow', ring: 'ring-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700' },
  { id: 'blue', ring: 'ring-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700' },
  { id: 'pink', ring: 'ring-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-700' },
  { id: 'green', ring: 'ring-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-700' },
];

function DontForgetSection() {
  const { pinnedNotes, setPinnedNotes } = useApp();
  const [newText, setNewText] = useState('');
  const [newColor, setNewColor] = useState('yellow');

  const add = () => {
    if (!newText.trim()) return;
    setPinnedNotes(prev => [...prev, { id: Date.now().toString(), text: newText.trim(), color: newColor }]);
    setNewText('');
  };

  const colorStyle = (id: string) => NOTE_COLORS.find(c => c.id === id) || NOTE_COLORS[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Pin className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-xl">Don't Forget This</h2>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{pinnedNotes.length}</span>
      </div>
      <div className="flex gap-2">
        <Input value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Something you absolutely cannot forget..." className="flex-1 bg-card" />
        <div className="flex gap-1 items-center">
          {NOTE_COLORS.map(c => (
            <button key={c.id} onClick={() => setNewColor(c.id)} className={`w-5 h-5 rounded-full ${c.bg} border ${c.border} ${newColor === c.id ? `ring-2 ${c.ring} ring-offset-1` : ''} transition-all`} />
          ))}
        </div>
        <button onClick={add} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg"><Plus className="w-4 h-4" /></button>
      </div>
      {pinnedNotes.length === 0 && (
        <p className="text-sm text-muted-foreground italic text-center py-4">Nothing pinned yet. Add things you absolutely can't forget.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {pinnedNotes.map(note => {
          const c = colorStyle(note.color);
          return (
            <div key={note.id} className={`relative p-4 rounded-xl border ${c.bg} ${c.border} group shadow-sm`}>
              <p className="text-sm pr-6 leading-relaxed">{note.text}</p>
              <button onClick={() => setPinnedNotes(prev => prev.filter(n => n.id !== note.id))} className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BrainDumpSection() {
  const { brainDump, setBrainDump } = useApp();
  const charCount = brainDump.length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-xl">Brain Dump</h2>
        </div>
        <div className="flex items-center gap-3">
          {charCount > 0 && <span className="text-xs text-muted-foreground">{charCount} chars · auto-saved</span>}
          {brainDump && <button onClick={() => setBrainDump('')} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"><Trash2 className="w-3 h-3" /> Clear</button>}
        </div>
      </div>
      <textarea
        value={brainDump}
        onChange={e => setBrainDump(e.target.value)}
        placeholder="Type everything cluttering your mind here. No structure, no judgement. Just dump it all out...&#10;&#10;This space is yours. Nothing here needs to be organised. Just let it out."
        className="w-full bg-card border border-border rounded-xl p-4 text-sm min-h-[180px] resize-none focus:ring-1 focus:ring-primary outline-none leading-relaxed"
      />
    </div>
  );
}

function DueBadge({ dueDate }: { dueDate?: number | null }) {
  if (!dueDate) return null;
  const now = Date.now();
  const diffDays = Math.ceil((dueDate - now) / 86400000);
  if (diffDays < 0) return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full"><AlertCircle className="w-2.5 h-2.5" /> Overdue</span>;
  if (diffDays === 0) return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full"><Clock className="w-2.5 h-2.5" /> Today</span>;
  if (diffDays <= 3) return <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">in {diffDays}d</span>;
  return null;
}

const FocusTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [ambientNoise, setAmbientNoise] = useState(false);
  const [notes, setNotes] = useState('');
  const notesRef = useRef<HTMLTextAreaElement>(null);
  
  React.useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const notesSpeech = useSpeechToText({
    onTranscript: (text) => {
      setNotes(prev => {
        const spacer = prev && !prev.endsWith('\n') ? '\n' : '';
        return prev + spacer + text.trim();
      });
      setTimeout(() => {
        if (notesRef.current) {
          notesRef.current.scrollTop = notesRef.current.scrollHeight;
        }
      }, 50);
    },
  });

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold tracking-tight">Focus</h2>
        <button 
          onClick={() => setAmbientNoise(!ambientNoise)}
          className={`p-2 rounded-full transition-colors ${ambientNoise ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}
          title="Toggle Ambient Noise (Mock)"
        >
          {ambientNoise ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-6xl font-mono font-bold tracking-tighter mb-8 text-primary">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={toggleTimer}
            data-testid="button-timer-toggle"
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform active:scale-95 ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isRunning ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>
          <button 
            onClick={resetTimer}
            data-testid="button-timer-reset"
            className="w-14 h-14 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-transform active:scale-95"
          >
            <span className="font-bold text-sm">25m</span>
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-muted-foreground">Session Notes</h3>
          <div className="flex items-center gap-2">
            {notesSpeech.isListening && (
              <span className="text-xs text-red-500 animate-pulse font-medium">Recording...</span>
            )}
            <MicButton
              isListening={notesSpeech.isListening}
              isSupported={notesSpeech.isSupported}
              onToggle={notesSpeech.toggleListening}
              size="sm"
            />
          </div>
        </div>
        <div className="relative">
          <textarea
            ref={notesRef}
            data-testid="textarea-session-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-background border border-border rounded-lg p-3 text-sm min-h-[120px] resize-none focus:ring-1 focus:ring-primary outline-none"
            placeholder={notesSpeech.isListening ? 'Listening... speak your thoughts' : 'Jot down distractions or notes here while timer runs...'}
          />
          {notesSpeech.interimTranscript && (
            <div className="absolute bottom-2 left-3 right-3 text-xs text-muted-foreground italic pointer-events-none truncate">
              {notesSpeech.interimTranscript}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function DoNowTaskCard({ task, onComplete, onDemote, setTasks }: {
  task: Task;
  onComplete: (id: string) => void;
  onDemote: (id: string) => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newSub, setNewSub] = useState('');
  const subtasks = task.subtasks || [];
  const doneCount = subtasks.filter(s => s.done).length;

  const addSubtask = () => {
    if (!newSub.trim()) return;
    const sub = { id: Date.now().toString(), text: newSub.trim(), done: false };
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, subtasks: [...(t.subtasks || []), sub] } : t));
    setNewSub('');
  };

  const toggleSub = (subId: string) => {
    setTasks(prev => prev.map(t => t.id === task.id
      ? { ...t, subtasks: (t.subtasks || []).map(s => s.id === subId ? { ...s, done: !s.done } : s) }
      : t
    ));
  };

  const deleteSub = (subId: string) => {
    setTasks(prev => prev.map(t => t.id === task.id
      ? { ...t, subtasks: (t.subtasks || []).filter(s => s.id !== subId) }
      : t
    ));
  };

  return (
    <div className="bg-background rounded-lg border border-primary/30 shadow-sm group">
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={() => onComplete(task.id)}
          className="mt-0.5 w-6 h-6 rounded-full border-2 border-primary shrink-0 hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
        />
        <span className="font-medium flex-1 text-[15px] leading-snug">{task.title}</span>
        <div className="flex items-center gap-1 shrink-0">
          {subtasks.length > 0 && (
            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">{doneCount}/{subtasks.length}</span>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Subtasks"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onDemote(task.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Back to inbox">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/50 px-4 pb-3 pt-2 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Next steps</p>
          {subtasks.map(s => (
            <div key={s.id} className={`flex items-center gap-2 group/sub text-sm ${s.done ? 'opacity-50' : ''}`}>
              <button onClick={() => toggleSub(s.id)} className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${s.done ? 'bg-green-500 border-green-500 text-white' : 'border-muted-foreground hover:border-primary'}`}>
                {s.done && <Check className="w-2.5 h-2.5" />}
              </button>
              <span className={`flex-1 ${s.done ? 'line-through' : ''}`}>{s.text}</span>
              <button onClick={() => deleteSub(s.id)} className="opacity-0 group-hover/sub:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div className="flex gap-1.5 pt-1">
            <input
              value={newSub}
              onChange={e => setNewSub(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubtask()}
              placeholder="Add a next step…"
              className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none"
            />
            <button onClick={addSubtask} className="bg-secondary text-muted-foreground px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary/80">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { tasks, setTasks, panicMode } = useApp();
  const [newTask, setNewTask] = useState('');

  const inboxSpeech = useSpeechToText({
    continuous: false,
    onTranscript: (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setTasks(prev => [
        { id: Date.now().toString(), title: trimmed, status: 'inbox', createdAt: Date.now() },
        ...prev
      ]);
    },
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    setTasks([
      { id: Date.now().toString(), title: newTask.trim(), status: 'inbox', createdAt: Date.now() },
      ...tasks
    ]);
    setNewTask('');
  };

  const promoteToDoNow = (id: string) => {
    const doNowCount = tasks.filter(t => t.status === 'do_now').length;
    if (doNowCount >= 3) {
      alert("Ruthless Priority: You can only have 3 items in 'Do Now'. Complete or demote one first.");
      return;
    }
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'do_now' } : t));
  };

  const demoteToInbox = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'inbox' } : t));
  };

  const completeTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'done' } : t));
  };

  const doNowTasks = tasks.filter(t => t.status === 'do_now');
  const inboxTasks = tasks.filter(t => t.status === 'inbox');

  if (panicMode) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <ListTodo className="w-6 h-6" /> Do Now (Max 3)
          </h2>
          <div className="space-y-3">
            {doNowTasks.length === 0 ? (
              <p className="text-muted-foreground italic">Nothing in 'Do Now'. Breathe.</p>
            ) : (
              doNowTasks.map(task => (
                <div key={task.id} className="bg-card border-2 border-primary/20 p-4 rounded-xl shadow-sm flex items-start gap-3">
                  <button 
                    onClick={() => completeTask(task.id)}
                    className="mt-1 w-6 h-6 rounded-full border-2 border-primary shrink-0 flex items-center justify-center hover:bg-primary/20"
                  />
                  <span className="font-medium text-lg flex-1">{task.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <FocusTimer />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Capture & Focus</h1>
        <p className="text-muted-foreground text-lg">Clear your mind. Pick up to 3 things to do right now.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inbox Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-secondary/50 p-4 rounded-xl border border-border">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
              Inbox
              <span className="bg-muted text-muted-foreground text-xs py-0.5 px-2 rounded-full">{inboxTasks.length}</span>
            </h2>

            {/* Voice capture hint */}
            {inboxSpeech.isListening && (
              <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {inboxSpeech.interimTranscript
                    ? `"${inboxSpeech.interimTranscript}"`
                    : 'Listening... say a thought to capture it'}
                </span>
              </div>
            )}
            
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <Input 
                data-testid="input-new-task"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder="Dump thoughts here..."
                className="bg-card"
                autoFocus
              />
              <MicButton
                isListening={inboxSpeech.isListening}
                isSupported={inboxSpeech.isSupported}
                onToggle={inboxSpeech.toggleListening}
              />
              <button
                type="submit"
                data-testid="button-add-task"
                className="bg-primary text-primary-foreground p-2 rounded-lg shrink-0 hover:bg-primary/90"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            {!inboxSpeech.isSupported && (
              <p className="text-xs text-muted-foreground mb-3 italic">
                Voice input requires Chrome or Edge browser.
              </p>
            )}

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {inboxTasks.map(task => (
                <div key={task.id} data-testid={`task-inbox-${task.id}`} className="bg-card p-3 rounded-lg border border-border shadow-sm flex items-start gap-2 group hover:border-primary/50 transition-colors">
                  <button
                    onClick={() => completeTask(task.id)}
                    className="mt-0.5 w-5 h-5 rounded border border-muted-foreground shrink-0 hover:bg-green-500/20 hover:border-green-500 transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {task.priority === 'high' && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">High</span>}
                      <DueBadge dueDate={task.dueDate} />
                    </div>
                    <span className="text-sm">{task.title}</span>
                  </div>
                  <button
                    onClick={() => promoteToDoNow(task.id)}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-all p-1"
                    title="Move to Do Now"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {inboxTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                  Inbox is empty!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Do Now Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card p-5 rounded-xl border-2 border-primary/20 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500" />
            <h2 className="font-bold text-xl mb-1 flex items-center gap-2">
              Do Now
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Ruthless priority. Max 3 items.</p>
            
            <div className="space-y-3">
              {doNowTasks.map(task => (
                <DoNowTaskCard key={task.id} task={task} onComplete={completeTask} onDemote={demoteToInbox} setTasks={setTasks} />
              ))}
              
              {doNowTasks.length < 3 && Array.from({ length: 3 - doNowTasks.length }).map((_, i) => (
                <div key={`empty-${i}`} className="p-4 rounded-lg border-2 border-dashed border-border/50 bg-secondary/20 text-muted-foreground/50 text-sm flex items-center justify-center h-[76px]">
                  Slot available
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timer Section */}
        <div className="lg:col-span-1">
          <FocusTimer />
        </div>

      </div>

      {/* Don't Forget This */}
      <div className="bg-card border border-border rounded-xl p-5">
        <DontForgetSection />
      </div>

      {/* Brain Dump */}
      <div className="bg-card border border-border rounded-xl p-5">
        <BrainDumpSection />
      </div>

    </div>
  );
}
