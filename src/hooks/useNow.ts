import { useEffect, useState } from 'react';

/**
 * Current epoch ms, refreshed on an interval — used to keep relative
 * timestamps ("Watched 5 min ago") fresh without re-rendering every second.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
