import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import { Maximize2, Star, Eye, X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import ChannelCard from './ChannelCard';
import CategoryTabs from './CategoryTabs';
import SearchBar from './SearchBar';
import StreamLoader from './StreamLoader';
import StreamErrorHandler from './StreamErrorHandler';
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
    // Auto-scroll to player
    if (playerRef.current) {
      playerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

    // Fast loading animation
    setIsLoading(true);

    // Instant channel switch (200ms animation feel)
    setTimeout(() => {
      setActiveChannel(channelId);
      onPlay(channelId);
      if (autoExpand) {
        setIsPlayerExpanded(true);
      }
    }, 50);
  };
  const handleClosePlayer = () => {
    setActiveChannel(null);
    setIsPlayerExpanded(false);
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
  return <div ref={containerRef} className="space-y-6 animate-page-enter">
      {/* Full Player */}
      {activeChannel && activeChannelData && <div ref={playerRef} className={cn("rounded-2xl overflow-hidden bg-card border border-border/50 shadow-strong", "transition-all duration-300 ease-out touch-pan-x", isPlayerExpanded ? "animate-scale-in" : "h-0 opacity-0", stickyPlayer && "sticky top-16 z-30")}>
          {/* Video Container */}
          <div className="relative aspect-video bg-black">
            <video ref={videoRef} className="h-full w-full" controls playsInline />
            
            {/* Stream Loader */}
            <StreamLoader isLoading={isLoading} />
            
            {/* Error Handler */}
            <StreamErrorHandler error={streamError} channelName={activeChannelData.name} onRetry={handleRetryStream} onSwitchToNext={handleNextChannel} />
            
            {/* Overlay controls */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
              <div className="badge-live pointer-events-auto">
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
                LIVE
              </div>
              
              <div className="flex gap-2 pointer-events-auto">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={handleFullscreen}>
                  <Maximize2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={handleClosePlayer}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Swipe hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-caption text-white/50 flex items-center gap-1">
              
            </div>
          </div>
          
          {/* Channel Info */}
          <div className="p-4">
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
          </div>
        </div>}

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