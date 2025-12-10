import { useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface AutoResumeState {
  channelId: string | null;
  type: 'tv' | 'radio';
  timestamp: number;
}

export const useAutoResume = () => {
  const [resumeState, setResumeState] = useLocalStorage<AutoResumeState | null>('autoResume', null);

  const saveResumeState = useCallback((channelId: string, type: 'tv' | 'radio') => {
    setResumeState({
      channelId,
      type,
      timestamp: Date.now(),
    });
  }, [setResumeState]);

  const clearResumeState = useCallback(() => {
    setResumeState(null);
  }, [setResumeState]);

  const getResumeState = useCallback(() => {
    if (!resumeState) return null;
    
    // Only resume if within 24 hours
    const oneDay = 24 * 60 * 60 * 1000;
    if (Date.now() - resumeState.timestamp > oneDay) {
      clearResumeState();
      return null;
    }
    
    return resumeState;
  }, [resumeState, clearResumeState]);

  return {
    saveResumeState,
    clearResumeState,
    getResumeState,
    resumeState,
  };
};
