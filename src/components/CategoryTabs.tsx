import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getCategoryTheme } from '@/lib/categoryThemes';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  return (
    <div className="relative">
      {/* Left fade */}
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}
      
      {/* Right fade */}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}
      
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-1 px-1 -mx-1"
      >
        {categories.map((category) => {
          const isActive = activeCategory === category;
          const theme = getCategoryTheme(category);
          const Icon = theme.icon;

          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={cn(
                "group relative shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold",
                "transition-all duration-300 ease-out border",
                theme.motion,
                isActive
                  ? cn(
                      'text-white border-white/15 bg-gradient-to-r',
                      theme.gradient,
                      theme.glow
                    )
                  : 'bg-secondary/70 text-secondary-foreground border-white/5 hover:bg-secondary'
              )}
            >
              <Icon className={cn(
                'h-4 w-4 transition-transform duration-300',
                isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100',
                isActive && category.toLowerCase() === 'music' && 'animate-pulse-dot',
                isActive && category.toLowerCase() === 'sports' && 'group-hover:rotate-12'
              )} />
              <span className="capitalize tracking-tight">{theme.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;
