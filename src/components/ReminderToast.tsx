import { useEffect, useState } from 'react';
import { Bell, X, Play } from 'lucide-react';
import { Button } from './ui/button';
import { stopReminderSound, type Reminder } from '@/hooks/useReminders';

type FireDetail = { reminder: Reminder; url: string };

const ReminderToast = () => {
  const [active, setActive] = useState<FireDetail | null>(null);

  useEffect(() => {
    const onFire = (e: Event) => {
      const detail = (e as CustomEvent<FireDetail>).detail;
      if (detail) setActive(detail);
    };
    const onDismiss = () => setActive(null);
    window.addEventListener('reminder:fire', onFire as EventListener);
    window.addEventListener('reminder:dismiss', onDismiss as EventListener);
    return () => {
      window.removeEventListener('reminder:fire', onFire as EventListener);
      window.removeEventListener('reminder:dismiss', onDismiss as EventListener);
    };
  }, []);

  if (!active) return null;
  const { reminder, url } = active;

  const open = () => {
    stopReminderSound();
    setActive(null);
    const path = new URL(url).pathname;
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  const dismiss = () => { stopReminderSound(); setActive(null); };

  return (
    <div
      role="alert"
      className="fixed left-1/2 -translate-x-1/2 z-[60] top-4 w-[min(92vw,420px)] glass-strong border border-primary/40 rounded-2xl shadow-2xl p-3 animate-slide-up"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 grid place-items-center shrink-0">
          <Bell className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{reminder.channelName}</p>
          <p className="text-xs text-muted-foreground">Reminder is starting now</p>
        </div>
        <Button size="sm" onClick={open} className="h-9">
          <Play className="h-4 w-4 mr-1" /> Open
        </Button>
        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={dismiss} aria-label="Dismiss">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ReminderToast;