import { Play, Pause, X, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface MiniPlayerProps {
  title: string;
  subtitle: string;
  thumbnail: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
  onExpand: () => void;
  className?: string;
}

const MiniPlayer = ({
  title,
  subtitle,
  thumbnail,
  isPlaying,
  onPlayPause,
  onClose,
  onExpand,
  className,
}: MiniPlayerProps) => {
  return (
    <div
      className={cn(
        "fixed left-4 right-4 z-40 glass rounded-2xl shadow-strong animate-slide-up",
        "border border-border/50",
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
          <h4 className="font-semibold text-body line-clamp-1">{title}</h4>
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
      
      {/* Progress bar placeholder */}
      <div className="h-0.5 bg-muted rounded-full mx-3 mb-2 overflow-hidden">
        <div className="h-full w-1/3 bg-primary rounded-full" />
      </div>
    </div>
  );
};

export default MiniPlayer;
