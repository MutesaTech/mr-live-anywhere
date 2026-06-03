import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import { Maximize2, Minimize2, Star, Eye, X, GripHorizontal, PictureInPicture2 } from 'lucide-react';
import { Button } from './ui/button';
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
interface Channel {
  id: string;
  name: string;
  logo: string;
  stream: string;
  category: string;
  language: string;
}
interface TvPlayerProps {
  channels: Channel[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  lastWatched: string | null;
  onPlay: (id: string) => void;
  externalChannel?: string | null;
  onMiniPlayerStateChange?: (isVisible: boolean, isExpanded: boolean) => void;
}
const TvPlayer = ({
  channels,
  favorites,
  onToggleFavorite,
  lastWatched,
  onPlay,
  externalChannel,
  onMiniPlayerStateChange
}: TvPlayerProps) => {
  const [activeChannel, setActiveChannel] = useState<string | null>(lastWatched);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(true);
  const [stickyPlayer, setStickyPlayer] = useState(false);
  // Floating/draggable mini-player state
  const [floating, setFloating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [inlineHeight, setInlineHeight] = useState(0);
  const dragRef = useRef<{ sx: number; sy: number; bx: number; by: number } | null>(null);
  const inlineSlotRef = useRef<HTMLDivElement>(null);
  const playerWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    isSlowConnection
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

  // Handle external channel selection
  useEffect(() => {
    if (externalChannel && externalChannel !== activeChannel) {
      handlePlayChannel(externalChannel, true);
    }
  }, [externalChannel]);
  useEffect(() => {
    const counts: Record<string, number> = {};
    channels.forEach(channel => {
      counts[channel.id] = Math.floor(Math.random() * 5000) + 100;
    });
    setViewerCounts(counts);
    const interval = setInterval(() => {
      setViewerCounts(prev => {
        const updated = {
          ...prev
        };
        channels.forEach(channel => {
          updated[channel.id] = Math.max(100, prev[channel.id] + Math.floor(Math.random() * 20) - 10);
        });
        return updated;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [channels]);

  // Load stream with error handling
  const loadStream = useCallback((channel: Channel) => {
    if (!videoRef.current) return;
    setIsLoading(true);
    setStreamError(null);
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
      hls.loadSource(channel.stream);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        videoRef.current?.play().catch(() => {
          console.log('Autoplay prevented');
        });
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setIsLoading(false);
          setStreamError(data.details);
        }
      });
      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = channel.stream;
      videoRef.current.addEventListener('loadeddata', () => setIsLoading(false), {
        once: true
      });
      videoRef.current.addEventListener('error', () => {
        setIsLoading(false);
        setStreamError('Stream playback error');
      }, {
        once: true
      });
      videoRef.current.play().catch(() => {
        console.log('Autoplay prevented');
      });
    }
  }, [isSlowConnection]);
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

  // Observe inline slot — when out of view while a channel is playing, switch player to floating mini-mode.
  useEffect(() => {
    if (!inlineSlotRef.current || !activeChannel) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setFloating((prev) => {
          const next = !visible;
          if (next === prev) return prev;
          if (!next) setDragOffset({ x: 0, y: 0 });
          // Notify parent that a mini-player is visible vs the inline expanded player
          onMiniPlayerStateChange?.(next, !next);
          return next;
        });
      },
      { threshold: 0, rootMargin: '-72px 0px 0px 0px' }
    );
    obs.observe(inlineSlotRef.current);
    return () => obs.disconnect();
  }, [activeChannel, onMiniPlayerStateChange]);

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
      {/* Inline slot — reserves layout space when the player is floating */}
      {activeChannel && activeChannelData && (
        <div
          ref={inlineSlotRef}
          aria-hidden={floating}
          style={{ height: floating ? inlineHeight : undefined, minHeight: floating ? inlineHeight : undefined }}
          className={cn(floating && 'rounded-2xl border border-dashed border-border/40 bg-card/30')}
        />
      )}

      {/* Full / Floating Player — same DOM node so the video stream never reloads */}
      {activeChannel && activeChannelData && <div
        ref={(el) => { playerRef.current = el; (playerWrapRef as any).current = el; }}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        style={floating ? { transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)` } : undefined}
        className={cn(
          "rounded-2xl overflow-hidden border shadow-strong touch-pan-x",
          "transition-[width,box-shadow,border-color,background-color] duration-300 ease-out",
          isPlayerExpanded ? "animate-scale-in" : "h-0 opacity-0",
          floating
            ? "fixed z-40 bottom-4 right-4 w-[280px] sm:w-[340px] md:w-[400px] glass-strong border-white/10 shadow-2xl cursor-grab active:cursor-grabbing"
            : "relative bg-card border-border/50",
        )}>
          {/* Video Container */}
          <div className="relative aspect-video bg-black">
            <video ref={videoRef} className="h-full w-full" controls playsInline />
            
            {/* Stream Loader */}
            <StreamLoader
              isLoading={isLoading}
              channelLogo={activeChannelData.logo}
              channelName={activeChannelData.name}
              channelCategory={activeChannelData.category}
            />
            
            {/* Error Handler */}
            <StreamErrorHandler error={streamError} channelName={activeChannelData.name} onRetry={handleRetryStream} onSwitchToNext={handleNextChannel} />
            
            {/* Overlay controls */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
              <div className="badge-live pointer-events-auto">
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
                LIVE
              </div>
              
              <div className="flex gap-2 pointer-events-auto">
                {floating && (
                  <Button data-no-drag variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={scrollToInline} title="Expand">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                )}
                <Button data-no-drag variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={handlePip} title="Picture in picture">
                  <PictureInPicture2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={handleFullscreen}>
                  <Maximize2 className="h-5 w-5" />
                </Button>
                <Button data-no-drag variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={handleClosePlayer}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
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
                  <span className="text-caption">{viewerCounts[activeChannel]?.toLocaleString()}</span>
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

      {/* Channels Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
        {filteredChannels.map(channel => <ChannelCard key={channel.id} id={channel.id} name={channel.name} logo={channel.logo} category={channel.category} isActive={activeChannel === channel.id} isPlaying={activeChannel === channel.id} isFavorite={favorites.includes(channel.id)} viewerCount={viewerCounts[channel.id]} onClick={() => handlePlayChannel(channel.id)} onToggleFavorite={e => {
        e.stopPropagation();
        onToggleFavorite(channel.id);
      }} />)}
      </div>

      {/* Empty state */}
      {filteredChannels.length === 0 && <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No channels found</p>
        </div>}
    </div>;
};
export default TvPlayer;