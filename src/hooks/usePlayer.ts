import { createContext, useContext } from 'react';

export interface NowPlaying {
  type: 'tv' | 'radio';
  id: string;
  name: string;
  logo: string;
  category: string;
  language: string;
  number: number;
  stream: string;
}

export interface PlayerContextValue {
  nowPlaying: NowPlaying | null;
  /** Last known playback state — lets the mini player resume in the same state the full player left off in. */
  isPlaying: boolean;
  setNowPlaying: (type: 'tv' | 'radio', id: string) => void;
  setPlaybackActive: (active: boolean) => void;
  clearNowPlaying: () => void;
}

export const PlayerContext = createContext<PlayerContextValue | null>(null);

export const usePlayer = (): PlayerContextValue => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider');
  return ctx;
};
