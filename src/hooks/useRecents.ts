import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

const MAX = 10;

/** Tracks recently watched TV channels / recently played radio stations (ids, most recent first). */
export function useRecents() {
  const [recentTvIds, setRecentTvIds] = useLocalStorage<string[]>('recentTv', []);
  const [recentRadioIds, setRecentRadioIds] = useLocalStorage<string[]>('recentRadio', []);

  const addRecentTv = useCallback((id: string) => {
    setRecentTvIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, MAX));
  }, [setRecentTvIds]);

  const addRecentRadio = useCallback((id: string) => {
    setRecentRadioIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, MAX));
  }, [setRecentRadioIds]);

  return { recentTvIds, recentRadioIds, addRecentTv, addRecentRadio };
}
