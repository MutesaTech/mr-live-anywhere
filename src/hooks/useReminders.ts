import { useEffect, useState, useCallback } from 'react';

export type ReminderRepeat = 'once' | 'daily' | 'weekly' | 'monthly';
export type ReminderKind = 'tv' | 'radio';

export interface Reminder {
  id: string;
  channelId: string;
  channelName: string;
  kind: ReminderKind;
  date: string; // ISO yyyy-mm-dd
  time: string; // HH:mm
  repeat: ReminderRepeat;
  notifyBeforeMin: number;
  lastFiredAt?: number;
}

const KEY = 'reminders';

function load(): Reminder[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(list: Reminder[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

/** Next due timestamp for reminder, accounting for repeat. */
export function nextDue(r: Reminder, from = Date.now()): number {
  const base = new Date(`${r.date}T${r.time}:00`).getTime();
  if (Number.isNaN(base)) return Infinity;
  if (r.repeat === 'once') return base;
  let due = base;
  while (due < from) {
    const d = new Date(due);
    if (r.repeat === 'daily') d.setDate(d.getDate() + 1);
    else if (r.repeat === 'weekly') d.setDate(d.getDate() + 7);
    else if (r.repeat === 'monthly') d.setMonth(d.getMonth() + 1);
    due = d.getTime();
  }
  return due;
}

async function ensurePermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

function fire(r: Reminder) {
  const title = `${r.channelName} is starting soon`;
  const url = `${window.location.origin}/${r.kind === 'tv' ? 'channel' : 'radio'}/${r.channelId}`;
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(title, { body: 'Tap to open and start playing.', tag: r.id });
      n.onclick = () => { window.focus(); window.location.href = url; };
    } else {
      // fallback in-app toast via custom event
      window.dispatchEvent(new CustomEvent('reminder:fire', { detail: { reminder: r, url } }));
    }
  } catch {}
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(() => load());

  // schedule loop — checks every 30s
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      let changed = false;
      const updated = reminders.map((r) => {
        const due = nextDue(r) - r.notifyBeforeMin * 60_000;
        if (due <= now && (!r.lastFiredAt || now - r.lastFiredAt > 60_000)) {
          fire(r);
          changed = true;
          return { ...r, lastFiredAt: now };
        }
        return r;
      });
      if (changed) {
        setReminders(updated);
        save(updated);
      }
    };
    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, [reminders]);

  const add = useCallback(async (r: Omit<Reminder, 'id'>) => {
    await ensurePermission();
    const item: Reminder = { ...r, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    setReminders((prev) => {
      const next = [...prev, item];
      save(next);
      return next;
    });
    return item;
  }, []);

  const update = useCallback((id: string, patch: Partial<Reminder>) => {
    setReminders((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setReminders((prev) => {
      const next = prev.filter((r) => r.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { reminders, add, update, remove };
}