import { useState, useEffect } from 'react';
import { RefreshCw, SkipForward, WifiOff } from 'lucide-react';
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

  // Progress toward auto-switch — fills as time elapses before switching.
  const progress = Math.min(
    100,
    Math.max(0, ((autoSwitchDelay - countdown * 1000) / autoSwitchDelay) * 100)
  );

  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden p-6 text-center',
        'rounded-2xl bg-slate-950 border border-slate-800/80',
        'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950',
        className
      )}
    >
      {/* Icon — muted signal loss in a soft glow pill */}
      <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/5">
        <WifiOff className="h-6 w-6" />
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
        {isOffline ? "You're offline" : 'Channel Unavailable'}
      </h3>

      {/* Subtitle */}
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-4">
        {isOffline
          ? 'Connect to the internet to watch live TV. Playback resumes automatically once your connection is restored.'
          : 'Stream is temporarily offline.'}
      </p>

      {/* Auto-switch countdown — pill + animated progress bar */}
      {!isOffline && (
        <div className="w-full max-w-[220px] mb-5" role="status" aria-live="polite">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Auto-switch
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 border border-slate-700 px-2.5 py-0.5 text-[10px] font-medium text-indigo-300 tabular-nums">
              Switching in {countdown}s...
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-slate-800/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
        {!isOffline && (
          <button
            type="button"
            onClick={onSwitchToNext}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-1.5"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Switch Now
          </button>
        )}
      </div>
    </div>
  );
};

export default StreamErrorHandler;
