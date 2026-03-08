import React, { useState } from 'react';
import { useApp, Goal, SmartGoalData } from '@/lib/useAppState';
import { Target, Plus, Trash2, Check, Edit3, ChevronDown, ChevronUp, Sparkles, Loader2, ChevronRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'health', label: 'Health', color: 'text-green-500 bg-green-500/10 border-green-500/20' },
  { id: 'career', label: 'Career', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 'personal', label: 'Personal', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { id: 'financial', label: 'Financial', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'learning', label: 'Learning', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
  { id: 'other', label: 'Other', color: 'text-muted-foreground bg-secondary border-border' },
];

const SMART_STEPS = [
  { key: 'specific', label: 'Specific', emoji: '🎯', question: 'What exactly do you want to accomplish?', placeholder: 'Be precise. Who is involved? What do you want to do? Where? Why?' },
  { key: 'measurable', label: 'Measurable', emoji: '📏', question: 'How will you know when you\'ve achieved it?', placeholder: 'Define the numbers, metrics, or milestones. "I will _____ by measuring _____."' },
  { key: 'achievable', label: 'Achievable', emoji: '💪', question: 'Is this realistic? What might get in the way?', placeholder: 'What do you need to make this happen? What obstacles might you face?' },
  { key: 'relevant', label: 'Relevant', emoji: '💚', question: 'Why does this matter to you right now?', placeholder: 'How does this align with your values, bigger goals, or current situation?' },
  { key: 'timeBound', label: 'Time-bound', emoji: '📅', question: 'By when will you achieve this?', placeholder: 'Set a specific deadline. Be realistic — add ADHD buffer time.' },
];

function catStyle(id?: string) { return CATEGORIES.find(c => c.id === id)?.color || CATEGORIES[5].color; }
function catLabel(id?: string) { return CATEGORIES.find(c => c.id === id)?.label || 'Other'; }

function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysLeft(d?: string) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d + 'T00:00:00').getTime() - Date.now()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  if (diff === 0) return 'Due today';
  return `${diff} days left`;
}

function timelinePos(targetDate?: string): 'past' | 'near' | 'future' {
  if (!targetDate) return 'future';
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff < 0) return 'past';
  if (diff < 86400000 * 30) return 'near';
  return 'future';
}

const EMPTY_GOAL: Partial<Goal> = { title: '', description: '', status: 'not_started', progress: 0, category: 'personal' };

