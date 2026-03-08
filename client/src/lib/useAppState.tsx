import React, { createContext, useContext, useState, useEffect } from 'react';

export type Subtask = { id: string; text: string; done: boolean };

export type Task = {
  id: string;
  title: string;
  status: 'inbox' | 'do_now' | 'done';
  createdAt: number;
  dueDate?: number | null;
  priority?: 'low' | 'medium' | 'high' | null;
  notes?: string;
  subtasks?: Subtask[];
};

export type ProjectTask = { id: string; title: string; status: 'backlog' | 'doing' | 'done'; tags: string[]; };

export type RoutineStep = { id: string; title: string; durationMinutes: number | null; };
export type Routine = {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly';
  streak: number;
  lastCompleted: number | null;
  steps: RoutineStep[];
  completionDates?: string[];
};

export type Plant = { id: string; name: string; lastWatered: number | null; waterIntervalDays: number; notes: string; lightLevel?: 'low' | 'medium' | 'high' | 'direct'; };

export type TimeBlock = { id: string; title: string; startMinutes: number; durationMinutes: number; color: string; date: string; category?: string; };

export type SmartGoalData = {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  category?: 'health' | 'career' | 'personal' | 'financial' | 'learning' | 'other';
  smart?: SmartGoalData;
};

export type PinnedNote = {
  id: string;
  text: string;
  color: string;
};

export type MoodEntry = {
  id: string;
  date: string;
  score: number;
  emoji: string;
  note?: string;
};

export type FocusTree = {
  id: string;
  date: string;
  durationMinutes: number;
  emoji: string;
};

export type BodyDoubleSession = {
  id: string;
  date: string;
  intention: string;
  durationMinutes: number;
  completed: boolean;
};

type AppState = {
  tasks: Task[];
  projectTasks: ProjectTask[];
  routines: Routine[];
  plants: Plant[];
  timeBlocks: TimeBlock[];
  goals: Goal[];
  pinnedNotes: PinnedNote[];
  moods: MoodEntry[];
  brainDump: string;
  panicMode: boolean;
  focusTrees: FocusTree[];
  bodyDoubleSessions: BodyDoubleSession[];
};

type AppContextType = AppState & {
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjectTasks: React.Dispatch<React.SetStateAction<ProjectTask[]>>;
  setRoutines: React.Dispatch<React.SetStateAction<Routine[]>>;
  setPlants: React.Dispatch<React.SetStateAction<Plant[]>>;
  setTimeBlocks: React.Dispatch<React.SetStateAction<TimeBlock[]>>;
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  setPinnedNotes: React.Dispatch<React.SetStateAction<PinnedNote[]>>;
  setMoods: React.Dispatch<React.SetStateAction<MoodEntry[]>>;
  setBrainDump: React.Dispatch<React.SetStateAction<string>>;
  setPanicMode: React.Dispatch<React.SetStateAction<boolean>>;
  setFocusTrees: React.Dispatch<React.SetStateAction<FocusTree[]>>;
  setBodyDoubleSessions: React.Dispatch<React.SetStateAction<BodyDoubleSession[]>>;
  exportData: () => string;
  importData: (json: string) => void;
  resetData: () => void;
};

