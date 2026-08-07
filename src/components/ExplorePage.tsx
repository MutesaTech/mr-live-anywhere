import { useMemo } from 'react';
import { BookOpen, Radio as RadioIcon, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryTheme } from '@/lib/categoryThemes';

interface Item {
  id: string;
  name: string;
  category: string;
}

interface ExplorePageProps {
  channels: Item[];
  radios: Item[];
  onSelectCategory: (category: string, kind: 'tv' | 'radio') => void;
  onOpenBooks: () => void;
}

const ExplorePage = ({ channels, radios, onSelectCategory, onOpenBooks }: ExplorePageProps) => {
  const tvCats = useMemo(() => {
    const map = new Map<string, number>();
    channels.forEach((c) => map.set(c.category, (map.get(c.category) ?? 0) + 1));
    return [...map.entries()];
  }, [channels]);

  const radioCats = useMemo(() => {
    const map = new Map<string, number>();
    radios.forEach((r) => map.set(r.category, (map.get(r.category) ?? 0) + 1));
    return [...map.entries()];
  }, [radios]);

  const tile = (
    key: string,
    label: string,
    count: number,
    gradient: string,
    Icon: React.ComponentType<{ className?: string }>,
    onClick: () => void
  ) => (
    <button
      key={key}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl p-4 h-28 text-left border border-white/5',
        'bg-gradient-to-br text-white shadow-lg transition-transform duration-300 hover:scale-[1.03]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        gradient
      )}
    >
      <Icon className="h-6 w-6 opacity-90" />
      <p className="mt-3 font-bold capitalize leading-tight">{label}</p>
      <p className="text-[11px] opacity-70">{count} available</p>
      <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
    </button>
  );

  return (
    <div className="space-y-8 animate-page-enter">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Explore</h1>
        <p className="text-caption text-muted-foreground">Browse everything on Beemo by category.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold">Live TV categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tvCats.map(([cat, count]) =>
            tile(`tv-${cat}`, getCategoryTheme(cat).label, count, getCategoryTheme(cat).gradient, Tv, () =>
              onSelectCategory(cat, 'tv')
            )
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold">Radio categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {radioCats.map(([cat, count]) =>
            tile(`radio-${cat}`, getCategoryTheme(cat).label, count, getCategoryTheme(cat).gradient, RadioIcon, () =>
              onSelectCategory(cat, 'radio')
            )
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h3 font-semibold">Library</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tile('books', 'Books', 16, 'from-amber-500 to-rose-600', BookOpen, onOpenBooks)}
        </div>
      </section>
    </div>
  );
};

export default ExplorePage;