import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, SkipForward } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface StreamErrorHandlerProps {
  error: string | null;
  channelName: string;
  onRetry: () => void;
  onSwitchToNext: () => void;
  autoSwitchDelay?: number;
  className?: string;
}

const StreamErrorHandler = ({
  error,
  channelName,
  onRetry,
  onSwitchToNext,
  autoSwitchDelay = 5000,
  className,
}: StreamErrorHandlerProps) => {
  const [countdown, setCountdown] = useState(autoSwitchDelay / 1000);

  useEffect(() => {
    if (!error) {
      setCountdown(autoSwitchDelay / 1000);
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onSwitchToNext();
          return autoSwitchDelay / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [error, autoSwitchDelay, onSwitchToNext]);

  if (!error) return null;

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center bg-black/90 z-10",
      "transition-opacity duration-200",
      className
    )}>
      <div className="text-center p-6 max-w-sm">
        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        
        <h3 className="text-h3 font-semibold text-white mb-2">
          Channel Unavailable
        </h3>
        <p className="text-caption text-white/70 mb-4">
          {channelName} is currently unavailable. Switching to next recommended channel in {countdown}s...
        </p>
        
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2 border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button
            size="sm"
            onClick={onSwitchToNext}
            className="gap-2"
          >
            <SkipForward className="h-4 w-4" />
            Switch Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StreamErrorHandler;
