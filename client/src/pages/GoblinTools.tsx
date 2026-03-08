import React, { useState } from 'react';
import { Wand2, Clock, FileText, Heart, Plus, Loader2, Copy, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { MicButton } from '@/components/ui/mic-button';
import { useApp } from '@/lib/useAppState';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function VoiceTextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const speech = useSpeechToText({ onTranscript: (t) => onChange(value + (value ? ' ' : '') + t.trim()) });
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Tap mic to speak</span>
        <div className="flex items-center gap-2">
          {speech.isListening && <span className="text-xs text-red-500 animate-pulse">Listening...</span>}
          <MicButton isListening={speech.isListening} isSupported={speech.isSupported} onToggle={speech.toggleListening} size="sm" />
        </div>
      </div>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={speech.isListening ? 'Speak now...' : placeholder}
        className="min-h-[80px] bg-background resize-none"
      />
      {speech.interimTranscript && (
        <p className="text-xs text-muted-foreground italic">{speech.interimTranscript}...</p>
      )}
    </div>
  );
}

// ── Magic ToDo ─────────────────────────────────────────────────────────────
function MagicToDo() {
  const { setTasks } = useApp();
  const [task, setTask] = useState('');
  const [difficulty, setDifficulty] = useState<'low' | 'medium' | 'high'>('medium');
  const [steps, setSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedAll, setAddedAll] = useState(false);

  const breakdown = async () => {
    if (!task.trim()) return;
    setLoading(true);
    setSteps([]);
    setAddedAll(false);
    try {
      const res = await fetch('/api/goblin/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, difficulty }),
      });
      const data = await res.json();
      setSteps(data.steps || []);
    } catch {
      setSteps(['Failed to break down task. Try again.']);
    } finally {
      setLoading(false);
    }
  };

  const addToInbox = (step: string) => {
    setTasks(prev => [{ id: Date.now().toString() + Math.random(), title: step, status: 'inbox', createdAt: Date.now() }, ...prev]);
  };

  const addAll = () => {
    steps.forEach((step, i) => {
      setTimeout(() => setTasks(prev => [{ id: Date.now().toString() + i, title: step, status: 'inbox', createdAt: Date.now() }, ...prev]), i * 50);
    });
    setAddedAll(true);
  };

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">Type or speak a big, overwhelming task. AI breaks it into tiny, ADHD-friendly micro-steps.</p>
      <VoiceTextArea value={task} onChange={setTask} placeholder="e.g. Write the quarterly report..." />
      <div className="flex gap-3 items-center">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Detail level:</span>
          {(['low','medium','high'] as const).map(d => (
            <button key={d} onClick={() => setDifficulty(d)} className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${difficulty === d ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>{d}</button>
          ))}
        </div>
        <button onClick={breakdown} disabled={!task.trim() || loading} className="ml-auto bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {loading ? 'Breaking down...' : 'Break it down!'}
        </button>
      </div>

      {steps.length > 0 && (
        <div className="bg-secondary/30 rounded-xl border border-border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm">Steps for: <span className="text-primary">{task}</span></h3>
            <button onClick={addAll} disabled={addedAll} className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/20 disabled:opacity-50 flex items-center gap-1">
              {addedAll ? <><Check className="w-3 h-3" /> Added!</> : <><Plus className="w-3 h-3" /> Add all to Inbox</>}
            </button>
          </div>
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3 bg-card p-3 rounded-lg border border-border">
              <span className="w-6 h-6 bg-primary/20 text-primary text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-sm flex-1">{step}</span>
              <button onClick={() => addToInbox(step)} title="Add to inbox" className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Time Estimator ─────────────────────────────────────────────────────────
function Estimator() {
  const [task, setTask] = useState('');
  const [result, setResult] = useState<{ estimate?: string; adhd_note?: string; breakdown?: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const estimate = async () => {
    if (!task.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/goblin/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      setResult(await res.json());
    } catch {
      setResult({ estimate: 'Error estimating. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">ADHD time-blindness is real. Get a realistic estimate that accounts for transitions, hyperfocus risk, and the ADHD tax.</p>
      <VoiceTextArea value={task} onChange={setTask} placeholder="e.g. Clean the bathroom..." />
      <button onClick={estimate} disabled={!task.trim() || loading} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
        {loading ? 'Estimating...' : 'Estimate my time'}
      </button>

      {result && (
        <div className="bg-secondary/30 rounded-xl border border-border p-5 space-y-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Realistic estimate</p>
            <p className="text-4xl font-bold text-primary">{result.estimate}</p>
          </div>
          {result.adhd_note && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400">
              <span className="font-semibold">ADHD tip: </span>{result.adhd_note}
            </div>
          )}
          {result.breakdown && result.breakdown.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time breakdown</p>
              {result.breakdown.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                  {step}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tone Fixer ─────────────────────────────────────────────────────────────
function ToneFixer() {
  const [text, setText] = useState('');
  const [tone, setTone] = useState('soft');
  const [result, setResult] = useState<{ rewritten?: string; changes?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const tones = [
    { id: 'formal', label: 'Professional' },
    { id: 'casual', label: 'Casual' },
    { id: 'soft', label: 'Softer' },
    { id: 'direct', label: 'Direct' },
    { id: 'assertive', label: 'Assertive' },
    { id: 'clear', label: 'Simpler' },
  ];

  const fix = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/goblin/tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetTone: tone }),
      });
      setResult(await res.json());
    } catch {
      setResult({ rewritten: 'Error adjusting tone. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">Struggling with how to phrase a message? Write it however it comes out, then pick the tone you need.</p>
      <VoiceTextArea value={text} onChange={setText} placeholder="Paste or speak your message here..." />
      <div className="space-y-2">
        <p className="text-sm font-medium">Make it:</p>
        <div className="flex flex-wrap gap-2">
          {tones.map(t => (
            <button key={t.id} onClick={() => setTone(t.id)} className={`px-3 py-1.5 text-sm rounded-full transition-colors ${tone === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>{t.label}</button>
          ))}
        </div>
      </div>
      <button onClick={fix} disabled={!text.trim() || loading} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        {loading ? 'Rewriting...' : 'Fix my tone'}
      </button>

      {result?.rewritten && (
        <div className="bg-secondary/30 rounded-xl border border-border p-4 space-y-3">
          {result.changes && <p className="text-xs text-muted-foreground italic">{result.changes}</p>}
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm leading-relaxed flex-1">{result.rewritten}</p>
            <CopyButton text={result.rewritten} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Kindness Judge ─────────────────────────────────────────────────────────
function KindnessJudge() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ score?: number; label?: string; explanation?: string; suggestion?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  const judge = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/goblin/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      setResult(await res.json());
    } catch {
      setResult({ label: 'Error', explanation: 'Failed to judge. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  const score = result?.score || 5;
  const scoreColor = score <= 3 ? 'text-red-500' : score <= 5 ? 'text-amber-500' : score <= 7 ? 'text-yellow-500' : 'text-green-500';
  const bgColor = score <= 3 ? 'bg-red-500' : score <= 5 ? 'bg-amber-500' : score <= 7 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">Not sure if your message sounds too harsh or too blunt? Let AI check the tone so you don't have to guess.</p>
      <VoiceTextArea value={text} onChange={setText} placeholder="Paste or speak a message to check its tone..." />
      <button onClick={judge} disabled={!text.trim() || loading} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
        {loading ? 'Judging...' : 'Check my tone'}
      </button>

      {result && result.score !== undefined && (
        <div className="bg-secondary/30 rounded-xl border border-border p-5 space-y-4">
          <div className="text-center">
            <p className={`text-4xl font-bold ${scoreColor}`}>{result.label}</p>
            <div className="mt-3 h-3 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full ${bgColor} rounded-full transition-all`} style={{ width: `${(score / 10) * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Blunt ← {' '} → Kind</p>
          </div>
          {result.explanation && <p className="text-sm text-center text-muted-foreground">{result.explanation}</p>}
          {result.suggestion && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400">Gentler version:</p>
              <div className="flex items-start gap-2">
                <p className="text-sm flex-1">{result.suggestion}</p>
                <CopyButton text={result.suggestion} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function GoblinTools() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Fun Tools</h1>
        <p className="text-muted-foreground">AI-powered ADHD toolkit. Break tasks down, fix your messages, check your tone, estimate your time.</p>
      </header>

      <Tabs defaultValue="magic">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="magic" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Wand2 className="w-3.5 h-3.5" /> <span>Magic ToDo</span>
          </TabsTrigger>
          <TabsTrigger value="estimate" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5" /> <span>Estimator</span>
          </TabsTrigger>
          <TabsTrigger value="tone" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <FileText className="w-3.5 h-3.5" /> <span>Tone Fixer</span>
          </TabsTrigger>
          <TabsTrigger value="judge" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Heart className="w-3.5 h-3.5" /> <span>Judge</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 bg-card border border-border rounded-xl p-6">
          <TabsContent value="magic"><MagicToDo /></TabsContent>
          <TabsContent value="estimate"><Estimator /></TabsContent>
          <TabsContent value="tone"><ToneFixer /></TabsContent>
          <TabsContent value="judge"><KindnessJudge /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
