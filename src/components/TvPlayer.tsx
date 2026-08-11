import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import { Star, Eye, X, GripHorizontal, PictureInPicture2, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import ChannelCard from './ChannelCard';
import CategoryTabs from './CategoryTabs';
import SearchBar from './SearchBar';
import StreamLoader from './StreamLoader';
import StreamErrorHandler from './StreamErrorHandler';
import SponsoredBanner from './SponsoredBanner';
import HorizontalRail from './HorizontalRail';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { formatViewers, clampViewers, randomViewers } from '@/lib/media';
import { streamCandidates, type Channel as CatalogChannel } from '@/lib/channelCatalog';
import { markStreamBroken, clearBrokenStream } from '@/lib/brokenStreams';
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
interface TvPlayerProps {
  channels: Channel[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  lastWatched: string | null;
  onPlay: (id: string) => void;
  externalChannel?: string | null;
  onMiniPlayerStateChange?: (isVisible: boolean, isExpanded: boolean) => void;
  initialCategory?: string | null;
}
const TvPlayer = ({
  channels,
  favorites,
  onToggleFavorite,
  lastWatched,
  onPlay,
  externalChannel,
  onMiniPlayerStateChange,
  initialCategory
}: TvPlayerProps) => {
  const [activeChannel, setActiveChannel] = useState<string | null>(lastWatched);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'all');
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(true);
  const [stickyPlayer, setStickyPlayer] = useState(false);
  // Custom playback controls state
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  // Floating/draggable mini-player state
  const [floating, setFloating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [inlineHeight, setInlineHeight] = useState(0);
  const dragRef = useRef<{ sx: number; sy: number; bx: number; by: number } | null>(null);
  const inlineSlotRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const playerWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const volumeTimerRef = useRef<number | null>(null);
  // Multi-stream fallback bookkeeping
  const candidatesRef = useRef<string[]>([]);
  const candidateIndexRef = useRef(0);
  const {
    isSlowConnection,
    isOnline
  } = useNetworkStatus();

  // Swipe gestures for channel switching
  useSwipeGesture(playerRef, {
    onSwipeLeft: () => handleNextChannel(),
    onSwipeRight: () => handlePreviousChannel()
  });

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(channels.map(c => c.category))];
    return cats;
  }, [channels]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase()) || channel.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || channel.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [channels, searchQuery, activeCategory]);

  // Get current channel index
  const currentChannelIndex = useMemo(() => {
    return channels.findIndex(c => c.id === activeChannel);
  }, [channels, activeChannel]);

  // Group filtered channels into explicit category rows
  const channelsByCategory = useMemo(() => {
    const groups: { category: string; items: Channel[] }[] = [];
    filteredChannels.forEach(channel => {
      const group = groups.find(g => g.category === channel.category);
      if (group) group.items.push(channel);
      else groups.push({ category: channel.category, items: [channel] });
    });
    return groups;
  }, [filteredChannels]);

  // Handle external channel selection
  useEffect(() => {
    if (externalChannel && externalChannel !== activeChannel) {
      handlePlayChannel(externalChannel, true);
    }
  }, [externalChannel]);
  // Sync initialCategory prop changes
  useEffect(() => {
    if (initialCategory) setActiveCategory(initialCategory);
  }, [initialCategory]);

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

  // Load one stream URL. On fatal failure we mark it broken and try the next feed.
  const loadStreamUrl = useCallback((url: string) => {
    if (!videoRef.current || !url) return;
    setIsLoading(true);
    setStreamError(null);
    setUnavailable(false);

    const failOver = (detail: string) => {
      markStreamBroken(url);
      const next = candidatesRef.current[candidateIndexRef.current + 1];
      if (next) {
        candidateIndexRef.current += 1;
        // Never retry the same dead URL — move straight to the next feed.
        loadStreamUrl(next);
      } else {
        setIsLoading(false);
        setUnavailable(true);
        setStreamError(detail);
      }
    };

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: !isSlowConnection,
        maxBufferLength: isSlowConnection ? 15 : 30,
        maxMaxBufferLength: isSlowConnection ? 30 : 600
      });
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        clearBrokenStream(url);
        videoRef.current?.play().catch(() => {
          console.log('Autoplay prevented');
        });
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          hls.destroy();
          if (hlsRef.current === hls) hlsRef.current = null;
          failOver(data.details);
        }
      });
      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = url;
      videoRef.current.addEventListener('loadeddata', () => {
        setIsLoading(false);
        clearBrokenStream(url);
      }, {
        once: true
      });
      videoRef.current.addEventListener('error', () => failOver('Stream playback error'), {
        once: true
      });
      videoRef.current.play().catch(() => {
        console.log('Autoplay prevented');
      });
    }
  }, [isSlowConnection]);

  // Start a channel from its best candidate feed.
  const loadStream = useCallback((channel: Channel) => {
    candidatesRef.current = streamCandidates(channel as CatalogChannel);
    candidateIndexRef.current = 0;
    loadStreamUrl(candidatesRef.current[0]);
  }, [loadStreamUrl]);
  useEffect(() => {
    if (activeChannel) {
      const channel = channels.find(c => c.id === activeChannel);
      if (channel) {
        loadStream(channel);
      }
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel, channels, loadStream]);
  const handlePlayChannel = (channelId: string, autoExpand = true) => {
    // Optimistic, instant switch — no scroll jumping.
    setIsLoading(true);
    setActiveChannel(channelId);
    onPlay(channelId);
    if (autoExpand) {
      setIsPlayerExpanded(true);
    }
  };
  const handleClosePlayer = () => {
    setActiveChannel(null);
    setIsPlayerExpanded(false);
    setFloating(false);
    setDragOffset({ x: 0, y: 0 });
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };
  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };
  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    videoRef.current.muted = next;
    setIsMuted(next);
  };
  // Sync video element with volume/mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted = isMuted || volume === 0;
    }
  }, [volume, isMuted]);
  // Track play/pause from video element
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setIsPaused(false);
    const onPause = () => setIsPaused(true);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [activeChannel]);
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
  const scrollToInline = () => {
    inlineSlotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setDragOffset({ x: 0, y: 0 });
  };
  const handleNextChannel = useCallback(() => {
    if (currentChannelIndex < channels.length - 1) {
      handlePlayChannel(channels[currentChannelIndex + 1].id);
    } else {
      handlePlayChannel(channels[0].id);
    }
  }, [currentChannelIndex, channels]);
  const handlePreviousChannel = useCallback(() => {
    if (currentChannelIndex > 0) {
      handlePlayChannel(channels[currentChannelIndex - 1].id);
    } else {
      handlePlayChannel(channels[channels.length - 1].id);
    }
  }, [currentChannelIndex, channels]);
  const handleRetryStream = () => {
    if (activeChannel) {
      const channel = channels.find(c => c.id === activeChannel);
      if (channel) {
        loadStream(channel);
      }
    }
  };
  const activeChannelData = channels.find(c => c.id === activeChannel);

  // Auto-collapse volume after 3s inactivity
  useEffect(() => {
    if (!showVolume) return;
    if (volumeTimerRef.current) window.clearTimeout(volumeTimerRef.current);
    volumeTimerRef.current = window.setTimeout(() => setShowVolume(false), 3000);
    return () => { if (volumeTimerRef.current) window.clearTimeout(volumeTimerRef.current); };
  }, [showVolume, volume, isMuted]);

  // Floating mini-player driven by scroll position (works reliably on mobile + desktop).
  // We measure the natural anchor — sentinel when inline, placeholder when floating —
  // which stays at the player's original position and never flickers.
  useEffect(() => {
    if (!activeChannel) return;
    const headerH = 80;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const anchor = floating ? inlineSlotRef.current : playerWrapRef.current;
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      if (!floating && r.bottom < headerH) {
        setFloating(true);
        onMiniPlayerStateChange?.(true, false);
      } else if (floating && r.bottom > headerH + 20) {
        setFloating(false);
        setDragOffset({ x: 0, y: 0 });
        onMiniPlayerStateChange?.(false, true);
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // initial check
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [activeChannel, floating, onMiniPlayerStateChange]);

  // Reset floating when channel changes — main player should always open full size.
  useEffect(() => {
    setFloating(false);
    setDragOffset({ x: 0, y: 0 });
  }, [activeChannel]);

  // MediaSession metadata for lockscreen / notification controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !activeChannelData) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeChannelData.name,
        artist: activeChannelData.category,
        album: 'MR LIVE',
        artwork: [{ src: activeChannelData.logo, sizes: '512x512', type: 'image/png' }],
      });
      navigator.mediaSession.setActionHandler('play', () => videoRef.current?.play().catch(() => {}));
      navigator.mediaSession.setActionHandler('pause', () => videoRef.current?.pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNextChannel());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePreviousChannel());
    } catch {}
  }, [activeChannelData, handleNextChannel, handlePreviousChannel]);

  // Capture inline player height so the slot reserves space when player goes floating
  useEffect(() => {
    if (!playerWrapRef.current || floating) return;
    const h = playerWrapRef.current.offsetHeight;
    if (h > 0) setInlineHeight(h);
  }, [activeChannel, floating, isPlayerExpanded]);

  // Drag handlers for floating mini-player
  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!floating) return;
    const target = e.target as HTMLElement;
    if (target.closest('video, button, input, [data-no-drag]')) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, bx: dragOffset.x, by: dragOffset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { sx, sy, bx, by } = dragRef.current;
    setDragOffset({ x: bx + (e.clientX - sx), y: by + (e.clientY - sy) });
  };
  const onDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };

  return <div ref={containerRef} className="space-y-6 animate-page-enter">
      {/* Stable 1px sentinel — observer target. Never resizes, so no scroll jitter. */}
      {activeChannel && activeChannelData && (
        <div ref={sentinelRef} aria-hidden className="h-px w-full -mb-px" />
      )}
      {/* Placeholder — only rendered when player is floating, reserves the player's natural height. */}
      {activeChannel && activeChannelData && floating && (
        <div
          ref={inlineSlotRef}
          aria-hidden
          style={{ height: inlineHeight, minHeight: inlineHeight }}
          className="rounded-2xl border border-dashed border-border/40 bg-card/30"
        />
      )}

      {/* Full / Floating Player — same DOM node so the video stream never reloads */}
      {activeChannel && activeChannelData && <div
        ref={(el) => { playerRef.current = el; (playerWrapRef as any).current = el; }}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        style={{
          transform: floating ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)` : 'translate3d(0,0,0)',
          willChange: 'transform',
          contain: 'layout style paint',
        }}
        className={cn(
          "rounded-2xl overflow-hidden border shadow-strong",
          isPlayerExpanded ? "" : "h-0 opacity-0",
          floating
            ? "fixed z-40 bottom-20 right-4 w-[280px] sm:w-[340px] md:w-[400px] glass-strong border-white/10 shadow-2xl cursor-grab active:cursor-grabbing"
            : "relative bg-card border-border/50",
        )}>
          {/* Video Container */}
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              className="h-full w-full"
              playsInline
              autoPlay
              onClick={togglePlayPause}
            />
            
            {/* Stream Loader */}
            <StreamLoader
              isLoading={isLoading}
              channelLogo={activeChannelData.logo}
              channelName={activeChannelData.name}
              channelCategory={activeChannelData.category}
            />
            
            {/* Error Handler */}
            <StreamErrorHandler error={unavailable ? streamError : null} isOffline={!isOnline} channelName={activeChannelData.name} onRetry={handleRetryStream} onSwitchToNext={handleNextChannel} />
            
            {/* Overlay controls */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
              <div className="badge-live pointer-events-auto">
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
                LIVE
              </div>
              
              <div className="flex gap-2 pointer-events-auto">
                <Button data-no-drag variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={handlePip} title="Picture in picture">
                  <PictureInPicture2 className="h-4 w-4" />
                </Button>
                <Button data-no-drag variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={handleClosePlayer} title="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bottom custom controls — Play/Pause, Volume (collapsible), Fullscreen, Expand/Collapse */}
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none">
              <Button data-no-drag variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white pointer-events-auto" onClick={togglePlayPause} title={isPaused ? 'Play' : 'Pause'}>
                {isPaused ? <Play className="h-5 w-5 ml-0.5" /> : <Pause className="h-5 w-5" />}
              </Button>

              {/* Collapsible volume */}
              <div className="flex items-center pointer-events-auto">
                <Button data-no-drag variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={() => setShowVolume(v => !v)} title="Volume">
                  {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <div
                  data-no-drag
                  className={cn(
                    "overflow-hidden transition-[width,opacity,margin] duration-300 ease-out",
                    showVolume ? "w-24 sm:w-32 opacity-100 ml-2" : "w-0 opacity-0 ml-0"
                  )}
                >
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={(v) => { setVolume(v[0]); setIsMuted(v[0] === 0); }}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex-1" />

              {/* Fullscreen button — always available */}
              <Button
                data-no-drag
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white pointer-events-auto"
                onClick={handleFullscreen}
                title="Fullscreen"
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Drag handle when floating */}
            {floating && (
              <div className="absolute top-1 left-1/2 -translate-x-1/2 text-white/60">
                <GripHorizontal className="h-4 w-4" />
              </div>
            )}
          </div>
          
          {/* Channel Info — hidden in floating compact mode */}
          {!floating && <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={activeChannelData.logo} alt={activeChannelData.name} className="h-12 w-12 rounded-xl object-cover" />
                <div>
                  <h3 className="text-h3 font-semibold">{activeChannelData.name}</h3>
                  <p className="text-caption text-muted-foreground capitalize">
                    {activeChannelData.category} • {activeChannelData.language}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span className="text-caption">{formatViewers(viewerCounts[activeChannel] ?? 0)} watching</span>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => onToggleFavorite(activeChannel)}>
                  <Star className={cn("h-5 w-5", favorites.includes(activeChannel) && "fill-primary text-primary")} />
                </Button>
              </div>
            </div>
          </div>}

          {/* Compact info bar — only when floating */}
          {floating && (
            <div className="flex items-center gap-2 p-2.5 border-t border-white/10">
              <img src={activeChannelData.logo} alt={activeChannelData.name} className="h-8 w-8 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white line-clamp-1">{activeChannelData.name}</p>
                <p className="text-[10px] text-white/60 capitalize line-clamp-1">{activeChannelData.category}</p>
              </div>
              <Button data-no-drag variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/80 hover:text-white" onClick={() => onToggleFavorite(activeChannel)}>
                <Star className={cn('h-4 w-4', favorites.includes(activeChannel) && 'fill-primary text-primary')} />
              </Button>
            </div>
          )}
        </div>}

      {/* Sponsored banner — directly below the live player */}
      {activeChannel && activeChannelData && (
        <SponsoredBanner />
      )}

      {/* Quick-switch horizontal rail — instant channel switching without scroll-jump */}
      {activeChannel && filteredChannels.length > 1 && (
        <HorizontalRail
          title="Up Next"
          itemWidthClass="w-[160px] sm:w-[180px] md:w-[200px]"
        >
          {filteredChannels.map((channel) => (
            <ChannelCard
              key={`rail-${channel.id}`}
              id={channel.id}
              name={channel.name}
              logo={channel.logo}
              category={channel.category}
              isActive={activeChannel === channel.id}
              isPlaying={activeChannel === channel.id}
              isFavorite={favorites.includes(channel.id)}
              viewerCount={viewerCounts[channel.id]}
              onClick={() => handlePlayChannel(channel.id)}
              onToggleFavorite={(e) => {
                e.stopPropagation();
                onToggleFavorite(channel.id);
              }}
            />
          ))}
        </HorizontalRail>
      )}

      {/* Search & Categories */}
      <div className="space-y-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search channels..." />
        <CategoryTabs categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      </div>

      {/* Channels — one clearly separated horizontal row per category */}
      <div className="space-y-10">
        {channelsByCategory.map(group => (
          <section key={group.category} className="border-t border-border/40 pt-6 first:border-t-0 first:pt-0">
            <HorizontalRail
              title={group.category.charAt(0).toUpperCase() + group.category.slice(1)}
              itemWidthClass="w-[180px] sm:w-[220px] md:w-[240px]"
            >
              {group.items.map(channel => (
                <ChannelCard
                  key={channel.id}
                  id={channel.id}
                  name={channel.name}
                  logo={channel.logo}
                  category={channel.category}
                  isActive={activeChannel === channel.id}
                  isPlaying={activeChannel === channel.id}
                  isFavorite={favorites.includes(channel.id)}
                  viewerCount={viewerCounts[channel.id]}
                  onClick={() => handlePlayChannel(channel.id)}
                  onToggleFavorite={e => {
                    e.stopPropagation();
                    onToggleFavorite(channel.id);
                  }}
                />
              ))}
            </HorizontalRail>
          </section>
        ))}
      </div>

      {/* Empty state */}
      {filteredChannels.length === 0 && <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No channels found</p>
        </div>}
    </div>;
};
export default TvPlayer;