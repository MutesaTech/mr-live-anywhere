import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, X, ChevronUp, Star, SkipBack, SkipForward } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface EnhancedMiniPlayerProps {
  title: string;
  subtitle: string;
  thumbnail: string;
  isPlaying: boolean;
  isFavorite: boolean;
  isExpanded: boolean;
  onPlayPause: () => void;
  onClose: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onToggleFavorite: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const EnhancedMiniPlayer = ({
  title,
  subtitle,
  thumbnail,
  isPlaying,
  isFavorite,
  isExpanded,
  onPlayPause,
  onClose,
  onExpand,
  onCollapse,
  onToggleFavorite,
  onNext,
  onPrevious,
  className,
  children,
}: EnhancedMiniPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Swipe gestures
  useSwipeGesture(containerRef, {
    onSwipeUp: () => !isExpanded && onExpand(),
    onSwipeDown: () => isExpanded && onCollapse(),
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious,
  });

  // Handle expand/collapse animation
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  // Collapsed mini-player
  if (!isExpanded) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "fixed left-4 right-4 z-40 glass rounded-2xl shadow-strong",
          "border border-border/50 transition-all duration-300 ease-out",
          "touch-pan-x",
          className
        )}
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 0.5rem)' }}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Thumbnail */}
          <div 
            className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 cursor-pointer"
            onClick={onExpand}
          >
            <img
              src={thumbnail}
              alt={title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onExpand}>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-body line-clamp-1">{title}</h4>
              <span className="badge-live text-[10px] px-1.5 py-0.5">
                <span className="h-1 w-1 rounded-full bg-current animate-pulse-dot" />
                LIVE
              </span>
            </div>
            <p className="text-caption text-muted-foreground line-clamp-1">{subtitle}</p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={onPlayPause}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onExpand}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="h-0.5 bg-muted rounded-full mx-3 mb-2 overflow-hidden">
          <div className={cn(
            "h-full bg-primary rounded-full",
            isPlaying && "animate-shimmer"
          )} style={{ width: isPlaying ? '100%' : '0%' }} />
        </div>
      </div>
    );
  }

  // Expanded full player
  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 bg-background",
        "transition-all duration-300 ease-out",
        isAnimating ? "animate-slide-up" : ""
      )}
    >
      {/* Handle bar for swipe down */}
      <div className="flex justify-center pt-3 pb-2">
        <div 
          className="w-12 h-1 bg-border rounded-full cursor-pointer"
          onClick={onCollapse}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={onCollapse}
        >
          <ChevronUp className="h-5 w-5 rotate-180" />
        </Button>
        
        <span className="badge-live">
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
          LIVE
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main content area - passed as children */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Bottom controls */}
      <div className="p-6 pb-safe glass border-t border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={thumbnail}
            alt={title}
            className="h-14 w-14 rounded-xl object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-h3 line-clamp-1">{title}</h3>
            <p className="text-caption text-muted-foreground">{subtitle}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            onClick={onToggleFavorite}
          >
            <Star className={cn(
              "h-5 w-5",
              isFavorite && "fill-primary text-primary"
            )} />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-4">
          {onPrevious && (
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={onPrevious}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
          )}
          
          <Button
            size="lg"
            className="h-16 w-16 rounded-full shadow-glow"
            onClick={onPlayPause}
          >
            {isPlaying ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="h-7 w-7 ml-1" />
            )}
          </Button>
          
          {onNext && (
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={onNext}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMiniPlayer;
