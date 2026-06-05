import { useEffect, useRef, useState, useCallback } from 'react';

const STORAGE_KEY = 'sleepTimerEndsAt';

/** Sleep timer — pauses all <video>/<audio> when expired. Persists across reloads. */
export function useSleepTimer() {
  const [endsAt, setEndsAt] = useState<number | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = Number(raw);
    return Number.isFinite(v) && v > Date.now() ? v : null;
  });
  const [remaining, setRemaining] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // tick
  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const rem = Math.max(0, endsAt - Date.now());
      setRemaining(rem);
      if (rem <= 0) {
        document.querySelectorAll('video, audio').forEach((m) => {
          try { (m as HTMLMediaElement).pause(); } catch {}
        });
        localStorage.removeItem(STORAGE_KEY);
        setEndsAt(null);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    timerRef.current = id;
    return () => window.clearInterval(id);
  }, [endsAt]);

  const start = useCallback((minutes: number) => {
    const end = Date.now() + minutes * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, String(end));
    setEndsAt(end);
  }, []);

  const cancel = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setEndsAt(null);
  }, []);

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