const defaultSeed: AppState = {
  tasks: [
    { id: '1', title: 'Schedule dentist appointment', status: 'inbox', createdAt: Date.now(), dueDate: Date.now() + 86400000 * 3, priority: 'medium' },
    { id: '2', title: 'Reply to Sarah about the weekend', status: 'inbox', createdAt: Date.now() - 100000, priority: 'high' },
    { id: '3', title: 'Pay electricity bill', status: 'do_now', createdAt: Date.now() - 200000, dueDate: Date.now() + 86400000, priority: 'high' },
  ],
  projectTasks: [
    { id: 'p1', title: 'Design landing page', status: 'doing', tags: ['FRANKIE app', 'design'] },
    { id: 'p2', title: 'Write copy for about section', status: 'backlog', tags: ['writing'] },
    { id: 'p3', title: 'Fix navigation bug', status: 'done', tags: ['admin'] },
  ],
  routines: [
    {
      id: 'r1', title: 'Morning Launch Sequence', type: 'daily', streak: 12, lastCompleted: Date.now() - 86400000,
      steps: [
        { id: 's1', title: 'Drink a glass of water', durationMinutes: 1 },
        { id: 's2', title: 'Stretch for 5 minutes', durationMinutes: 5 },
        { id: 's3', title: "Review today's top 3 tasks", durationMinutes: 3 },
        { id: 's4', title: 'Take medication', durationMinutes: 1 },
      ]
    },
    {
      id: 'r2', title: 'Weekly Review', type: 'weekly', streak: 4, lastCompleted: null,
      steps: [
        { id: 's5', title: 'Clear inbox to zero', durationMinutes: 10 },
        { id: 's6', title: 'Review project board', durationMinutes: 5 },
        { id: 's7', title: "Plan next week's priorities", durationMinutes: 15 },
      ]
    },
  ],
  plants: [
    { id: 'pl1', name: 'Monstera', lastWatered: Date.now() - 86400000 * 5, waterIntervalDays: 7, notes: 'Keep in bright indirect light.', lightLevel: 'medium' },
    { id: 'pl2', name: 'Snakey', lastWatered: Date.now() - 86400000 * 10, waterIntervalDays: 14, notes: 'Very forgiving.', lightLevel: 'low' },
  ],
  timeBlocks: [],
  goals: [
    { id: 'g1', title: 'Read 12 books this year', status: 'in_progress', progress: 25, category: 'learning', targetDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0] },
    { id: 'g2', title: 'Exercise 3x per week', status: 'in_progress', progress: 60, category: 'health' },
  ],
  pinnedNotes: [
    { id: 'pn1', text: "Water Monstera on Friday", color: 'green' },
    { id: 'pn2', text: "Call the bank before 5pm", color: 'yellow' },
  ],
  moods: [],
  brainDump: '',
  panicMode: false,
  focusTrees: [],
  bodyDoubleSessions: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [pinnedNotes, setPinnedNotes] = useState<PinnedNote[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [brainDump, setBrainDump] = useState('');
  const [panicMode, setPanicMode] = useState(false);
  const [focusTrees, setFocusTrees] = useState<FocusTree[]>([]);
  const [bodyDoubleSessions, setBodyDoubleSessions] = useState<BodyDoubleSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('chaos-dashboard-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTasks(parsed.tasks || []);
        setProjectTasks(parsed.projectTasks || []);
        setRoutines((parsed.routines || []).map((r: any) => ({ ...r, steps: r.steps || [] })));
        setPlants(parsed.plants || []);
        setTimeBlocks(parsed.timeBlocks || []);
        setGoals(parsed.goals || []);
        setPinnedNotes(parsed.pinnedNotes || []);
        setMoods(parsed.moods || []);
        setBrainDump(parsed.brainDump || '');
        setFocusTrees(parsed.focusTrees || []);
        setBodyDoubleSessions(parsed.bodyDoubleSessions || []);
      } catch (e) {
        console.error('Failed to parse local storage', e);
      }
    } else {
      setTasks(defaultSeed.tasks);
      setProjectTasks(defaultSeed.projectTasks);
      setRoutines(defaultSeed.routines);
      setPlants(defaultSeed.plants as any);
      setGoals(defaultSeed.goals);
      setPinnedNotes(defaultSeed.pinnedNotes);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const stateToSave = { tasks, projectTasks, routines, plants, timeBlocks, goals, pinnedNotes, moods, brainDump, focusTrees, bodyDoubleSessions };
      localStorage.setItem('chaos-dashboard-data', JSON.stringify(stateToSave));
    }
  }, [tasks, projectTasks, routines, plants, timeBlocks, goals, pinnedNotes, moods, brainDump, focusTrees, bodyDoubleSessions, isLoaded]);

  const exportData = () => JSON.stringify({ tasks, projectTasks, routines, plants, timeBlocks, goals, pinnedNotes, moods, brainDump, focusTrees, bodyDoubleSessions }, null, 2);

  const importData = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      setTasks(parsed.tasks || []);
      setProjectTasks(parsed.projectTasks || []);
      setRoutines(parsed.routines || []);
      setPlants(parsed.plants || []);
      setTimeBlocks(parsed.timeBlocks || []);
      setGoals(parsed.goals || []);
      setPinnedNotes(parsed.pinnedNotes || []);
      setMoods(parsed.moods || []);
      setBrainDump(parsed.brainDump || '');
      setFocusTrees(parsed.focusTrees || []);
      setBodyDoubleSessions(parsed.bodyDoubleSessions || []);
    } catch {
      alert("Invalid JSON data");
    }
  };

  const resetData = () => {
    setTasks(defaultSeed.tasks);
    setProjectTasks(defaultSeed.projectTasks);
    setRoutines(defaultSeed.routines);
    setPlants(defaultSeed.plants as any);
    setGoals(defaultSeed.goals);
    setPinnedNotes(defaultSeed.pinnedNotes);
    setMoods([]);
    setBrainDump('');
    setTimeBlocks([]);
    setFocusTrees([]);
    setBodyDoubleSessions([]);
  };

  return (
    <AppContext.Provider value={{
      tasks, setTasks,
      projectTasks, setProjectTasks,
      routines, setRoutines,
      plants, setPlants,
      timeBlocks, setTimeBlocks,
      goals, setGoals,
      pinnedNotes, setPinnedNotes,
      moods, setMoods,
      brainDump, setBrainDump,
      panicMode, setPanicMode,
      focusTrees, setFocusTrees,
      bodyDoubleSessions, setBodyDoubleSessions,
      exportData, importData, resetData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