function SmartBadge({ smart }: { smart: SmartGoalData }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
        <Sparkles className="w-3 h-3" /> SMART breakdown {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2 space-y-1.5 bg-secondary/30 rounded-lg p-3">
              {SMART_STEPS.map(s => (
                <div key={s.key} className="text-xs">
                  <span className="font-semibold">{s.emoji} {s.label}:</span>{' '}
                  <span className="text-muted-foreground">{(smart as any)[s.key] || '—'}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GoalCard({ goal, onEdit, onDelete, onProgressChange }: {
  goal: Goal; onEdit: () => void; onDelete: () => void; onProgressChange: (p: number) => void;
}) {
  const [adjusting, setAdjusting] = useState(false);
  const dl = daysLeft(goal.targetDate);
  const isOverdue = goal.targetDate && new Date(goal.targetDate + 'T00:00:00').getTime() < Date.now();

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {goal.category && <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catStyle(goal.category)}`}>{catLabel(goal.category)}</span>}
            {goal.smart && <span className="text-xs px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20 flex items-center gap-1"><Sparkles className="w-3 h-3" /> SMART</span>}
            {dl && <span className={`text-xs px-2 py-0.5 rounded-full ${isOverdue ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-secondary'}`}>{dl}</span>}
          </div>
          <h3 className="font-semibold">{goal.title}</h3>
          {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
          {goal.targetDate && <p className="text-xs text-muted-foreground mt-1">Target: {formatDate(goal.targetDate)}</p>}
          {goal.smart && <SmartBadge smart={goal.smart} />}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Progress</span>
          <button onClick={() => setAdjusting(!adjusting)} className="text-primary hover:underline">{goal.progress}% {adjusting ? '▲' : '▼'}</button>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
        </div>
        {adjusting && <input type="range" min="0" max="100" value={goal.progress} onChange={e => onProgressChange(+e.target.value)} className="w-full mt-2" />}
      </div>
    </div>
  );
}

function SmartWizard({ onSave, onCancel }: { onSave: (goal: Partial<Goal>) => void; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<SmartGoalData>>({});
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<Goal['category']>('personal');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  const currentStep = SMART_STEPS[step];
  const currentValue = (data as any)[currentStep?.key] || '';
  const isReview = step === SMART_STEPS.length;

  const getAiHelp = async () => {
    setAiLoading(true);
    setAiSuggestion('');
    try {
      const res = await fetch('/api/goals/smart-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: currentStep.key, goalContext: { ...data, targetDate } }),
      });
      const d = await res.json();
      setAiSuggestion(d.suggestion || '');
    } catch { setAiSuggestion('Could not get suggestion. Try again.'); }
    finally { setAiLoading(false); }
  };

  const updateField = (val: string) => {
    setData(prev => ({ ...prev, [currentStep.key]: val }));
    setAiSuggestion('');
  };

  const useSuggestion = () => {
    updateField(aiSuggestion);
    setAiSuggestion('');
  };

  const canNext = isReview || currentValue.trim().length > 0;

  const handleSave = () => {
    const smartData = data as SmartGoalData;
    const assembled = `${smartData.specific}`;
    const desc = [
      `📏 Measurable: ${smartData.measurable}`,
      `💪 Achievable: ${smartData.achievable}`,
      `💚 Relevant: ${smartData.relevant}`,
      `📅 By: ${targetDate || smartData.timeBound}`,
    ].join('\n');
    onSave({
      title: assembled,
      description: desc,
      category,
      targetDate: targetDate || undefined,
      smart: smartData,
      status: 'not_started',
      progress: 0,
    });
  };

  return (
    <div className="bg-card border border-primary/30 rounded-xl overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-secondary">
        <div className="h-full bg-primary transition-all" style={{ width: `${isReview ? 100 : ((step) / SMART_STEPS.length) * 100}%` }} />
      </div>

      <div className="p-6">
        {/* Step tabs */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {SMART_STEPS.map((s, i) => (
            <button key={s.key} onClick={() => setStep(i)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${i === step ? 'bg-primary text-primary-foreground' : i < step ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
              {s.emoji} {s.label}
              {i < step && <Check className="w-3 h-3" />}
            </button>
          ))}
          <button onClick={() => setStep(SMART_STEPS.length)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isReview ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
            ✅ Review
          </button>
        </div>

        {!isReview && currentStep && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">{currentStep.emoji} {currentStep.label}</h3>
              <p className="text-muted-foreground text-sm mt-1">{currentStep.question}</p>
            </div>

            {currentStep.key === 'timeBound' ? (
              <div className="space-y-3">
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                <textarea
                  value={currentValue}
                  onChange={e => updateField(e.target.value)}
                  placeholder="Or describe your timeline in your own words..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none min-h-[80px]"
                />
              </div>
            ) : (
              <textarea
                value={currentValue}
                onChange={e => updateField(e.target.value)}
                placeholder={currentStep.placeholder}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none min-h-[100px]"
                autoFocus
              />
            )}

            {aiSuggestion && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                <p className="text-xs font-medium text-primary flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI suggestion</p>
                <p className="text-sm">{aiSuggestion}</p>
                <button onClick={useSuggestion} className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                  Use this suggestion
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button onClick={getAiHelp} disabled={aiLoading} className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-muted-foreground rounded-xl text-sm hover:bg-secondary/80 transition-colors disabled:opacity-50">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiLoading ? 'Thinking...' : 'Help me write this'}
              </button>
              <div className="flex-1" />
              {step > 0 && <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 bg-secondary text-muted-foreground rounded-xl text-sm">Back</button>}
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-40"
              >
                {step === SMART_STEPS.length - 1 ? 'Review' : 'Next'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {isReview && (
          <div className="space-y-5">
            <h3 className="text-lg font-bold flex items-center gap-2">✅ Review Your SMART Goal</h3>
            <div className="space-y-3">
              {SMART_STEPS.map(s => (
                <div key={s.key} className="bg-secondary/30 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{s.emoji} {s.label}</p>
                  <p className="text-sm">{(data as any)[s.key] || <span className="text-muted-foreground italic">Not filled in</span>}</p>
                </div>
              ))}
              {targetDate && (
                <div className="bg-secondary/30 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">📅 Target Date</p>
                  <p className="text-sm">{formatDate(targetDate)}</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as any)}
                className="bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none">
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm">
                <Check className="w-4 h-4" /> Save SMART Goal
              </button>
              <button onClick={() => setStep(0)} className="flex items-center gap-1.5 bg-secondary text-muted-foreground px-4 py-2.5 rounded-xl text-sm">
                <RotateCcw className="w-4 h-4" /> Edit
              </button>
              <button onClick={onCancel} className="bg-secondary text-muted-foreground px-4 py-2.5 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Goals() {
  const { goals, setGoals } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showSmart, setShowSmart] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Goal>>(EMPTY_GOAL);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');

  const save = () => {
    if (!form.title?.trim()) return;
    if (editingId) {
      setGoals(goals.map(g => g.id === editingId ? { ...g, ...form } as Goal : g));
      setEditingId(null);
    } else {
      setGoals([...goals, { id: Date.now().toString(), ...EMPTY_GOAL, ...form, progress: form.progress || 0, status: form.status || 'not_started' } as Goal]);
    }
    setForm(EMPTY_GOAL);
    setShowForm(false);
  };

  const saveSmartGoal = (goal: Partial<Goal>) => {
    setGoals(prev => [...prev, { id: Date.now().toString(), status: 'not_started', progress: 0, ...goal } as Goal]);
    setShowSmart(false);
  };

  const startEdit = (g: Goal) => {
    setForm({ ...g });
    setEditingId(g.id);
    setShowForm(true);
    setShowSmart(false);
  };

  const deleteGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));

  const setProgress = (id: string, progress: number) => {
    setGoals(goals.map(g => {
      if (g.id !== id) return g;
      const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';
      return { ...g, progress, status };
    }));
  };

  const sorted = [...goals].sort((a, b) => {
    if (!a.targetDate && !b.targetDate) return 0;
    if (!a.targetDate) return 1;
    if (!b.targetDate) return -1;
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });

  const active = sorted.filter(g => g.status !== 'completed');
  const done = sorted.filter(g => g.status === 'completed');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <header className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Goals & Timeline</h1>
          <p className="text-muted-foreground">Big picture dreams, broken down into progress. Use the SMART framework to make goals that actually stick.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-secondary rounded-lg p-1 gap-1">
            {(['timeline', 'list'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${viewMode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{m}</button>
            ))}
          </div>
          <button
            onClick={() => { setShowSmart(!showSmart); setShowForm(false); }}
            className="bg-primary/10 text-primary border border-primary/30 px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="w-4 h-4" /> SMART Goal
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setForm(EMPTY_GOAL); setEditingId(null); setShowSmart(false); }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Quick Add
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showSmart && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <SmartWizard onSave={saveSmartGoal} onCancel={() => setShowSmart(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">{editingId ? 'Edit Goal' : 'Quick Add Goal'}</h3>
            <input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What do you want to achieve?" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" />
            <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Why does this matter? (optional)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none resize-none min-h-[72px]" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Target date</label>
                <input type="date" value={form.targetDate || ''} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Category</label>
                <select value={form.category || 'personal'} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none">
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">Save Goal</button>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="bg-secondary text-muted-foreground px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length === 0 && !showForm && !showSmart && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground mb-4">No goals yet. Start with the SMART framework for goals that actually work.</p>
          <button onClick={() => setShowSmart(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm mx-auto">
            <Sparkles className="w-4 h-4" /> Create Your First SMART Goal
          </button>
        </div>
      )}

      {viewMode === 'timeline' && active.length > 0 && (
        <div className="relative pl-8">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {active.map(goal => {
              const pos = timelinePos(goal.targetDate);
              const dotColor = pos === 'past' ? 'bg-red-500' : pos === 'near' ? 'bg-amber-500' : 'bg-primary';
              return (
                <div key={goal.id} className="relative">
                  <div className={`absolute -left-[21px] top-4 w-3 h-3 rounded-full border-2 border-background ${dotColor}`} />
                  <GoalCard goal={goal} onEdit={() => startEdit(goal)} onDelete={() => deleteGoal(goal.id)} onProgressChange={p => setProgress(goal.id, p)} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'list' && active.length > 0 && (
        <div className="space-y-4">
          {active.map(goal => <GoalCard key={goal.id} goal={goal} onEdit={() => startEdit(goal)} onDelete={() => deleteGoal(goal.id)} onProgressChange={p => setProgress(goal.id, p)} />)}
        </div>
      )}

      {done.length > 0 && (
        <CompletedSection goals={done} onEdit={startEdit} onDelete={deleteGoal} />
      )}
    </div>
  );
}

function CompletedSection({ goals, onEdit, onDelete }: { goals: Goal[]; onEdit: (g: Goal) => void; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <span className="font-medium">Completed Goals ({goals.length})</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-4 space-y-3 border-t border-border">
              {goals.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg opacity-70">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="flex-1 line-through text-muted-foreground">{g.title}</span>
                  <button onClick={() => onDelete(g.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
