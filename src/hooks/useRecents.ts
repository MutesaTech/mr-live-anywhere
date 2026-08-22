import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

const MAX = 5;

/** A single Recently Watched / Recently Played history entry. */
export interface HistoryRecord {
  id: string;
  /** Epoch ms when the item was actually watched/played. */
  watchedAt: number;
  /** How many times it has been played/watched (frequency signal for recommendations). */
  count: number;
}

type Stored = HistoryRecord[] | string[];

/** Normalize storage, migrating legacy plain-id arrays into full records. */
const normalize = (stored: Stored | null | undefined): HistoryRecord[] => {
  if (!Array.isArray(stored)) return [];
  return stored
    .map((entry): HistoryRecord | null => {
      if (typeof entry === 'string') {
        // Legacy format — a plain id with no timestamp. It was in the recents
        // list, so treat it as recent activity.
        return { id: entry, watchedAt: Date.now(), count: 1 };
      }
      if (entry && typeof entry.id === 'string') {
        return {
          id: entry.id,
          watchedAt: typeof entry.watchedAt === 'number' ? entry.watchedAt : Date.now(),
          count: typeof entry.count === 'number' ? entry.count : 1,
        };
      }
      return null;
    })
    .filter((r): r is HistoryRecord => Boolean(r));
};

/**
 * Tracks recently watched TV channels / played radio stations as history
 * records (most recent first, capped at 5 each, deduplicated, persisted).
 */
export function useRecents() {
  const [recentTvStored, setRecentTv] = useLocalStorage<Stored>('recentTv', []);
  const [recentRadioStored, setRecentRadio] = useLocalStorage<Stored>('recentRadio', []);

  const recentTv = useMemo(() => normalize(recentTvStored), [recentTvStored]);
  const recentRadio = useMemo(() => normalize(recentRadioStored), [recentRadioStored]);

  const addRecentTv = useCallback((id: string) => {
    setRecentTv((prev) => {
      const records = normalize(prev);
      const existing = records.find((r) => r.id === id);
      const next: HistoryRecord = existing
        ? { id, watchedAt: Date.now(), count: existing.count + 1 }
        : { id, watchedAt: Date.now(), count: 1 };
      return [next, ...records.filter((r) => r.id !== id)].slice(0, MAX);
    });
  }, [setRecentTv]);

  const addRecentRadio = useCallback((id: string) => {
    setRecentRadio((prev) => {
      const records = normalize(prev);
      const existing = records.find((r) => r.id === id);
      const next: HistoryRecord = existing
        ? { id, watchedAt: Date.now(), count: existing.count + 1 }
        : { id, watchedAt: Date.now(), count: 1 };
      return [next, ...records.filter((r) => r.id !== id)].slice(0, MAX);
    });
  }, [setRecentRadio]);

  return { recentTv, recentRadio, addRecentTv, addRecentRadio };
}
