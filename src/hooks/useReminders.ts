import { useEffect, useState, useCallback } from 'react';

export type ReminderRepeat = 'once' | 'daily' | 'weekly' | 'monthly';
export type ReminderKind = 'tv' | 'radio';
export type ReminderStatus = 'upcoming' | 'completed' | 'missed';

export const REMINDER_SOUNDS = [
  { id: 'jazz', name: 'Jazz', url: 'https://ia601009.us.archive.org/5/items/velvet-lobby/Velvet%20Lobby.mp3' },
  { id: 'velvet', name: 'Velvet Reminder', url: 'https://ia601801.us.archive.org/11/items/velvet-reminder/Velvet%20Reminder.mp3' },
  { id: 'glass', name: 'Calendar Glass', url: 'https://ia600102.us.archive.org/30/items/glass-calendar/Glass%20Calendar.mp3' },
] as const;

export type ReminderSoundId = typeof REMINDER_SOUNDS[number]['id'];
/** Duration in seconds, or 'manual' to play until dismissed. */
export type ReminderDuration = 5 | 10 | 15 | 30 | 60 | 'manual';

export interface Reminder {
  id: string;
  channelId: string;
  channelName: string;
  kind: ReminderKind;
  date: string; // ISO yyyy-mm-dd
  time: string; // HH:mm
  repeat: ReminderRepeat;
  notifyBeforeMin: number;
  soundId?: ReminderSoundId;
  duration?: ReminderDuration;
  lastFiredAt?: number;
  status?: ReminderStatus;
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

/**
 * Try to schedule a true OS-level notification via Capacitor Local Notifications
 * when running inside a native shell. Silently no-ops in pure web.
 */
async function scheduleNative(r: Reminder) {
  try {
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    const mod: any = await import(/* @vite-ignore */ '@capacitor/local-notifications').catch(() => null);
    if (!mod?.LocalNotifications) return;
    const { LocalNotifications } = mod;
    await LocalNotifications.requestPermissions();
    const at = new Date(nextDue(r) - r.notifyBeforeMin * 60_000);
    const idNum = Math.abs([...r.id].reduce((a, c) => a + c.charCodeAt(0), 0)) % 2147483647;
    await LocalNotifications.cancel({ notifications: [{ id: idNum }] }).catch(() => {});
    await LocalNotifications.schedule({
      notifications: [{
        id: idNum,
        title: `${r.channelName} is starting now`,
        body: 'Tap to open and start playing.',
        schedule: { at, allowWhileIdle: true, repeats: r.repeat !== 'once', every: r.repeat === 'daily' ? 'day' : r.repeat === 'weekly' ? 'week' : r.repeat === 'monthly' ? 'month' : undefined },
        smallIcon: 'ic_stat_icon_config_sample',
        extra: { url: `/${r.kind === 'tv' ? 'channel' : 'radio'}/${r.channelId}`, reminderId: r.id },
      }],
    });
  } catch {}
}

async function cancelNative(r: Reminder) {
  try {
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    const mod: any = await import(/* @vite-ignore */ '@capacitor/local-notifications').catch(() => null);
    if (!mod?.LocalNotifications) return;
    const idNum = Math.abs([...r.id].reduce((a, c) => a + c.charCodeAt(0), 0)) % 2147483647;
    await mod.LocalNotifications.cancel({ notifications: [{ id: idNum }] });
  } catch {}
}

let currentAudio: HTMLAudioElement | null = null;
let currentStopTimer: number | null = null;

export function stopReminderSound() {
  if (currentStopTimer) { window.clearTimeout(currentStopTimer); currentStopTimer = null; }
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.currentTime = 0; } catch {}
    currentAudio = null;
  }
  window.dispatchEvent(new CustomEvent('reminder:dismiss'));
}

function playReminderSound(r: Reminder) {
  const sound = REMINDER_SOUNDS.find(s => s.id === (r.soundId ?? 'velvet')) ?? REMINDER_SOUNDS[1];
  const duration = r.duration ?? 15;
  try {
    stopReminderSound();
    const audio = new Audio(sound.url);
    audio.loop = true;
    audio.volume = 0.9;
    currentAudio = audio;
    audio.play().catch(() => {});
    if (duration !== 'manual') {
      currentStopTimer = window.setTimeout(() => stopReminderSound(), duration * 1000);
    }
    // vibrate where supported
    if ('vibrate' in navigator) {
      try { (navigator as any).vibrate([300, 150, 300, 150, 300]); } catch {}
    }
  } catch {}
}

function fire(r: Reminder) {
  const title = `${r.channelName} is starting soon`;
  const url = `${window.location.origin}/${r.kind === 'tv' ? 'channel' : 'radio'}/${r.channelId}`;
  playReminderSound(r);
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(title, {
        body: 'Tap to open and start playing.',
        tag: r.id,
        requireInteraction: r.duration === 'manual',
        silent: false,
      } as any);
      n.onclick = () => {
        window.focus();
        stopReminderSound();
        window.location.href = url;
      };
    } else {
      window.dispatchEvent(new CustomEvent('reminder:fire', { detail: { reminder: r, url } }));
    }
    window.dispatchEvent(new CustomEvent('reminder:fire', { detail: { reminder: r, url } }));
  } catch {}
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(() => load());

  // On mount: detect missed reminders (scheduled before last open and never fired).
  useEffect(() => {
    const now = Date.now();
    let changed = false;
    const updated = reminders.map((r) => {
      if (r.repeat !== 'once') return r;
      const due = nextDue(r);
      if (due < now - 60_000 && !r.lastFiredAt && r.status !== 'missed') {
        changed = true;
        return { ...r, status: 'missed' as ReminderStatus };
      }
      return r;
    });
    if (changed) { setReminders(updated); save(updated); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          return { ...r, lastFiredAt: now, status: (r.repeat === 'once' ? 'completed' : 'upcoming') as ReminderStatus };
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
    const item: Reminder = { ...r, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, status: 'upcoming' };
    scheduleNative(item);
    setReminders((prev) => {
      const next = [...prev, item];
      save(next);
      return next;
    });
    return item;
  }, []);

  const update = useCallback((id: string, patch: Partial<Reminder>) => {
    setReminders((prev) => {
      const next = prev.map((r) => {
        if (r.id !== id) return r;
        const merged = { ...r, ...patch };
        scheduleNative(merged);
        return merged;
      });
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setReminders((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) cancelNative(target);
      const next = prev.filter((r) => r.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { reminders, add, update, remove };
}