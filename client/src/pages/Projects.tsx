import React, { useState } from 'react';
import { useApp } from '@/lib/useAppState';
import { Plus, MoreVertical, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { MicButton } from '@/components/ui/mic-button';

function parseTask(input: string) {
  const words = input.split(' ');
  const tags = words.filter(w => w.startsWith('#')).map(t => t.substring(1));
  const title = words.filter(w => !w.startsWith('#')).join(' ').trim();
  return { title, tags };
}

export default function Projects() {
  const { projectTasks, setProjectTasks } = useApp();
  const [newTask, setNewTask] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const speech = useSpeechToText({
    continuous: false,
    onTranscript: (text) => {
      const { title, tags } = parseTask(text.trim());
      if (!title) return;
      setProjectTasks(prev => [
        { id: Date.now().toString(), title, status: 'backlog', tags },
        ...prev
      ]);
    },
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const { title, tags } = parseTask(newTask);
    setProjectTasks([
      { id: Date.now().toString(), title, status: 'backlog', tags },
      ...projectTasks
    ]);
    setNewTask('');
  };

  const moveTask = (id: string, newStatus: 'backlog' | 'doing' | 'done') => {
    setProjectTasks(projectTasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const deleteTask = (id: string) => {
    setProjectTasks(projectTasks.filter(t => t.id !== id));
  };

  const allTags = Array.from(new Set(projectTasks.flatMap(t => t.tags)));

  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'border-border' },
    { id: 'doing', title: 'Doing', color: 'border-primary' },
    { id: 'done', title: 'Done', color: 'border-green-500/50' }
  ] as const;

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Projects Kanban</h1>
        <p className="text-muted-foreground">Lightweight tracking. Add #tags to organize. Use the mic to speak tasks.</p>
      </header>

      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl border border-border">
        <div className="flex-1 min-w-[250px] flex flex-col gap-2">
          {speech.isListening && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                {speech.interimTranscript
                  ? `"${speech.interimTranscript}"`
                  : 'Listening... say a task to add it to Backlog'}
              </span>
            </div>
          )}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <Input 
              data-testid="input-new-project-task"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="New task... e.g. Fix navbar #admin"
              className="bg-background"
            />
            <MicButton
              isListening={speech.isListening}
              isSupported={speech.isSupported}
              onToggle={speech.toggleListening}
            />
            <button
              type="submit"
              data-testid="button-add-project-task"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
            >
              Add
            </button>
          </form>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm text-muted-foreground mr-2"><Tag className="w-4 h-4 inline" /> Filter:</span>
          <button 
            onClick={() => setFilterTag(null)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${!filterTag ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button 
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${filterTag === tag ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 pb-10">
        {columns.map(col => {
          const colTasks = projectTasks.filter(t => t.status === col.id && (!filterTag || t.tags.includes(filterTag)));
          
          return (
            <div key={col.id} className="bg-secondary/30 rounded-xl border border-border flex flex-col max-h-[calc(100vh-250px)]">
              <div className={`p-4 border-b-2 ${col.color}`}>
                <h3 className="font-bold capitalize flex justify-between items-center">
                  {col.title}
                  <span className="bg-background text-muted-foreground text-xs py-1 px-2 rounded-full font-normal">
                    {colTasks.length}
                  </span>
                </h3>
              </div>
              
              <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                {colTasks.map(task => (
                  <div key={task.id} className="bg-card p-4 rounded-lg border border-border shadow-sm group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm leading-snug">{task.title}</p>
                      <button onClick={() => deleteTask(task.id)} className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {task.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 text-xs">
                      {col.id !== 'backlog' && (
                        <button onClick={() => moveTask(task.id, 'backlog')} className="text-muted-foreground hover:text-foreground">← Backlog</button>
                      )}
                      {col.id !== 'doing' && (
                        <button onClick={() => moveTask(task.id, 'doing')} className="text-muted-foreground hover:text-primary">Doing</button>
                      )}
                      {col.id !== 'done' && (
                        <button onClick={() => moveTask(task.id, 'done')} className="text-muted-foreground hover:text-green-500 ml-auto">Done →</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
