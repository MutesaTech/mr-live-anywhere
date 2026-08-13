import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'sleepTimerEndsAt';

/* ---- shared store so every mounted consumer sees the same timer ---- */
const listeners = new Set<() => void>();

function readStored(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = Number(raw);
    return Number.isFinite(v) && v > Date.now() ? v : null;
  } catch {
    return null;
  }
}

let endsAtStore: number | null = readStored();

function emit() {
  listeners.forEach((l) => l());
}

function setEndsAt(value: number | null) {
  endsAtStore = value;
  try {
    if (value) localStorage.setItem(STORAGE_KEY, String(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      endsAtStore = readStored();
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

const getSnapshot = () => endsAtStore;

function pauseAllMedia() {
  document.querySelectorAll('video, audio').forEach((m) => {
    try {
      (m as HTMLMediaElement).pause();
    } catch {}
  });
}

/** Sleep timer — pauses all <video>/<audio> when it expires. Persists across reloads and screens. */
export function useSleepTimer() {
  const endsAt = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [remaining, setRemaining] = useState<number>(endsAt ? Math.max(0, endsAt - Date.now()) : 0);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const rem = Math.max(0, endsAt - Date.now());
      setRemaining(rem);
      if (rem <= 0) {
        pauseAllMedia();
        // keep pausing briefly in case a stream auto-resumes on buffer
        window.setTimeout(pauseAllMedia, 500);
        window.setTimeout(pauseAllMedia, 1500);
        setEndsAt(null);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    const onVisible = () => tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [endsAt]);

  const start = useCallback((minutes: number) => {
    if (!minutes || minutes <= 0) return;
    setEndsAt(Date.now() + minutes * 60 * 1000);
  }, []);

  const cancel = useCallback(() => setEndsAt(null), []);

  return { endsAt, remaining, start, cancel, isActive: !!endsAt };
}

export function formatRemaining(ms: number) {
  if (ms <= 0) return '0:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
