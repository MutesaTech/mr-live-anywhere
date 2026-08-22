import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, ArrowLeft, ChevronRight, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import LazyImage from './LazyImage';
import { usePlayer } from '@/hooks/usePlayer';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getCategoryTheme, sortCategoryKeys } from '@/lib/categoryThemes';

interface Radio {
  id: string;
  name: string;
  logo: string;
  stream: string;
  category: string;
  language: string;
  frequency?: string;
}

interface RadioPlayerProps {
  radios: Radio[];
  lastPlayed: string | null;
  onPlay: (id: string) => void;
}

/** Friendly pill labels — derived from the categories actually present in the catalog. */
const CATEGORY_LABELS: Record<string, string> = {
  news: 'News & Talk',
  music: 'Music',
  sport: 'Sports',
  entertainment: 'Entertainment',
};

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Deterministic FM frequency derived from the station id (visual only). */
const getFrequency = (radio: Radio | null): string => {
  if (!radio) return '94.3';
  if (radio.frequency) return radio.frequency;
  const seed = Array.from(radio.id).reduce((a, c) => a + c.charCodeAt(0), 0);
  const freq = 87.5 + (seed % 220) / 10; // 87.5 - 109.5
  return freq.toFixed(1);
};

/**
 * Animated equalizer — bars pulse while playing, stay still otherwise.
 * Pausable via animation-play-state so it never runs when idle.
 */
const Equalizer = ({
  playing,
  bars = 21,
  className,
}: {
  playing: boolean;
  bars?: number;
  className?: string;
}) => (
  <div className={cn('flex items-end justify-center gap-[3px]', className)} aria-hidden>
    {Array.from({ length: bars }).map((_, i) => (
      <span
        key={i}
        className="wave-bar w-[3px] rounded-full bg-primary"
        style={{
          height: `${6 + ((i * 13) % 22)}px`,
          animationDelay: `${(i * 90) % 900}ms`,
          animationPlayState: playing ? 'running' : 'paused',
          opacity: playing ? 1 : 0.3,
        }}
      />
    ))}
  </div>
);

interface StationCardProps {
  radio: Radio;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
}

