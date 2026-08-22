import { ArrowLeft, LayoutGrid } from 'lucide-react';
import CategoryIcon3D from './CategoryIcon3D';
import { cn } from '@/lib/utils';
import { getCategoryPastel } from '@/lib/categoryThemes';

export interface CategorySummary {
  key: string;
  label: string;
  count: number;
}

interface CategoriesGridProps {
  /** Every category present in the TV channel catalog, with channel counts. */
  categories: CategorySummary[];
  onBack: () => void;
  /** Navigates to a category's channel list. */
  onOpenCategory: (slug: string) => void;
}

const CategoriesGrid = ({ categories, onBack, onOpenCategory }: CategoriesGridProps) => {
  return (
    <div className="animate-page-enter">
      {/* Clean top bar */}
      <div className="flex items-center gap-3 py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          title="Back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Categories</h1>
        <LayoutGrid className="h-5 w-5 text-primary/70" aria-hidden />
      </div>

      {/* Balanced 3-column grid of pastel category tiles */}
      <div className="grid grid-cols-3 gap-3.5 pb-24">
        {categories.map((category, index) => (
          <button
            key={category.key}
            type="button"
            onClick={() => onOpenCategory(category.key)}
            className={cn(
              'aspect-square rounded-2xl border flex flex-col items-center justify-center p-3',
              getCategoryPastel(category.key, index),
              'shadow-sm hover:scale-105 transition-transform duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            )}
          >
            <CategoryIcon3D slug={category.key} className="w-14 h-14 object-contain mb-2 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]" />
            <span className="text-xs font-semibold text-foreground text-center leading-tight">{category.label}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
              {category.count} {category.count === 1 ? 'channel' : 'channels'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoriesGrid;
