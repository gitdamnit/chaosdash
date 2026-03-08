import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MicButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function MicButton({ isListening, isSupported, onToggle, size = 'md', className }: MicButtonProps) {
  if (!isSupported) {
    return (
      <button
        disabled
        title="Speech recognition not supported in this browser. Try Chrome or Edge."
        className={cn(
          'shrink-0 rounded-lg flex items-center justify-center opacity-30 cursor-not-allowed bg-secondary text-muted-foreground',
          size === 'sm' ? 'w-8 h-8' : 'p-2',
          className
        )}
      >
        <MicOff className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      title={isListening ? 'Stop recording' : 'Start voice input'}
      data-testid="button-mic"
      className={cn(
        'shrink-0 rounded-lg flex items-center justify-center transition-all duration-200',
        size === 'sm' ? 'w-8 h-8' : 'p-2',
        isListening
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
          : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary',
        className
      )}
    >
      {isListening ? (
        <Mic className={cn('animate-pulse', size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5')} />
      ) : (
        <Mic className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
      )}
    </button>
  );
}
