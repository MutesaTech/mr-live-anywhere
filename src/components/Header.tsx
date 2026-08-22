import { useState, useEffect } from 'react';
import { Search, Heart, Download } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  onSearchClick?: () => void;
  onFavoritesClick?: () => void;
  favoritesActive?: boolean;
}

const Header = ({ title, onSearchClick, onFavoritesClick, favoritesActive }: HeaderProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({
        title: "App installed!",
        description: "Beemo has been installed on your device."
      });
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-sm border-b border-border/60 shadow-soft">
      <div className="container h-full flex items-center justify-between px-4">
        {/* Left: App logo (hippo) */}
        <div className="flex shrink-0 items-center gap-2">
          <img
            src="/logo.png"
            alt="Beemo"
            className="h-9 w-9 rounded-xl object-contain"
            draggable={false}
          />
        </div>

        {/* Center: Brand name + section context */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center max-w-[50%] pointer-events-none">
          <span className="text-lg font-bold tracking-tight text-foreground leading-tight truncate max-w-full">
            Beemo
          </span>
          {title && title !== 'Beemo' && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground truncate max-w-full">
              {title}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {isInstallable && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleInstallClick}
              className="h-10 w-10 rounded-full"
            >
              <Download className="h-5 w-5" />
            </Button>
          )}
          {onSearchClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSearchClick}
              className="h-10 w-10 rounded-full"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          {/* Favorites heart — always on the right side of the header */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onFavoritesClick}
            aria-label="Favorites"
            title="Favorites"
            className="h-10 w-10 rounded-full"
          >
            <Heart
              className={cn(
                'h-5 w-5 transition-colors',
                favoritesActive ? 'text-accent fill-accent' : 'text-foreground/80'
              )}
            />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