/** Vertical list tile — logo, station info, play/pause action. */
const StationCard = ({ radio, isActive, isPlaying, onPlay }: StationCardProps) => {
  const freq = getFrequency(radio);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target as HTMLElement).closest('button')) {
      e.preventDefault();
      onPlay();
    }
  };

  return (
    <div
      onClick={onPlay}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${radio.name}, play radio`}
      aria-pressed={isActive && isPlaying}
      className={cn(
        'group flex w-full min-h-[54px] items-center justify-between gap-3 p-2 rounded-xl cursor-pointer border transition-all duration-200',
        isActive
          ? 'bg-primary/[0.06] border-primary shadow-[0_0_10px_hsl(var(--primary)/0.12)]'
          : 'bg-card border-border hover:bg-muted/60 hover:border-muted-foreground/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
    >
      {/* Station logo */}
      <div className="relative shrink-0">
        <LazyImage
          src={radio.logo}
          alt={radio.name}
          className={cn(
            'h-9 w-9 rounded-lg bg-muted border border-border object-cover transition-transform duration-300',
            'motion-safe:group-hover:scale-105'
          )}
        />
        {isActive && isPlaying && (
          <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-dot" />
          </span>
        )}
      </div>

      {/* Station info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-xs text-foreground truncate">{radio.name}</h3>
          {isActive && isPlaying && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
              <span className="h-1 w-1 rounded-full bg-white animate-pulse-dot" />
              Live
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          <span className="tabular-nums">{freq} FM</span>
          <span className="mx-1.5 text-muted-foreground/60">•</span>
          {capitalize(radio.language)}
        </p>
      </div>

      {/* Play / Pause action */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        aria-label={isPlaying ? `Pause ${radio.name}` : `Play ${radio.name}`}
        className={cn(
          'h-8 w-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-200',
          'bg-primary hover:bg-primary-dark text-primary-foreground',
          'shadow-[0_0_12px_hsl(var(--primary)/0.25)]',
          'active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </button>
    </div>
  );
};

interface RowStationCardProps {
  radio: Radio;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
}

/** Compact horizontal-row card — logo, name, frequency. */
const RowStationCard = ({ radio, isActive, isPlaying, onPlay }: RowStationCardProps) => (
  <button
    type="button"
    onClick={onPlay}
    aria-label={`Play ${radio.name}`}
    aria-pressed={isActive && isPlaying}
    className={cn(
      'group w-24 sm:w-28 flex-shrink-0 snap-start rounded-xl border bg-card p-2 text-center transition-all duration-200',
      isActive
        ? 'border-primary shadow-[0_0_14px_hsl(var(--primary)/0.15)]'
        : 'border-border hover:bg-muted/60 hover:border-muted-foreground/40',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
    )}
  >
    <div className="relative mx-auto w-fit">
      <LazyImage
        src={radio.logo}
        alt={radio.name}
        className="h-10 w-10 rounded-lg bg-muted border border-border object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
      />
      {isActive && isPlaying && (
        <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary flex items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-dot" />
        </span>
      )}
    </div>
    <h3 className="mt-1.5 truncate text-[11px] font-semibold text-foreground">{radio.name}</h3>
    <p className="mt-0.5 text-[9px] tabular-nums text-muted-foreground">{getFrequency(radio)} FM</p>
  </button>
);

const RadioPlayer = ({ radios, lastPlayed, onPlay }: RadioPlayerProps) => {
  const [activeRadio, setActiveRadio] = useState<string | null>(lastPlayed);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState(false);

  const { isOnline } = useNetworkStatus();

  // Clear the offline notice automatically once connectivity returns.
  useEffect(() => {
    if (isOnline) setOfflineNotice(false);
  }, [isOnline]);

  const audioRef = useRef<HTMLAudioElement>(null);

  const activeRadioData = useMemo(
    () => radios.find((r) => r.id === activeRadio) || null,
    [radios, activeRadio]
  );

  // Stations grouped by category — data-driven, normalized, professionally ordered.
  const categoryGroups = useMemo(() => {
    const map = new Map<string, Radio[]>();
    radios.forEach((r) => {
      const key = (r.category || '').trim().toLowerCase();
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return sortCategoryKeys([...map.keys()]).map((key) => ({
      category: key,
      label: CATEGORY_LABELS[key] ?? getCategoryTheme(key).label,
      items: map.get(key)!,
    }));
  }, [radios]);

  const expandedGroup = useMemo(
    () => categoryGroups.find((g) => g.category === expandedCategory) ?? null,
    [categoryGroups, expandedCategory]
  );

  const { setNowPlaying, setPlaybackActive } = usePlayer();

  // Report real playback to the global player so the mini player can continue
  // it when the user leaves the radio section.
  useEffect(() => {
    if (activeRadioData && isPlaying) {
      setNowPlaying('radio', activeRadioData.id);
      setPlaybackActive(true);
    } else if (!isPlaying) {
      setPlaybackActive(false);
    }
  }, [activeRadioData, isPlaying, setNowPlaying, setPlaybackActive]);

  const handlePlayRadio = useCallback(
    async (id: string) => {
      const radio = radios.find((r) => r.id === id);
      if (!radio || !audioRef.current) return;
      // Live radio needs the internet — never fake playback while offline.
      if (!isOnline) {
        setOfflineNotice(true);
        setIsPlaying(false);
        return;
      }
      if (activeRadio === id && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }
      const isNewStation = activeRadio !== id;
      if (isNewStation) {
        audioRef.current.src = radio.stream;
        audioRef.current.load();
        setActiveRadio(id);
      }
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        // Only track a station once playback has actually started.
        if (isNewStation) onPlay(id);
      } catch (e) {
        console.error('Radio playback failed', e);
        setIsPlaying(false);
        // Stream failures while offline are a connectivity problem, not a
        // station problem — show the offline notice instead of a dead player.
        if (!isOnline) setOfflineNotice(true);
      }
    },
    [radios, activeRadio, isPlaying, isOnline, onPlay]
  );

  // Previous / Next — move through the catalog (wraps around) and start playing.
  const handleStep = useCallback(
    (dir: 1 | -1) => {
      if (radios.length === 0) return;
      const idx = radios.findIndex((r) => r.id === activeRadio);
      const next = idx === -1 ? 0 : (idx + dir + radios.length) % radios.length;
      handlePlayRadio(radios[next].id);
    },
    [radios, activeRadio, handlePlayRadio]
  );

  // MediaSession metadata for lockscreen / notification controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !activeRadioData) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeRadioData.name,
        artist: activeRadioData.category,
        album: 'Beemo Radio',
        artwork: [{ src: activeRadioData.logo, sizes: '512x512', type: 'image/png' }],
      });
      navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play().catch(() => {}));
      navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    } catch {
      // MediaSession is optional — ignore platforms that don't support it.
    }
  }, [activeRadioData]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col select-none animate-page-enter">
      <audio ref={audioRef} />

      {/* ===== 1. FIXED circular radio player — pinned, never scrolls away ===== */}
      <div className="shrink-0 pt-5 pb-4">
        <div className="flex flex-col items-center text-center">
          {/* Circular frequency display */}
          <div
            className={cn(
              'relative flex h-32 w-32 sm:h-40 sm:w-40 items-center justify-center rounded-full border transition-all duration-300',
              isPlaying ? 'border-primary/60' : 'border-border/70'
            )}
            style={{
              boxShadow: isPlaying
                ? '0 0 0 5px hsl(var(--primary) / 0.10), 0 0 32px hsl(var(--primary) / 0.30)'
                : 'inset 0 0 26px hsl(var(--primary) / 0.05)',
            }}
          >
            {/* inner ring */}
            <div className="absolute inset-[5px] rounded-full border border-border/50" />
            <div className="relative text-center">
              <p className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight text-foreground">
                {getFrequency(activeRadioData)}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                FM
              </p>
            </div>
          </div>

          {/* Animated equalizer — below the frequency */}
          <Equalizer playing={isPlaying} className="mt-4 h-6 w-24" />

          {/* Station name */}
          <h2 className="mt-3 max-w-full px-4 text-lg sm:text-xl font-bold tracking-tight text-foreground line-clamp-1">
            {activeRadioData ? activeRadioData.name.toUpperCase() : 'SELECT A STATION'}
          </h2>
          {activeRadioData && (
            <p className="mt-0.5 max-w-full px-4 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground line-clamp-1">
              {CATEGORY_LABELS[activeRadioData.category] ?? capitalize(activeRadioData.category)}
            </p>
          )}

          {/* Offline notice — shown when a live listen is attempted without a connection */}
          {offlineNotice && (
            <p className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground animate-fade-in">
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
              You're offline. Connect to the internet to listen live.
            </p>
          )}

          {/* Previous | Play/Pause | Next */}
          <div className="mt-5 flex items-center gap-7 sm:gap-9">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              aria-label="Previous station"
              title="Previous station"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/70 text-foreground/80 border border-border/70 transition-all hover:bg-muted hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() =>
                activeRadioData
                  ? handlePlayRadio(activeRadioData.id)
                  : radios[0] && handlePlayRadio(radios[0].id)
              }
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title={isPlaying ? 'Pause' : 'Play'}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_22px_hsl(var(--primary)/0.35)] transition-all hover:bg-primary-dark active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleStep(1)}
              aria-label="Next station"
              title="Next station"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/70 text-foreground/80 border border-border/70 transition-all hover:bg-muted hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== 2. SCROLLABLE content — category rows, or an isolated category ===== */}
      <div className="flex-1 min-h-0 overflow-y-auto border-t border-border/60 pt-4 pb-8">
        {expandedCategory && expandedGroup ? (
          /* Isolated category view — ALL stations in this category, vertical list */
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2.5 px-1">
              <button
                type="button"
                onClick={() => setExpandedCategory(null)}
                aria-label="Back to all categories"
                title="Back to all categories"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted border border-border/70 text-muted-foreground hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                {expandedGroup.label}
              </h2>
              <span className="shrink-0 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
                {expandedGroup.items.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {expandedGroup.items.map((radio) => (
                <StationCard
                  key={radio.id}
                  radio={radio}
                  isActive={activeRadio === radio.id}
                  isPlaying={activeRadio === radio.id && isPlaying}
                  onPlay={() => handlePlayRadio(radio.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Category rows — each category shows ONLY its own stations */
          <div className="space-y-8">
            {categoryGroups.map((group) => (
              <section key={group.category}>
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight">{group.label}</h2>
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(group.category)}
                    className="group/see inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded"
                  >
                    See More
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/see:translate-x-0.5" />
                  </button>
                </div>

                <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2 -mx-1 px-1">
                  {group.items.map((radio) => (
                    <RowStationCard
                      key={radio.id}
                      radio={radio}
                      isActive={activeRadio === radio.id}
                      isPlaying={activeRadio === radio.id && isPlaying}
                      onPlay={() => handlePlayRadio(radio.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RadioPlayer;
