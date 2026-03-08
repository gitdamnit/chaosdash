import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Wind, Eye, Hand, Play, Square } from 'lucide-react';

type BreathingPattern = {
  name: string;
  description: string;
  phases: { label: string; duration: number; instruction: string }[];
  benefit: string;
  color: string;
};

const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    name: 'Box Breathing',
    description: 'Used by Navy SEALs and recommended for ADHD anxiety regulation.',
    benefit: 'Activates parasympathetic nervous system, reduces cortisol',
    color: 'from-blue-500 to-indigo-500',
    phases: [
      { label: 'Inhale', duration: 4, instruction: 'Breathe in slowly through your nose' },
      { label: 'Hold', duration: 4, instruction: 'Hold your breath, stay still' },
      { label: 'Exhale', duration: 4, instruction: 'Breathe out slowly through your mouth' },
      { label: 'Hold', duration: 4, instruction: 'Hold empty, wait calmly' },
    ],
  },
  {
    name: '4-7-8 Breathing',
    description: 'Dr. Weil\'s relaxation breath. Excellent for racing thoughts and pre-sleep calm.',
    benefit: 'Powerful nervous system reset, promotes sleep',
    color: 'from-purple-500 to-pink-500',
    phases: [
      { label: 'Inhale', duration: 4, instruction: 'Inhale through nose for 4 counts' },
      { label: 'Hold', duration: 7, instruction: 'Hold your breath for 7 counts' },
      { label: 'Exhale', duration: 8, instruction: 'Exhale through mouth for 8 counts' },
    ],
  },
  {
    name: 'Energizing Breath',
    description: 'Quick inhale-exhale cycles to sharpen focus before a task.',
    benefit: 'Boosts alertness and dopamine, great pre-focus',
    color: 'from-orange-500 to-yellow-500',
    phases: [
      { label: 'Short In', duration: 2, instruction: 'Quick inhale through nose' },
      { label: 'Short Out', duration: 2, instruction: 'Quick exhale through mouth' },
    ],
  },
];

const GROUNDING_STEPS = [
  { count: 5, sense: 'SEE', icon: Eye, instruction: 'Name 5 things you can see right now. Take your time with each one.' },
  { count: 4, sense: 'TOUCH', icon: Hand, instruction: 'Notice 4 things you can physically feel. The floor under your feet, fabric on your skin.' },
  { count: 3, sense: 'HEAR', icon: Wind, instruction: 'Identify 3 sounds you can hear. Near sounds and distant sounds.' },
  { count: 2, sense: 'SMELL', icon: Heart, instruction: 'Notice 2 things you can smell, or recall 2 favourite smells.' },
  { count: 1, sense: 'TASTE', icon: Heart, instruction: 'What is 1 thing you can taste, or what did you last eat?' },
];

