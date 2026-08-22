import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { X, Loader2, Minimize2, PictureInPicture2, Play, Pause, Volume2, VolumeX, Maximize2, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import { Button } from './ui/button';
import CompactChannelCard from './CompactChannelCard';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import SearchBar from './SearchBar';
import StreamErrorHandler from './StreamErrorHandler';
import SponsoredBanner from './SponsoredBanner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { clampViewers, randomViewers } from '@/lib/media';
import { useStreamPlayer } from '@/hooks/useStreamPlayer';
import { usePlayer } from '@/hooks/usePlayer';
import { getCategoryTheme, sortCategoryKeys } from '@/lib/categoryThemes';
import { useToast } from '@/hooks/use-toast';
import { clearBrokenStreams } from '@/lib/brokenStreams';
interface Channel {
  id: string;
  name: string;
  logo: string;
  stream: string;
  streams?: { url: string; quality?: string; label?: string | null; requiresHeaders?: boolean }[];
  category: string;
  language: string;
  country?: string;
  source?: string;
}
/** A channel from an external IPTV playlist, played through the existing player. */
interface ExternalStream {
  id: string;
  name: string;
  logo: string;
  stream: string;
  category: string;
  language: string;
}

interface TvPlayerProps {
  channels: Channel[];
  lastWatched: string | null;
  onPlay: (id: string) => void;
  externalChannel?: string | null;
  /** A channel from an imported IPTV playlist to play in the existing player. */
  externalStream?: ExternalStream | null;
  /** Called when the player is closed while an external stream is active. */
  onCloseExternal?: () => void;
  /** Open the directory directly in a specific category's isolated (See All) view. */
  initialExpandedCategory?: string | null;
}
const TvPlayer = ({
  channels,
  lastWatched,
  onPlay,
  externalChannel,
  externalStream,
  onCloseExternal,
  initialExpandedCategory
}: TvPlayerProps) => {
  const [activeChannel, setActiveChannel] = useState<string | null>(lastWatched);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
  // When set, the directory isolates to only this category's channels.
  // Arriving from a category link (e.g. Home → category) opens straight into it.
  const [expandedCategory, setExpandedCategory] = useState<string | null>(initialExpandedCategory ?? null);
  // Custom playback controls state
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimerRef = useRef<number | null>(null);
  const videoBoxRef = useRef<HTMLDivElement>(null);
  const pipSupported = typeof document !== 'undefined' && document.pictureInPictureEnabled === true;
  const playerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const volumeTimerRef = useRef<number | null>(null);
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();

  const isExternalActive = Boolean(externalStream && activeChannel === externalStream.id);
  const activeChannelData = useMemo(() => {
    if (externalStream && activeChannel === externalStream.id) return externalStream;
    return channels.find(c => c.id === activeChannel) ?? null;
  }, [channels, activeChannel, externalStream]);
  const { videoRef, isLoading, streamError, unavailable, retry } = useStreamPlayer(activeChannelData ?? null);
  const { setNowPlaying, setPlaybackActive, clearNowPlaying } = usePlayer();

  // Swipe gestures for channel switching
  useSwipeGesture(playerRef, {
    onSwipeLeft: () => handleNextChannel(),
    onSwipeRight: () => handlePreviousChannel()
  });

  // Get unique categories — data-driven, normalized (trim/lowercase), professionally ordered.
  const categories = useMemo(() => {
    const keys = Array.from(new Set(channels.map((c) => (c.category || '').trim().toLowerCase()).filter(Boolean)));
    return ['all', ...sortCategoryKeys(keys)];
  }, [channels]);

  // Filter channels — search only, so the directory ALWAYS lists every channel
  // (grouped per category row below). Category selection happens via the
  // toolbar dropdown, which isolates a single category instead of silently
  // hiding the rest of the directory.
  const filteredChannels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return channels.filter(channel => {
      const name = (channel.name || '').toLowerCase();
      const chCat = (channel.category || '').trim().toLowerCase();
      return name.includes(q) || chCat.includes(q);
    });
  }, [channels, searchQuery]);

  // Get current channel index
  const currentChannelIndex = useMemo(() => {
    return channels.findIndex(c => c.id === activeChannel);
  }, [channels, activeChannel]);

  // Group filtered channels into explicit category rows — normalized keys so
  // "News"/"news"/"NEWS" can never split into duplicate sections, ordered
  // professionally with unknown categories appended.
  const channelsByCategory = useMemo(() => {
    const groups: { category: string; items: Channel[] }[] = [];
    filteredChannels.forEach(channel => {
      const key = (channel.category || 'entertainment').trim().toLowerCase();
      const group = groups.find(g => g.category === key);
      if (group) group.items.push(channel);
      else groups.push({ category: key, items: [channel] });
    });
    const rank = new Map(sortCategoryKeys(groups.map((g) => g.category)).map((k, i) => [k, i]));
    return groups.sort((a, b) => (rank.get(a.category) ?? 0) - (rank.get(b.category) ?? 0));
  }, [filteredChannels]);

  // Handle external channel selection
  useEffect(() => {
    if (externalChannel && externalChannel !== activeChannel) {
      handlePlayChannel(externalChannel);
    }
  }, [externalChannel]);

  // Play a channel coming from an imported IPTV playlist (through this same player).
  // `activeChannel` is intentionally excluded — the effect must only react to a
  // NEW external stream, not to the user switching channels afterwards.
  useEffect(() => {
    if (externalStream && externalStream.id !== activeChannel) {
      setActiveChannel(externalStream.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalStream]);
  // Sync initialExpandedCategory prop changes (e.g. navigating between category links)
  useEffect(() => {
    if (initialExpandedCategory) setExpandedCategory(initialExpandedCategory);
  }, [initialExpandedCategory]);

  useEffect(() => {
    const counts: Record<string, number> = {};
    channels.forEach(channel => {
      // Audience is always within 100K – 100M
      counts[channel.id] = randomViewers();
    });
    setViewerCounts(counts);
    const interval = setInterval(() => {
      setViewerCounts(prev => {
        const updated = {
          ...prev
        };
        channels.forEach(channel => {
          const drift = Math.floor(Math.random() * 4_000) - 1_500;
          updated[channel.id] = clampViewers((prev[channel.id] ?? randomViewers()) + drift);
        });
        return updated;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [channels]);

  const handlePlayChannel = (channelId: string) => {
    // Optimistic, instant switch — no scroll jumping.
    setActiveChannel(channelId);
    setNowPlaying('tv', channelId);
    onPlay(channelId);
  };
  const handleClosePlayer = () => {
    setActiveChannel(null);
    clearNowPlaying();
    if (isExternalActive) onCloseExternal?.();
  };
  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    const el = videoBoxRef.current ?? videoRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  // Keep the fullscreen state in sync so the icon reflects it.
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Auto-hide controls after a short period of inactivity while playing.
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = null;
  }, []);

  const scheduleHide = useCallback(() => {
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = window.setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    if (isPaused) {
      showControls();
      return;
    }
    scheduleHide();
    return () => {
      if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    };
  }, [isPaused, showControls, scheduleHide]);

  const onPlayerInteract = useCallback(() => {
    showControls();
    if (!isPaused) scheduleHide();
  }, [showControls, scheduleHide, isPaused]);

  const controlsShown = isPaused || controlsVisible;
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };
  // Sync video element with volume/mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted = isMuted || volume === 0;
    }
  }, [volume, isMuted, videoRef]);
  // Track play/pause from video element
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => {
      setIsPaused(false);
      setPlaybackActive(true);
    };
    const onPause = () => {
      setIsPaused(true);
      setPlaybackActive(false);
    };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [activeChannel, videoRef, setPlaybackActive]);
  const handlePip = async () => {
    try {
      if (!videoRef.current) return;
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if ((videoRef.current as any).requestPictureInPicture) {
        await (videoRef.current as any).requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP failed', err);
    }
  };
  const handleNextChannel = useCallback(() => {
    if (isExternalActive) return;
    if (currentChannelIndex < channels.length - 1) {
      handlePlayChannel(channels[currentChannelIndex + 1].id);
    } else {
      handlePlayChannel(channels[0].id);
    }
  }, [currentChannelIndex, channels, isExternalActive]);
  const handlePreviousChannel = useCallback(() => {
    if (isExternalActive) return;
    if (currentChannelIndex > 0) {
      handlePlayChannel(channels[currentChannelIndex - 1].id);
    } else {
      handlePlayChannel(channels[channels.length - 1].id);
    }
  }, [currentChannelIndex, channels, isExternalActive]);
  const handleRetryStream = retry;
  // Refresh — clears the broken-stream cache and re-attaches the active stream
  // so previously-failed feeds get a fresh attempt.
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = () => {
    clearBrokenStreams();
    if (activeChannelData) retry();
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 700);
    toast({
      title: 'Refreshed',
      description: activeChannelData ? `Restarting ${activeChannelData.name}` : 'Channel list refreshed',
    });
  };

  // Auto-collapse volume after 3s inactivity
  useEffect(() => {
    if (!showVolume) return;
    if (volumeTimerRef.current) window.clearTimeout(volumeTimerRef.current);
    volumeTimerRef.current = window.setTimeout(() => setShowVolume(false), 3000);
    return () => { if (volumeTimerRef.current) window.clearTimeout(volumeTimerRef.current); };
  }, [showVolume, volume, isMuted]);

  // MediaSession metadata for lockscreen / notification controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !activeChannelData) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeChannelData.name,
        artist: activeChannelData.category,
        album: 'Beemo',
        artwork: [{ src: activeChannelData.logo, sizes: '512x512', type: 'image/png' }],
      });
      navigator.mediaSession.setActionHandler('play', () => videoRef.current?.play().catch(() => {}));
      navigator.mediaSession.setActionHandler('pause', () => videoRef.current?.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNextChannel());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePreviousChannel());
    } catch {}
  }, [activeChannelData, handleNextChannel, handlePreviousChannel, videoRef]);


  return <div ref={containerRef} className="flex h-[calc(100dvh-4rem)] flex-col animate-page-enter">
      {/* FIXED PLAYER — pinned at the top, never scrolls away with the channel list */}
      {activeChannel && activeChannelData && (
        <div ref={playerRef} className="shrink-0">
          {/* Full-bleed player — spans the full screen width, flush to the edges, no card treatment */}
          <div className="group relative w-screen left-1/2 -translate-x-1/2 overflow-hidden bg-black">
            {/* Video Container — video is the dominant element */}
            <div
              ref={videoBoxRef}
              onMouseMove={onPlayerInteract}
              onTouchStart={onPlayerInteract}
              onMouseLeave={() => { if (!isPaused) scheduleHide(); }}
              className={cn('relative bg-black', isFullscreen ? 'h-full w-full' : 'aspect-video')}
            >
              <video
                ref={videoRef}
                className="h-full w-full object-contain"
                playsInline
                autoPlay
                onClick={togglePlayPause}
              />

              {/* Minimal loading state */}
              {isLoading && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-black/40">
                  <Loader2 className="h-9 w-9 animate-spin text-white/70" />
                </div>
              )}

              {/* Error state */}
              <StreamErrorHandler error={unavailable ? streamError : null} isOffline={!isOnline} channelName={activeChannelData.name} onRetry={handleRetryStream} onSwitchToNext={handleNextChannel} />

              {/* Minimal bottom controls — auto-hide after inactivity */}
              <div className={cn(
                "absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 pointer-events-none",
                "px-4 pb-3 pt-10 bg-gradient-to-t from-black/70 via-black/25 to-transparent",
                "transition-opacity duration-300",
                controlsShown ? 'opacity-100' : 'opacity-0'
              )}>
                {/* Channel name + LIVE indicator — fades out together with the controls */}
                <div className="pointer-events-auto flex flex-col gap-1.5">
                  <span className="text-sm sm:text-base font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] line-clamp-1 max-w-[55vw] sm:max-w-[40vw]">
                    {activeChannelData.name}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90" aria-hidden>
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse-dot" />
                    LIVE
                  </span>
                </div>

                {/* Controls */}
                <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-9 sm:w-9 rounded-full text-white/90 hover:bg-white/15 hover:text-white"
                    onClick={togglePlayPause}
                    title={isPaused ? 'Play' : 'Pause'}
                    aria-label={isPaused ? 'Play' : 'Pause'}
                  >
                    {isPaused ? <Play className="h-5 w-5 ml-0.5" /> : <Pause className="h-5 w-5" />}
                  </Button>

                  {/* Volume (collapsible, compact on small screens) */}
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-9 sm:w-9 rounded-full text-white/90 hover:bg-white/15 hover:text-white"
                      onClick={() => setShowVolume(v => !v)}
                      title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                      aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <div
                      className={cn(
                        "overflow-hidden transition-[width,opacity,margin] duration-300 ease-out",
                        showVolume ? "w-20 sm:w-28 opacity-100 ml-1.5" : "w-0 opacity-0 ml-0"
                      )}
                    >
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        onValueChange={(v) => { setVolume(v[0]); setIsMuted(v[0] === 0); }}
                        max={100}
                        step={1}
                        className="w-full cursor-pointer"
                        aria-label="Volume"
                      />
                    </div>
                  </div>

                  {/* Picture-in-picture — only when supported */}
                  {pipSupported && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-9 sm:w-9 rounded-full text-white/90 hover:bg-white/15 hover:text-white"
                      onClick={handlePip}
                      title="Picture in picture"
                      aria-label="Picture in picture"
                    >
                      <PictureInPicture2 className="h-5 w-5" />
                    </Button>
                  )}

                  {/* Fullscreen */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-9 sm:w-9 rounded-full text-white/90 hover:bg-white/15 hover:text-white"
                    onClick={handleFullscreen}
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                  </Button>

                  {/* Close */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-9 sm:w-9 rounded-full text-white/90 hover:bg-white/15 hover:text-white"
                    onClick={handleClosePlayer}
                    title="Close"
                    aria-label="Close player"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PINNED TOOLBAR — back, integrated search + category selector, and refresh stay fixed while the list scrolls */}
      <div className="relative w-screen left-1/2 -translate-x-1/2 shrink-0 z-30 flex items-center gap-2.5 py-3 px-4 bg-card/90 backdrop-blur-xl border-b border-border/60">
        {/* Compact back button when browsing a specific category */}
        {expandedCategory && (
          <button
            type="button"
            onClick={() => setExpandedCategory(null)}
            aria-label="Back to all categories"
            title="Back to all categories"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted border border-border/70 text-muted-foreground hover:text-foreground transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {/* Integrated search + category selector */}
        <SearchBar
          className="flex-1"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search channels..."
          selectOptions={categories.map((c) => ({ value: c, label: c === 'all' ? 'All Categories' : getCategoryTheme(c).label }))}
          selectValue={expandedCategory ?? 'all'}
          onSelectChange={(category) => {
            if (category === 'all') setExpandedCategory(null);
            else setExpandedCategory(category);
          }}
        />

        {/* Refresh — retries the active stream after clearing the broken-stream cache */}
        <button
          type="button"
          onClick={handleRefresh}
          aria-label="Refresh"
          title="Refresh"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 hover:bg-muted border border-border/70 text-muted-foreground hover:text-foreground transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RotateCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
        </button>
      </div>

      {/* SCROLLABLE CHANNEL LIST — the only region that scrolls; the player and controls never move */}
      <div className="flex-1 min-h-0 overflow-y-auto pt-5 pb-8">
        <div className="flex flex-col gap-8">
          {/* Sponsored banner — top of the scrolling content, directly below the player */}
          {activeChannel && activeChannelData && (
            <SponsoredBanner />
          )}

          {/* Channels — categorized rows; "See More" isolates a single category */}
          {expandedCategory ? (
            /* Expanded category: header + vertical list of all its channels (back icon lives in the pinned bar) */
            (() => {
              const group = channelsByCategory.find((g) => g.category === expandedCategory);
              const theme = getCategoryTheme(expandedCategory);
              return (
                <div key={expandedCategory} className="space-y-4 animate-fade-in">
                  {/* Category header — count shown only after the user opens this category */}
                  <div className="mb-3 flex items-center gap-2 px-1">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">{theme.label}</h2>
                    <span className="shrink-0 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
                      {group?.items.length ?? 0}
                    </span>
                  </div>

                  {/* Vertical channel list */}
                  <div className="flex flex-col gap-2.5 w-full">
                    {(group?.items ?? []).map(channel => (
                      <CompactChannelCard
                        key={channel.id}
                        id={channel.id}
                        name={channel.name}
                        logo={channel.logo}
                        language={channel.language}
                        isActive={activeChannel === channel.id}
                        isPlaying={activeChannel === channel.id}
                        isAvailable={Boolean(channel.stream)}
                        viewerCount={viewerCounts[channel.id]}
                        onClick={() => handlePlayChannel(channel.id)}
                        variant="row"
                      />
                    ))}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="space-y-8 animate-fade-in">
              {channelsByCategory.map(group => {
                const theme = getCategoryTheme(group.category);
                // Show every channel in the category — no cap.
                const collapsedItems = group.items;
                return (
                  <section key={group.category} className="border-t border-border/40 pt-6 first:border-t-0 first:pt-0">
                    {/* Section header: category name + See All link */}
                    <div className="mb-3 flex items-center justify-between gap-3 px-1">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight">{theme.label}</h2>
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(group.category)}
                        className="group/see inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded"
                      >
                        See All
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/see:translate-x-0.5" />
                      </button>
                    </div>

                    {/* Horizontal snap scroll row */}
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2 -mx-1 px-1">
                      {collapsedItems.map(channel => (
                        <div key={channel.id} className="w-32 sm:w-40 flex-shrink-0 snap-start">
                          <CompactChannelCard
                            id={channel.id}
                            name={channel.name}
                            logo={channel.logo}
                            language={channel.language}
                            isActive={activeChannel === channel.id}
                            isPlaying={activeChannel === channel.id}
                            isAvailable={Boolean(channel.stream)}
                            viewerCount={viewerCounts[channel.id]}
                            onClick={() => handlePlayChannel(channel.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* Empty state — offline searches report clearly, not as a broken search */}
          {filteredChannels.length === 0 && <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">
                {isOnline ? 'No channels found' : 'No cached results available offline.'}
              </p>
            </div>}
        </div>
      </div>
    </div>;
};
export default TvPlayer;
