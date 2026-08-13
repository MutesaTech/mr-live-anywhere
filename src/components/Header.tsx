import { useState, useEffect } from 'react';
import { Search, Heart, Download } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
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
    <header className="fixed top-0 left-0 right-0 z-50 h-16 glass shadow-soft border-b border-white/5">
      <div className="container h-full flex items-center justify-between px-4">
        {/* Left: Logo + Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl gradient-primary blur-md opacity-60" />
            <img
              src="/logo.png"
              alt="Beemo"
              className="relative h-9 w-9 rounded-xl object-contain bg-card p-1"
            />
          </div>
          <span className="font-bold text-lg tracking-tight text-gradient-primary hidden sm:inline">
            Beemo
          </span>
        </Link>

        {/* Center: Title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold truncate max-w-[50%] text-foreground/90">
          {title}
        </h1>

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
          {onFavoritesClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onFavoritesClick}
              aria-label="Favorites"
              className="h-10 w-10 rounded-full"
            >
              <Heart
                className={cn(
                  'h-5 w-5 transition-colors',
                  favoritesActive ? 'text-accent fill-accent' : 'text-foreground/80'
                )}
              />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
