import { useState, useEffect } from 'react';
import { Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatViewers, randomViewers } from '@/lib/media';

const SocialProofPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    // Check if popup was shown today
    const lastShown = localStorage.getItem('socialProofLastShown');
    const today = new Date().toDateString();
    
    if (lastShown === today) return;

    // Show popup after 5 seconds
    const timer = setTimeout(() => {
      setViewerCount(randomViewers());
      setIsVisible(true);
      localStorage.setItem('socialProofLastShown', today);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  // Auto-hide after 6 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setIsVisible(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-24 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50",
        "bg-card border border-border/50 rounded-xl shadow-strong",
        "p-4 animate-slide-up"
      )}
    >
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Over <span className="text-primary font-bold">{formatViewers(viewerCount)}</span> users watched Mr Live today!
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Join the community
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialProofPopup;
