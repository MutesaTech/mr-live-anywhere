import { Home, BookOpen, Compass, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';

type Section = 'home' | 'books' | 'explore' | 'support';

interface BottomNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

const navItems = [
  { id: 'home' as Section, icon: Home, label: 'Home' },
  { id: 'books' as Section, icon: BookOpen, label: 'Books' },
  { id: 'explore' as Section, icon: Compass, label: 'Explore' },
  { id: 'support' as Section, icon: LifeBuoy, label: 'Support' },
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
                "flex flex-col items-center justify-center gap-0.5 w-20 h-full relative ripple rounded-2xl",
                "transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
