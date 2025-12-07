import { Star, Play, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import LazyImage from './LazyImage';
import ShareButton from './ShareButton';

interface ChannelCardProps {
  id: string;
  name: string;
  logo: string;
  category: string;
  isActive?: boolean;
  isPlaying?: boolean;
  isFavorite?: boolean;
  viewerCount?: number;
  shareVariant?: 'icon' | 'menu';
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const ChannelCard = ({
  id,
  name,
  logo,
  category,
  isActive,
  isPlaying,
  isFavorite,
  viewerCount,
  shareVariant = 'icon',
  onClick,
  onToggleFavorite,
}: ChannelCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-pointer card-interactive",
        "bg-card border border-border/50",
        isActive && "ring-2 ring-primary"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <LazyImage
          src={logo}
          alt={name}
          className="h-full w-full"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Share button - pinned top-right */}
        <div className="absolute top-2 right-2 z-10">
          <ShareButton
            channelId={id}
            channelName={name}
            variant={shareVariant}
            isFavorite={isFavorite}
            onToggleFavorite={() => onToggleFavorite({} as React.MouseEvent)}
          />
        </div>
        
        {/* Play button - centered */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-glow">
            <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
        
        {/* Live/Playing badge */}
        {isPlaying ? (
          <div className="absolute top-2 left-2 badge-live">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
            NOW PLAYING
          </div>
        ) : (
          <div className="absolute top-2 left-2 badge-live">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
            LIVE
          </div>
        )}
        
        {/* Category badge */}
        <div className="absolute bottom-2 left-2 badge-category capitalize">
          {category}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-body line-clamp-1">{name}</h3>
            {viewerCount !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                <Eye className="h-3 w-3" />
                <span className="text-caption">{viewerCount.toLocaleString()} watching</span>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 -mr-1"
            onClick={onToggleFavorite}
          >
            <Star
              className={cn(
                "h-4 w-4 transition-colors",
                isFavorite && "fill-primary text-primary"
              )}
            />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChannelCard;
