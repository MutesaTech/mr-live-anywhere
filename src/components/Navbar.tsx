import { useState, useEffect } from 'react';
import { Radio, Star, Download } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface NavbarProps {
  activeSection: 'tv' | 'radio' | 'favorites';
  onSectionChange: (section: 'tv' | 'radio' | 'favorites') => void;
}

const Navbar = ({ activeSection, onSectionChange }: NavbarProps) => {
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
        description: "MR LIVE has been installed on your device.",
      });
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="MR LIVE Logo" 
            className="h-12 w-12 object-contain"
          />
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            MR LIVE
          </h1>
        </div>
        
        <div className="flex gap-2">
          {isInstallable && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleInstallClick}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Get App</span>
            </Button>
          )}
          <Button
            variant={activeSection === 'tv' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSectionChange('tv')}
            className="gap-2"
          >
            <img src="/logo.png" alt="TV" className="h-4 w-4 object-contain" />
            <span className="hidden sm:inline">TV</span>
          </Button>
          <Button
            variant={activeSection === 'radio' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSectionChange('radio')}
            className="gap-2"
          >
            <Radio className="h-4 w-4" />
            <span className="hidden sm:inline">Radio</span>
          </Button>
          <Button
            variant={activeSection === 'favorites' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSectionChange('favorites')}
            className="gap-2"
          >
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Favorites</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
