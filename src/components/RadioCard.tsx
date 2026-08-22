import { Star, Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import LazyImage from './LazyImage';
import { getRadioChannelNumber } from '@/lib/channelNumbers';

interface RadioCardProps {
  id: string;
  name: string;
  logo: string;
  category: string;
  isActive?: boolean;
  isPlaying?: boolean;
  isFavorite?: boolean;
  /** Hide the favorite (star) button — used on "Recently Played" rails. */
  showFavorite?: boolean;
  /** Optional relative-time label, e.g. "Played 5 min ago". */
  timestampLabel?: string;
  onClick: () => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

const RadioCard = ({
  id,
  name,
  logo,
  category,
  isActive,
  isPlaying,
  isFavorite,
  showFavorite = true,
  timestampLabel,
  onClick,
  onToggleFavorite,
}: RadioCardProps) => {
  const channelNumber = getRadioChannelNumber(id);

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
        "bg-card border border-border/50 p-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isActive && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Logo with play overlay */}
        <div className="relative shrink-0">
          <LazyImage
            src={logo}
            alt={name}
            className="h-14 w-14 rounded-xl transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
          
          {/* Play/Pause overlay */}
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
              {isPlaying ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white ml-0.5" />
              )}
            </div>
          )}
          
          {/* Playing indicator */}
          {isActive && isPlaying && (
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-primary-foreground animate-pulse-dot" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-body line-clamp-1">{name}</h3>
          <p className="text-caption text-muted-foreground capitalize mt-0.5">{category}</p>
          {timestampLabel && (
            <p className="text-[10px] text-muted-foreground/80 mt-0.5">{timestampLabel}</p>
          )}
          {/* Waveform visualization */}
          <div className="flex items-end gap-[3px] h-5 mt-1.5" aria-hidden>
            {Array.from({ length: 18 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-[2px] rounded-full bg-gradient-to-t from-primary to-accent",
                  isActive && isPlaying ? "animate-pulse-dot" : "opacity-40"
                )}
                style={{
                  height: `${20 + Math.abs(Math.sin(i * 0.9)) * 80}%`,
                  animationDelay: `${i * 70}ms`,
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Favorite button */}
        {showFavorite && onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
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
  );
};

export default RadioCard;
