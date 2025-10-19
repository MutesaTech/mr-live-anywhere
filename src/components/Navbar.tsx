import { Tv, Radio, Star } from 'lucide-react';
import { Button } from './ui/button';

interface NavbarProps {
  activeSection: 'tv' | 'radio' | 'favorites';
  onSectionChange: (section: 'tv' | 'radio' | 'favorites') => void;
}

const Navbar = ({ activeSection, onSectionChange }: NavbarProps) => {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <Tv className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            MR LIVE
          </h1>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={activeSection === 'tv' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSectionChange('tv')}
            className="gap-2"
          >
            <Tv className="h-4 w-4" />
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
