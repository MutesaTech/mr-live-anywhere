import { Play, Star } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import LazyImage from './LazyImage';

interface FeaturedCardProps {
  id: string;
  name: string;
  logo: string;
  category: string;
  isFavorite?: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const FeaturedCard = ({
  id,
  name,
  logo,
  category,
  isFavorite,
  onClick,
  onToggleFavorite,
}: FeaturedCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl overflow-hidden cursor-pointer",
        "aspect-[16/9] w-full",
        "shadow-strong hover:shadow-glow transition-shadow duration-300"
      )}
    >
      {/* Background Image */}
      <LazyImage
        src={logo}
        alt={name}
        className="h-full w-full"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* Live badge */}
      <div className="absolute top-4 left-4 badge-live">
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
        LIVE
      </div>
      
      {/* Favorite button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/30 hover:bg-black/50"
        onClick={onToggleFavorite}
      >
        <Star
          className={cn(
            "h-5 w-5 text-white transition-colors",
            isFavorite && "fill-primary text-primary"
          )}
        />
      </Button>
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="badge-category mb-2 capitalize">{category}</span>
            <h2 className="text-h2 text-white line-clamp-1 mt-1">{name}</h2>
          </div>
          
          <Button
            size="lg"
            className="shrink-0 rounded-full px-6 shadow-glow"
          >
            <Play className="h-5 w-5 mr-2" />
            Watch
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCard;
