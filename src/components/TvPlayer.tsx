import { useEffect, useRef, useState, useMemo } from 'react';
import Hls from 'hls.js';
import { Maximize2, Star, Eye, Play, X, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import ChannelCard from './ChannelCard';
import CategoryTabs from './CategoryTabs';
import SearchBar from './SearchBar';

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
}

const TvPlayer = ({ channels, favorites, onToggleFavorite, lastWatched, onPlay }: TvPlayerProps) => {
  const [activeChannel, setActiveChannel] = useState<string | null>(lastWatched);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(channels.map(c => c.category))];
    return cats;
  }, [channels]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || channel.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [channels, searchQuery, activeCategory]);

  useEffect(() => {
    const counts: Record<string, number> = {};
    channels.forEach(channel => {
      counts[channel.id] = Math.floor(Math.random() * 5000) + 100;
    });
    setViewerCounts(counts);

    const interval = setInterval(() => {
      setViewerCounts(prev => {
        const updated = { ...prev };
        channels.forEach(channel => {
          updated[channel.id] = Math.max(100, prev[channel.id] + Math.floor(Math.random() * 20) - 10);
        });
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [channels]);

  useEffect(() => {
    if (activeChannel && videoRef.current) {
      const channel = channels.find(c => c.id === activeChannel);
      if (!channel) return;

      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        
        hls.loadSource(channel.stream);
        hls.attachMedia(videoRef.current);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(() => {
            console.log('Autoplay prevented');
          });
        });

        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = channel.stream;
        videoRef.current.play().catch(() => {
          console.log('Autoplay prevented');
        });
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel, channels]);

  const handlePlayChannel = (channelId: string) => {
    setActiveChannel(channelId);
    onPlay(channelId);
  };

  const handleClosePlayer = () => {
    setActiveChannel(null);
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

  const activeChannelData = channels.find(c => c.id === activeChannel);

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Full Player */}
      {activeChannel && activeChannelData && (
        <div className="rounded-2xl overflow-hidden bg-card border border-border/50 shadow-strong animate-scale-in">
          {/* Video Container */}
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              className="h-full w-full"
              controls
              playsInline
            />
            
            {/* Overlay controls */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
              <div className="badge-live">
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
                LIVE
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  onClick={handleFullscreen}
                >
                  <Maximize2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  onClick={handleClosePlayer}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Channel Info */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeChannelData.logo}
                  alt={activeChannelData.name}
                  className="h-12 w-12 rounded-xl object-cover"
                />
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => onToggleFavorite(activeChannel)}
                >
                  <Star
                    className={cn(
                      "h-5 w-5",
                      favorites.includes(activeChannel) && "fill-primary text-primary"
                    )}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Categories */}
      <div className="space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search channels..."
        />
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
        {filteredChannels.map((channel) => (
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
            onToggleFavorite={(e) => {
              e.stopPropagation();
              onToggleFavorite(channel.id);
            }}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredChannels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No channels found</p>
        </div>
      )}
    </div>
  );
};

export default TvPlayer;
