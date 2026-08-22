import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { allChannels } from '@/lib/channelCatalog';
import radiosData from '@/data/radios.json';
import { getTvChannelNumber, getRadioChannelNumber } from '@/lib/channelNumbers';
import { getChannelName, isChannelHidden } from '@/lib/channelOverrides';
import { PlayerContext, type NowPlaying } from '@/hooks/usePlayer';
import MiniPlayer from './MiniPlayer';

interface RadioEntry {
  id: string;
  name: string;
  logo: string;
  stream: string;
  category: string;
  language: string;
}

interface PlayerProviderProps {
  children: ReactNode;
  /** Active app section, used to decide when the mini player should appear. */
  activeSection: string;
  /** Navigate to the full player for a channel. */
  onExpand: (type: 'tv' | 'radio', id: string) => void;
}

/**
 * Single source of truth for "what is currently playing". Full players report
 * activity here, and the floating MiniPlayer keeps playback going while the
 * user browses other sections — using the same stream engine as the full
 * players, never a second media system.
 */
export const PlayerProvider = ({ children, activeSection, onExpand }: PlayerProviderProps) => {
  const [nowPlaying, setNowPlayingState] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const setNowPlaying = useCallback((type: 'tv' | 'radio', id: string) => {
    if (type === 'tv') {
      const ch = allChannels.find((c) => c.id === id);
      if (!ch || isChannelHidden(id)) return;
      setNowPlayingState({
        type,
        id: ch.id,
        name: getChannelName(ch.id, ch.name),
        logo: ch.logo,
        category: ch.category,
        language: ch.language,
        number: getTvChannelNumber(ch.id),
        stream: ch.stream,
      });
    } else {
      const r = (radiosData as RadioEntry[]).find((x) => x.id === id);
      if (!r) return;
      setNowPlayingState({
        type,
        id: r.id,
        name: r.name,
        logo: r.logo,
        category: r.category,
        language: r.language,
        number: getRadioChannelNumber(r.id),
        stream: r.stream,
      });
    }
  }, []);

  const setPlaybackActive = useCallback((active: boolean) => setIsPlaying(active), []);
  const clearNowPlaying = useCallback(() => setNowPlayingState(null), []);

  // Entering a TV section while radio is playing closes the radio automatically —
  // TV browsing takes over the screen, so background radio would be noise.
  // Clearing nowPlaying unmounts the mini player, which stops its audio.
  useEffect(() => {
    if (
      nowPlaying?.type === 'radio' &&
      (activeSection === 'tv' || activeSection === 'category' || activeSection === 'categories')
    ) {
      setNowPlayingState(null);
      setIsPlaying(false);
    }
  }, [activeSection, nowPlaying]);

  // Show the mini player whenever playback is active but the user is not in
  // the matching full-player section (TV/category for TV, radio for radio).
  const isMiniVisible = useMemo(() => {
    if (!nowPlaying) return false;
    if (nowPlaying.type === 'tv') return activeSection !== 'tv' && activeSection !== 'category';
    return activeSection !== 'radio';
  }, [nowPlaying, activeSection]);

  const value = useMemo(
    () => ({ nowPlaying, isPlaying, setNowPlaying, setPlaybackActive, clearNowPlaying }),
    [nowPlaying, isPlaying, setNowPlaying, setPlaybackActive, clearNowPlaying]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {isMiniVisible && nowPlaying && (
        <MiniPlayer onExpand={() => onExpand(nowPlaying.type, nowPlaying.id)} />
      )}
    </PlayerContext.Provider>
  );
};
