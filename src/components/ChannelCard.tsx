import { Star, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import LazyImage from './LazyImage';
import { formatViewers } from '@/lib/media';
import { getTvChannelNumber } from '@/lib/channelNumbers';

interface ChannelCardProps {
  id: string;
  name: string;
  logo: string;
  category: string;
  isActive?: boolean;
  isPlaying?: boolean;
  isFavorite?: boolean;
  viewerCount?: number;
  /** Hide the favorite (star) button — used on "Recently Watched" rails. */
  showFavorite?: boolean;
  /** Optional relative-time label, e.g. "Watched 5 min ago". */
  timestampLabel?: string;
  onClick: () => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
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
  showFavorite = true,
  timestampLabel,
  onClick,
  onToggleFavorite,
}: ChannelCardProps) => {
  const channelNumber = getTvChannelNumber(id);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target as HTMLElement).closest('button')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${name}, channel ${channelNumber}`}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-pointer card-interactive",
        "bg-card border border-border/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isActive && "ring-2 ring-primary"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <LazyImage
          src={logo}
          alt={name}
          className="h-full w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.06]"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Live/Playing badge */}
        {isPlaying ? (
          <div className="absolute top-1.5 left-1.5 badge-live">
            <span className="h-1 w-1 rounded-full bg-current animate-pulse-dot" />
            NOW PLAYING
          </div>
        ) : (
          <div className="absolute top-1.5 left-1.5 badge-live">
            <span className="h-1 w-1 rounded-full bg-current animate-pulse-dot" />
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
                <span className="text-caption">{formatViewers(viewerCount)} watching</span>
              </div>
            )}
            {timestampLabel && (
              <p className="text-[10px] text-muted-foreground/80 mt-1">{timestampLabel}</p>
            )}
          </div>
          
          {showFavorite && onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 -mr-1"
              onClick={onToggleFavorite}
              aria-label={`Toggle favorite: ${name}`}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  isFavorite && "fill-primary text-primary"
                )}
              />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelCard;
