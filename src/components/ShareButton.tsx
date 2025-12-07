import { useState, useRef } from 'react';
import { Share2, MoreVertical, Link2, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface ShareButtonProps {
  channelName: string;
  channelId: string;
  variant?: 'icon' | 'menu';
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  className?: string;
}

const ShareButton = ({
  channelName,
  channelId,
  variant = 'icon',
  isFavorite,
  onToggleFavorite,
  className,
}: ShareButtonProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    
    const shareData = {
      title: channelName,
      text: `Watch ${channelName} live!`,
      url: `${window.location.origin}/?channel=${channelId}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 2000);
      }
    } catch (err) {
      console.log('Share cancelled or failed');
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    
    const url = `${window.location.origin}/?channel=${channelId}`;
    await navigator.clipboard.writeText(url);
    setShowCopiedToast(true);
    setIsMenuOpen(false);
    setTimeout(() => setShowCopiedToast(false), 2000);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    onToggleFavorite?.();
    setIsMenuOpen(false);
  };

  // Direct share icon variant
  if (variant === 'icon') {
    return (
      <div className={cn("relative", className)}>
        <button
          onClick={handleShare}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          className={cn(
            // Base styles
            "group/share relative flex items-center justify-center",
            "rounded-full transition-all duration-200 ease-out",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            
            // Mobile: Large touch target with pill background
            "h-11 w-11 sm:h-10 sm:w-10 md:h-9 md:w-9",
            "bg-white/90 dark:bg-black/60 backdrop-blur-sm",
            "shadow-md sm:shadow-sm md:shadow-none",
            "border border-white/20 dark:border-white/10",
            
            // Desktop: Lightweight appearance
            "md:bg-black/40 md:hover:bg-black/60",
            "md:border-transparent md:hover:border-white/20",
            
            // Hover effects (desktop)
            "md:hover:scale-105 md:hover:shadow-lg md:hover:shadow-primary/20",
            
            // Pressed state
            isPressed && "scale-92 shadow-inner"
          )}
          aria-label={`Share ${channelName}`}
        >
          <Share2 
            className={cn(
              "transition-all duration-200",
              // Mobile: Larger, higher contrast
              "h-5 w-5 sm:h-4.5 sm:w-4.5 md:h-4 md:w-4",
              "text-gray-800 dark:text-white",
              "md:text-white/90 md:group-hover/share:text-white",
              isPressed && "scale-95"
            )} 
          />
          
          {/* Hover tooltip - desktop only */}
          <span className="hidden md:block absolute -bottom-8 left-1/2 -translate-x-1/2 
            px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md
            opacity-0 group-hover/share:opacity-100 transition-opacity duration-200
            pointer-events-none whitespace-nowrap z-10">
            Share
          </span>
        </button>

        {/* Copied toast */}
        {showCopiedToast && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 
            px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-full
            animate-fade-in shadow-lg whitespace-nowrap z-20">
            Link copied!
          </div>
        )}
      </div>
    );
  }

  // Three-dots menu variant
  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        onClick={handleMenuToggle}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        className={cn(
          // Base styles
          "group/menu relative flex items-center justify-center",
          "rounded-full transition-all duration-200 ease-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          
          // Mobile: Large touch target
          "h-11 w-11 sm:h-10 sm:w-10 md:h-9 md:w-9",
          "bg-white/90 dark:bg-black/60 backdrop-blur-sm",
          "shadow-md sm:shadow-sm md:shadow-none",
          "border border-white/20 dark:border-white/10",
          
          // Desktop: Lightweight
          "md:bg-black/40 md:hover:bg-black/60",
          "md:border-transparent md:hover:border-white/20",
          
          // Hover effects
          "md:hover:scale-105 md:hover:shadow-lg md:hover:shadow-primary/20",
          
          // Pressed/Active state
          isPressed && "scale-92 shadow-inner",
          isMenuOpen && "bg-primary/20 dark:bg-primary/30 md:bg-primary/30"
        )}
        aria-label="More options"
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? (
          <X className={cn(
            "h-5 w-5 sm:h-4.5 sm:w-4.5 md:h-4 md:w-4",
            "text-gray-800 dark:text-white md:text-white"
          )} />
        ) : (
          <MoreVertical className={cn(
            "h-5 w-5 sm:h-4.5 sm:w-4.5 md:h-4 md:w-4",
            "text-gray-800 dark:text-white",
            "md:text-white/90 md:group-hover/menu:text-white"
          )} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 md:hidden" 
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(false);
            }}
          />
          
          {/* Menu */}
          <div 
            className={cn(
              "absolute z-50 right-0 top-full mt-2",
              "min-w-[180px] py-1.5",
              "bg-white dark:bg-card rounded-xl",
              "shadow-xl shadow-black/20 dark:shadow-black/40",
              "border border-border/50",
              "animate-scale-in origin-top-right",
              "backdrop-blur-lg"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleShare}
              className="flex items-center gap-3 w-full px-4 py-3 text-left
                text-sm font-medium text-foreground
                hover:bg-muted/50 active:bg-muted transition-colors"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
              Share Channel
            </button>
            
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-3 w-full px-4 py-3 text-left
                text-sm font-medium text-foreground
                hover:bg-muted/50 active:bg-muted transition-colors"
            >
              <Link2 className="h-4 w-4 text-muted-foreground" />
              Copy Link
            </button>
            
            <div className="h-px bg-border/50 my-1 mx-3" />
            
            <button
              onClick={handleFavorite}
              className="flex items-center gap-3 w-full px-4 py-3 text-left
                text-sm font-medium text-foreground
                hover:bg-muted/50 active:bg-muted transition-colors"
            >
              <Star className={cn(
                "h-4 w-4",
                isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
              )} />
              {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
          </div>
        </>
      )}

      {/* Copied toast */}
      {showCopiedToast && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 
          px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-full
          animate-fade-in shadow-lg whitespace-nowrap z-20">
          Link copied!
        </div>
      )}
    </div>
  );
};

export default ShareButton;
