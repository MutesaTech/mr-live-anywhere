import { ArrowRight } from 'lucide-react';
import CategoryIcon3D from './CategoryIcon3D';
import { cn } from '@/lib/utils';
import { getCategoryPastel } from '@/lib/categoryThemes';

export interface CategoryItem {
  key: string;
  label: string;
}

interface QuickCategoriesProps {
  /** Data-driven categories derived from the actual TV channel catalog. */
  categories: CategoryItem[];
  onSelect: (target: { type: 'section' | 'category'; value: string }) => void;
  /** Opens the full Categories grid (all categories, 3-column layout). */
  onSeeMore: () => void;
}

/** How many categories preview on the Home row — the full list lives in the grid. */
const PREVIEW_LIMIT = 6;

const QuickCategories = ({ categories, onSelect, onSeeMore }: QuickCategoriesProps) => {
  const preview = categories.slice(0, PREVIEW_LIMIT);

  return (
    <section className="space-y-3">
      {/* Header + See More link */}
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">Explore Categories</h2>
        <button
          type="button"
          onClick={onSeeMore}
          className="group/see inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded"
        >
          See More
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/see:translate-x-0.5" />
        </button>
      </div>

      {/* Horizontal scrollable row of pastel category cards */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 snap-x">
        {preview.map(({ key, label }, index) => (
          <button
            key={key}
            onClick={() => onSelect({ type: 'category', value: key })}
            className={cn(
              'group shrink-0 snap-start w-24 sm:w-28 rounded-2xl p-3 border flex flex-col items-center justify-center',
              getCategoryPastel(key, index),
              'hover:scale-[1.04] hover:border-muted-foreground/40 transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            )}
          >
            <CategoryIcon3D slug={key} className="w-12 h-12 object-contain mb-1.5 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]" />
            <span className="text-xs font-semibold text-foreground text-center leading-tight">{label}</span>
          </button>
        ))}

        {/* Inline See More tile for touch */}
        <button
          type="button"
          onClick={onSeeMore}
          aria-label="See all categories"
          className="shrink-0 snap-start w-24 sm:w-28 rounded-2xl p-3 border border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground hover:border-primary/60 hover:bg-muted/40 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="text-[11px] font-semibold text-center leading-tight">All Categories</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export default QuickCategories;
