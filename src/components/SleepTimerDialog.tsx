import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Moon, X } from 'lucide-react';
import { useSleepTimer, formatRemaining } from '@/hooks/useSleepTimer';
import { cn } from '@/lib/utils';

const PRESETS = [15, 30, 60, 120];

const SleepTimerDialog = () => {
  const { remaining, isActive, start, cancel } = useSleepTimer();
  const [custom, setCustom] = useState('');
  const [open, setOpen] = useState(false);

  const apply = (mins: number) => {
    if (mins > 0) start(mins);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Moon className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-body font-medium">Sleep Timer</p>
              <p className="text-caption text-muted-foreground">
                {isActive ? `Stops in ${formatRemaining(remaining)}` : 'Auto-stop playback'}
              </p>
            </div>
          </div>
          {isActive && <span className="text-xs font-mono text-primary">{formatRemaining(remaining)}</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sleep Timer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((m) => (
              <Button
                key={m}
                variant="outline"
                className={cn('h-14 text-base font-semibold', isActive && 'opacity-80')}
                onClick={() => apply(m)}
              >
                {m < 60 ? `${m} min` : `${m / 60} hour${m / 60 > 1 ? 's' : ''}`}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-caption text-muted-foreground">Custom (minutes)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                placeholder="e.g. 45"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
              <Button onClick={() => apply(Number(custom) || 0)} disabled={!Number(custom)}>Set</Button>
            </div>
          </div>
          {isActive && (
            <Button variant="destructive" className="w-full" onClick={() => { cancel(); setOpen(false); }}>
              <X className="h-4 w-4 mr-2" /> Cancel timer
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SleepTimerDialog;