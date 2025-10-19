import { useState, useEffect } from 'react';
import { Radio, Star, Download, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface NavbarProps {
  activeSection: 'tv' | 'radio' | 'favorites';
  onSectionChange: (section: 'tv' | 'radio' | 'favorites') => void;
}

const Navbar = ({ activeSection, onSectionChange }: NavbarProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link to="/">
            <img
              src="/logo.png"
              alt="MR LIVE Logo"
              className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 w-auto object-contain cursor-pointer"
            />
          </Link>
        </div>

        {/* Hamburger for small screens */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Navbar buttons */}
        <div
          className={`absolute top-full left-0 w-full bg-card/95 backdrop-blur-md p-4 sm:static sm:flex sm:items-center sm:p-0 gap-2 ${
            isMobileMenuOpen ? "flex flex-col" : "hidden sm:flex"
          }`}
        >
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
