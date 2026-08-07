import { Home, Tv, Radio, Star, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type Section = 'home' | 'tv' | 'radio' | 'favorites' | 'settings';

interface BottomNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

const navItems = [
  { id: 'home' as Section, icon: Home, label: 'Home' },
  { id: 'tv' as Section, icon: Tv, label: 'TV' },
  { id: 'radio' as Section, icon: Radio, label: 'Radio' },
  { id: 'favorites' as Section, icon: Star, label: 'Favorites' },
  { id: 'settings' as Section, icon: Settings, label: 'Settings' },
];

const BottomNav = ({ activeSection, onSectionChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong shadow-strong rounded-t-3xl pb-safe border-t border-white/10">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 h-full relative ripple",
                "transition-colors duration-200"
              )}
            >
              {/* Active glow indicator */}
              {isActive && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-1 rounded-full gradient-primary shadow-glow animate-scale-in" />
              )}

              <Icon
                className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive
                    ? "text-accent scale-110 drop-shadow-[0_0_8px_hsl(var(--accent)/0.6)]"
                    : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-caption transition-colors duration-200",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
