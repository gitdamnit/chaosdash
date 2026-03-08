import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Mic, MicOff, Zap } from 'lucide-react';
import { useApp } from '@/lib/useAppState';
import { useSpeechToText } from '@/hooks/use-speech-to-text';

interface QuickCaptureProps {
  open: boolean;
  onClose: () => void;
}

export function QuickCapture({ open, onClose }: QuickCaptureProps) {
  const { setTasks } = useApp();
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'inbox' | 'do_now'>('inbox');
  const inputRef = useRef<HTMLInputElement>(null);

  const speech = useSpeechToText({
    continuous: false,
    onTranscript: (t) => {
      setText(prev => (prev ? prev + ' ' + t.trim() : t.trim()));
    },
  });

  useEffect(() => {
    if (open) {
      setText('');
      setMode('inbox');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const submit = () => {
    if (!text.trim()) return;
    setTasks(prev => [
      ...prev,
      { id: Date.now().toString(), title: text.trim(), status: mode, createdAt: Date.now() },
    ]);
    setText('');
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Quick Capture</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-2">
          <p className="text-xs text-muted-foreground mb-3">Capture it before it's gone. You can organise later.</p>

          {speech.isListening && (
            <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {speech.interimTranscript ? `"${speech.interimTranscript}"` : 'Listening…'}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="What's on your mind?"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-primary outline-none"
            />
            {speech.isSupported && (
              <button
                onClick={speech.toggleListening}
                className={`p-3 rounded-xl border transition-colors ${speech.isListening ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}
              >
                {speech.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 flex items-center gap-3">
          <div className="flex gap-1 flex-1">
            <button
              onClick={() => setMode('inbox')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'inbox' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              Inbox
            </button>
            <button
              onClick={() => setMode('do_now')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'do_now' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              Do Now
            </button>
          </div>
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-xl font-semibold text-sm disabled:opacity-40 transition-opacity flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="px-5 pb-4 text-xs text-muted-foreground flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">Enter</kbd> to add ·
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">Esc</kbd> to dismiss ·
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">Ctrl+Shift+K</kbd> to reopen
        </div>
      </div>
    </div>
  );
}

export function QuickCaptureFAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid="button-quick-capture"
      title="Quick capture (Ctrl+K)"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 hover:scale-105"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
