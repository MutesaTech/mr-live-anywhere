import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Maximize2, Star, Eye, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { cn } from '@/lib/utils';
import LazyImage from './LazyImage';

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
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

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
          updated[channel.id] = prev[channel.id] + Math.floor(Math.random() * 20) - 10;
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

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const activeChannelData = channels.find(c => c.id === activeChannel);

  return (
    <div className="space-y-8">
      {activeChannel && activeChannelData && (
        <Card className="overflow-hidden shadow-card">
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              className="h-full w-full"
              controls
              playsInline
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-4 right-4 bg-secondary/80 backdrop-blur-sm"
              onClick={handleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse-glow rounded-full bg-red-500" />
              <span className="text-sm font-medium text-white">LIVE</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <img
                src={activeChannelData.logo}
                alt={activeChannelData.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-semibold">{activeChannelData.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {activeChannelData.category} • {activeChannelData.language}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{viewerCounts[activeChannel]?.toLocaleString()}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
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
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => (
          <Card
            key={channel.id}
            className={cn(
              "group cursor-pointer overflow-hidden shadow-card hover-lift",
              activeChannel === channel.id && "ring-2 ring-primary"
            )}
            onClick={() => handlePlayChannel(channel.id)}
          >
            <div className="relative aspect-video overflow-hidden">
              <LazyImage
                src={channel.logo}
                alt={channel.name}
                className="h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Play className="h-6 w-6" />
              </Button>
              {activeChannel === channel.id && (
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-red-500 px-2 py-1">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  <span className="text-xs font-medium text-white">NOW PLAYING</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold line-clamp-1">{channel.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {channel.category}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(channel.id);
                    }}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        favorites.includes(channel.id) && "fill-primary text-primary"
                      )}
                    />
                  </Button>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span className="text-xs">{viewerCounts[channel.id]?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TvPlayer;