function BreathingExercise({ pattern }: { pattern: BreathingPattern }) {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(pattern.phases[0].duration);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<any>(null);

  const currentPhase = pattern.phases[phaseIndex];
  const isInhale = currentPhase.label.toLowerCase().includes('in');
  const isHold = currentPhase.label.toLowerCase() === 'hold';

  useEffect(() => {
    setPhaseIndex(0);
    setTimeLeft(pattern.phases[0].duration);
    setRunning(false);
    setCycles(0);
  }, [pattern]);

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          const nextIndex = (phaseIndex + 1) % pattern.phases.length;
          setPhaseIndex(nextIndex);
          if (nextIndex === 0) setCycles(c => c + 1);
          setTimeLeft(pattern.phases[nextIndex].duration);
          return pattern.phases[nextIndex].duration;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phaseIndex, pattern]);

  const scale = isInhale ? 1.5 : isHold ? (phaseIndex === 1 ? 1.5 : 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{pattern.description}</p>
          <p className="text-xs text-primary mt-1">{pattern.benefit}</p>
        </div>
        {cycles > 0 && <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{cycles} cycle{cycles > 1 ? 's' : ''}</span>}
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
          <motion.div
            animate={{ scale }}
            transition={{ duration: currentPhase.duration, ease: 'easeInOut' }}
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${pattern.color} opacity-20`}
          />
          <motion.div
            animate={{ scale }}
            transition={{ duration: currentPhase.duration, ease: 'easeInOut' }}
            className={`w-28 h-28 rounded-full bg-gradient-to-br ${pattern.color} flex flex-col items-center justify-center text-white shadow-lg`}
          >
            <span className="text-3xl font-bold font-mono">{timeLeft}</span>
            <span className="text-xs font-medium uppercase tracking-widest">{currentPhase.label}</span>
          </motion.div>
        </div>

        <p className="text-center text-muted-foreground text-sm max-w-xs">{currentPhase.instruction}</p>

        <div className="flex gap-2">
          {pattern.phases.map((p, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === phaseIndex ? 'w-8 bg-primary' : 'w-4 bg-secondary'}`} />
          ))}
        </div>

        <button
          onClick={() => { setRunning(!running); if (!running) { setPhaseIndex(0); setTimeLeft(pattern.phases[0].duration); setCycles(0); } }}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors shadow-lg ${running ? 'bg-red-500 hover:bg-red-600' : `bg-gradient-to-br ${pattern.color}`}`}
        >
          {running ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
        </button>
      </div>
    </div>
  );
}

function GroundingExercise() {
  const [stepIndex, setStepIndex] = useState(-1);
  const [checkCount, setCheckCount] = useState(0);
  const step = GROUNDING_STEPS[stepIndex];

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">The 5-4-3-2-1 method grounds you in the present moment. Perfect when overwhelmed, anxious, or spiraling.</p>

      {stepIndex === -1 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-6">Find a comfortable position. You can do this anywhere — at your desk, on the bus, wherever you are right now.</p>
          <button onClick={() => { setStepIndex(0); setCheckCount(0); }} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90">
            Start Grounding
          </button>
        </div>
      ) : stepIndex < GROUNDING_STEPS.length ? (
        <AnimatePresence mode="wait">
          <motion.div key={stepIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
            <div className="text-center">
              <span className="text-7xl font-black text-primary">{step.count}</span>
              <p className="text-2xl font-bold mt-1">Things you can <span className="text-primary">{step.sense}</span></p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-5 text-center">
              <p className="text-muted-foreground">{step.instruction}</p>
            </div>
            <div className="flex justify-center gap-2">
              {Array.from({ length: step.count }).map((_, i) => (
                <button key={i} onClick={() => setCheckCount(c => Math.min(c + 1, step.count))}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${i < checkCount ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                  {i < checkCount && <Heart className="w-4 h-4 fill-current" />}
                </button>
              ))}
            </div>
            {checkCount >= step.count && (
              <div className="text-center">
                <button onClick={() => { setStepIndex(stepIndex + 1); setCheckCount(0); }} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium">
                  {stepIndex < GROUNDING_STEPS.length - 1 ? 'Next →' : 'Finish'}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="text-center py-8 space-y-4">
          <p className="text-3xl">You did it.</p>
          <p className="text-muted-foreground">You are here. You are present. Notice how you feel right now compared to when you started.</p>
          <button onClick={() => { setStepIndex(-1); setCheckCount(0); }} className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg font-medium">
            Start over
          </button>
        </div>
      )}
    </div>
  );
}

function BodyScan() {
  const regions = [
    { name: 'Head & Face', guide: 'Soften your jaw. Unclench your teeth. Relax your forehead. Let your eyes be heavy.' },
    { name: 'Neck & Shoulders', guide: 'Let your shoulders drop. Release any tension in your neck. Feel the weight of your arms.' },
    { name: 'Chest & Breathing', guide: 'Notice your breath. Is it shallow? Let it deepen. Feel your chest rise and fall.' },
    { name: 'Stomach & Core', guide: 'Soften your belly. Many people carry anxiety here. Let it be soft and relaxed.' },
    { name: 'Hands & Arms', guide: 'Open your palms. Feel the air on your skin. Release any grip.' },
    { name: 'Legs & Feet', guide: 'Feel the floor or chair beneath you. Press your feet down gently. Notice the support.' },
  ];
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">A slow, deliberate scan from head to toe helps release physical tension you might not even notice you're holding.</p>
      {!started ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-6">Find a quiet moment. Sit comfortably or lie down. This takes about 3 minutes.</p>
          <button onClick={() => setStarted(true)} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium">Begin Body Scan</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-1">
            {regions.map((r, i) => (
              <div key={i} onClick={() => setCurrent(i)} className={`flex-1 h-2 rounded-full cursor-pointer transition-colors ${i <= current ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-secondary/50 rounded-xl p-8 text-center space-y-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Focus on</p>
              <h3 className="text-2xl font-bold text-primary">{regions[current].name}</h3>
              <p className="text-muted-foreground leading-relaxed">{regions[current].guide}</p>
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-3 justify-center">
            {current > 0 && <button onClick={() => setCurrent(c => c - 1)} className="px-4 py-2 bg-secondary rounded-lg text-sm">← Back</button>}
            {current < regions.length - 1
              ? <button onClick={() => setCurrent(c => c + 1)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Next area →</button>
              : <button onClick={() => { setStarted(false); setCurrent(0); }} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium">Complete</button>
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default function Mindfulness() {
  const [tab, setTab] = useState<'breathing' | 'grounding' | 'body'>('breathing');
  const [selectedPattern, setSelectedPattern] = useState(0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Calm Corner</h1>
        <p className="text-muted-foreground">Science-backed tools for when ADHD overwhelm kicks in. No app subscription required.</p>
      </header>

      <div className="flex gap-2 bg-secondary/50 p-1 rounded-xl">
        {[
          { id: 'breathing', label: 'Breathing', icon: Wind },
          { id: 'grounding', label: '5-4-3-2-1', icon: Hand },
          { id: 'body', label: 'Body Scan', icon: Heart },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {tab === 'breathing' && (
          <div className="space-y-6">
            <div className="flex gap-2">
              {BREATHING_PATTERNS.map((p, i) => (
                <button key={i} onClick={() => setSelectedPattern(i)}
                  className={`flex-1 py-2 px-3 text-xs rounded-lg font-medium transition-colors ${i === selectedPattern ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                  {p.name}
                </button>
              ))}
            </div>
            <BreathingExercise pattern={BREATHING_PATTERNS[selectedPattern]} />
          </div>
        )}
        {tab === 'grounding' && <GroundingExercise />}
        {tab === 'body' && <BodyScan />}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2">Based on clinical evidence</p>
        These techniques are adapted from evidence-based approaches used in ADHD treatment — including mindfulness-based cognitive therapy (MBCT), polyvagal theory breathing work, and somatic grounding methods used in trauma-informed ADHD care.
      </div>
    </div>
  );
}
