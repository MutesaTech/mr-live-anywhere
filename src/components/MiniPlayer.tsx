import { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Pause, PictureInPicture2, Play, X } from 'lucide-react';
import { Button } from './ui/button';
import LazyImage from './LazyImage';
import { useStreamPlayer } from '@/hooks/useStreamPlayer';
import { usePlayer } from '@/hooks/usePlayer';
import { cn } from '@/lib/utils';

interface MiniPlayerProps {
  onExpand: () => void;
}

/**
 * Persistent floating player. When the user leaves the full player, playback
 * resumes here in the same state (channel, stream, play/pause) using the same
 * stream engine as the full players.
 *
 * TV streams render as a floating Picture-in-Picture video window (16:9, the
 * live video visible with a subtle hover control overlay). Radio keeps a
 * horizontal audio bar.
 */
const MiniPlayer = ({ onExpand }: MiniPlayerProps) => {
  const { nowPlaying, isPlaying, setPlaybackActive, clearNowPlaying } = usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  // Capture the playback state at the moment the mini player appears.
  const [initialAutoPlay] = useState(isPlaying);
  const [isMiniPlaying, setIsMiniPlaying] = useState(false);

  const tvChannel = useMemo(
    () =>
      nowPlaying?.type === 'tv'
        ? {
            id: nowPlaying.id,
            name: nowPlaying.name,
            logo: nowPlaying.logo,
            stream: nowPlaying.stream,
            category: nowPlaying.category,
            language: nowPlaying.language,
          }
        : null,
    [nowPlaying]
  );
  const { videoRef, isLoading, unavailable, retry } = useStreamPlayer(tvChannel, {
    autoPlay: initialAutoPlay,
  });

  const pipSupported =
    typeof document !== 'undefined' && document.pictureInPictureEnabled === true;

  // Track TV mini playback state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => {
      setIsMiniPlaying(true);
      setPlaybackActive(true);
    };
    const onPause = () => {
      setIsMiniPlaying(false);
      setPlaybackActive(false);
    };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [videoRef, tvChannel, setPlaybackActive]);

  // Track radio mini playback state
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => {
      setIsMiniPlaying(true);
      setPlaybackActive(true);
    };
    const onPause = () => {
      setIsMiniPlaying(false);
      setPlaybackActive(false);
    };
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
    };
  }, [nowPlaying, setPlaybackActive]);

  const togglePlayPause = () => {
    if (nowPlaying?.type === 'tv') {
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    } else {
      const a = audioRef.current;
      if (!a) return;
      if (a.paused) a.play().catch(() => {});
      else a.pause();
    }
  };

  const handlePip = async () => {
    try {
      const v = videoRef.current;
      if (!v) return;
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        const withPip = v as HTMLVideoElement & {
          requestPictureInPicture?: () => Promise<unknown>;
        };
        if (withPip.requestPictureInPicture) {
          await withPip.requestPictureInPicture();
        }
      }
    } catch (err) {
      console.warn('PiP failed', err);
    }
  };

  if (!nowPlaying) return null;

  const isTv = nowPlaying.type === 'tv';

  // ===== TV — floating Picture-in-Picture video window =====
  if (isTv) {
    return (
      <div
        role="region"
        aria-label={`Mini player — ${nowPlaying.name}`}
        className="group fixed z-50 bottom-20 right-4 w-56 sm:w-64 max-w-[calc(100vw-2rem)] aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-950 animate-mini-enter"
      >
        {/* Live video fills the window — same stream engine, no second media system */}
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          playsInline
          onClick={togglePlayPause}
          aria-label={nowPlaying.name}
        />

        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-black/60" aria-hidden />
        )}

        {unavailable && (
          <div className="absolute inset-0 grid place-items-center bg-black/85">
            <button
              onClick={(e) => {
                e.stopPropagation();
                retry();
              }}
              className="text-[10px] font-bold text-accent underline"
              aria-label="Retry stream"
            >
              Retry
            </button>
          </div>
        )}

        {/* Hover overlay — always visible on touch, revealed on hover on desktop */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 p-2 flex flex-col justify-between',
            'bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40',
            'transition-opacity duration-200',
            'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'
          )}
        >
          {/* Top bar: LIVE + channel name (left), Close + Expand (right) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-destructive/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                <span className="h-1 w-1 rounded-full bg-white animate-pulse-dot" />
                Live
              </span>
              <span className="text-xs text-white font-medium truncate">{nowPlaying.name}</span>
            </div>
            <div
              className="pointer-events-auto flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onExpand}
                aria-label={`Open full player for ${nowPlaying.name}`}
                title="Expand"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-md hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={clearNowPlaying}
                aria-label="Close player"
                title="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-md hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom: micro play/pause + native PiP toggle */}
          <div
            className="pointer-events-auto flex items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={togglePlayPause}
              aria-label={isMiniPlaying ? 'Pause' : 'Play'}
              title={isMiniPlaying ? 'Pause' : 'Play'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-md hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {isMiniPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>
            {pipSupported && (
              <button
                type="button"
                onClick={handlePip}
                aria-label="Picture in picture"
                title="Picture in picture"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-md hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <PictureInPicture2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== Radio — sleek horizontal audio bar =====
  return (
    <div
      className="fixed z-40 inset-x-3 bottom-20 sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[380px] animate-mini-enter"
      role="region"
      aria-label={`Mini player — ${nowPlaying.name}`}
    >
      <div
        onClick={onExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExpand();
          }
        }}
        aria-label={`Open full player for ${nowPlaying.name}`}
        className="flex items-center gap-3 p-3 rounded-2xl glass-strong border border-border/60 shadow-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Thumbnail / live preview */}
        <div className="relative h-12 w-16 sm:h-14 sm:w-20 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
          <LazyImage src={nowPlaying.logo} alt="" className="h-full w-full" />
          {isLoading && (
            <div className="absolute inset-0 animate-pulse bg-black/60" aria-hidden />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm line-clamp-1">{nowPlaying.name}</h4>
          <p className="text-[11px] text-muted-foreground capitalize line-clamp-1 mt-0.5">
            {nowPlaying.category} • Radio
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={togglePlayPause}
            aria-label={isMiniPlaying ? 'Pause' : 'Play'}
          >
            {isMiniPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={clearNowPlaying}
            aria-label="Close player"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Radio audio element — only for radio playback */}
      <audio ref={audioRef} src={nowPlaying.stream} autoPlay={initialAutoPlay} />
    </div>
  );
};

export default MiniPlayer;
