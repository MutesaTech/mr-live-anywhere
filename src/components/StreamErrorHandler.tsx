import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, SkipForward, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface StreamErrorHandlerProps {
  error: string | null;
  channelName: string;
  isOffline?: boolean;
  onRetry: () => void;
  onSwitchToNext: () => void;
  autoSwitchDelay?: number;
  className?: string;
}

const StreamErrorHandler = ({
  error,
  channelName,
  isOffline = false,
  onRetry,
  onSwitchToNext,
  autoSwitchDelay = 5000,
  className,
}: StreamErrorHandlerProps) => {
  const [countdown, setCountdown] = useState(autoSwitchDelay / 1000);

  useEffect(() => {
    // Auto-switching is disabled while offline — the network, not the channel, is the problem.
    if (!error || isOffline) {
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
  }, [error, isOffline, autoSwitchDelay, onSwitchToNext]);

  if (!error && !isOffline) return null;

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center bg-black/90 z-10",
      "transition-opacity duration-200",
      className
    )}>
      <div className="text-center p-6 max-w-sm">
        <div className="flex items-center justify-center mb-4">
          <div className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center",
            isOffline ? "bg-accent/20" : "bg-destructive/20"
          )}>
            {isOffline
              ? <WifiOff className="h-8 w-8 text-accent" />
              : <AlertTriangle className="h-8 w-8 text-destructive" />}
          </div>
        </div>

        <h3 className="text-h3 font-semibold text-white mb-2">
          {isOffline ? 'Connection Lost' : 'Channel Unavailable'}
        </h3>
        <p className="text-caption text-white/70 mb-4">
          {isOffline
            ? 'You are offline. Playback will resume once your connection is restored.'
            : `This channel is currently unavailable. Switching to the next recommended channel in ${countdown}s...`}
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
          {!isOffline && (
            <Button size="sm" onClick={onSwitchToNext} className="gap-2">
              <SkipForward className="h-4 w-4" />
              Switch Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamErrorHandler;
