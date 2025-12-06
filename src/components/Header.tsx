import { useState, useEffect } from 'react';
import { Search, Settings, Download } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface HeaderProps {
  title: string;
  onSearchClick?: () => void;
}

const Header = ({ title, onSearchClick }: HeaderProps) => {
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
        description: "MR LIVE has been installed on your device."
      });
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 glass shadow-soft">
      <div className="container h-full flex items-center justify-between px-4">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="MR LIVE"
            className="h-10 w-10 rounded-lg object-contain"
          />
        </Link>

        {/* Center: Title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-h3 font-semibold truncate max-w-[50%]">
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
        </div>
      </div>
    </header>
  );
};

export default Header;
