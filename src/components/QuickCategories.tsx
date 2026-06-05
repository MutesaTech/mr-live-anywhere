import { Tv, Radio, Trophy, Newspaper, Music2, Film, Globe, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickCategoriesProps {
  onSelect: (target: { type: 'section' | 'category'; value: string }) => void;
}

const ITEMS: Array<{
  key: string;
  label: string;
  icon: LucideIcon;
  gradient: string;
  target: { type: 'section' | 'category'; value: string };
}> = [
  { key: 'tv',        label: 'TV Channels',    icon: Tv,        gradient: 'from-blue-500 to-indigo-600',   target: { type: 'section',  value: 'tv' } },
  { key: 'radio',     label: 'Radio',          icon: Radio,     gradient: 'from-rose-500 to-fuchsia-600',  target: { type: 'section',  value: 'radio' } },
  { key: 'sports',    label: 'Sports',         icon: Trophy,    gradient: 'from-orange-500 to-red-500',    target: { type: 'category', value: 'sports' } },
  { key: 'news',      label: 'News',           icon: Newspaper, gradient: 'from-slate-500 to-zinc-800',    target: { type: 'category', value: 'news' } },
  { key: 'music',     label: 'Music',          icon: Music2,    gradient: 'from-fuchsia-500 to-purple-600',target: { type: 'category', value: 'music' } },
  { key: 'enter',     label: 'Entertainment',  icon: Film,      gradient: 'from-pink-500 to-amber-400',    target: { type: 'category', value: 'entertainment' } },
  { key: 'intl',      label: 'International',  icon: Globe,     gradient: 'from-cyan-400 to-blue-600',     target: { type: 'category', value: 'international' } },
  { key: 'featured',  label: 'Featured',       icon: Sparkles,  gradient: 'from-amber-400 to-rose-500',    target: { type: 'section',  value: 'home' } },
];

const QuickCategories = ({ onSelect }: QuickCategoriesProps) => {
  return (
    <section className="space-y-3">
      <h2 className="text-h3 font-semibold px-1">Browse</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x">
        {ITEMS.map(({ key, label, icon: Icon, gradient, target }) => (
          <button
            key={key}
            onClick={() => onSelect(target)}
            className={cn(
              'group shrink-0 snap-start w-24 sm:w-28 flex flex-col items-center gap-2 p-3 rounded-2xl',
              'border border-white/5 bg-card/40 backdrop-blur-md',
              'hover:scale-[1.04] hover:border-white/20 transition-all duration-300'
            )}
          >
            <div className={cn(
              'h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br text-white shadow-lg',
              gradient,
              'group-hover:shadow-glow transition-shadow'
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-semibold text-center text-foreground/90 leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default QuickCategories;