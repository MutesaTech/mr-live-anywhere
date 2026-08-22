import { useRef, useState, ReactNode, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HorizontalRailProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  itemWidthClass?: string;
  className?: string;
}

/**
 * Premium horizontal scroller with:
 * - CSS snap scrolling
 * - Mouse drag-to-scroll on desktop
 * - Native touch swipe on mobile
 * - Optional left/right arrow buttons on hover (desktop)
 */
const HorizontalRail = ({
  title,
  action,
  children,
  itemWidthClass = 'w-[200px] sm:w-[240px] md:w-[260px]',
  className,
}: HorizontalRailProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ down: false, startX: 0, scrollLeft: 0, moved: false });
  const [dragging, setDragging] = useState(false);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollerRef.current;
    if (!el) return;
    dragState.current.down = true;
    dragState.current.moved = false;
    dragState.current.startX = e.pageX - el.offsetLeft;
    dragState.current.scrollLeft = el.scrollLeft;
  };

  const endDrag = useCallback(() => {
    dragState.current.down = false;
    // brief delay so click handler can read "moved" state via capture
    setTimeout(() => setDragging(false), 50);
  }, []);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = scrollerRef.current;
    if (!el || !dragState.current.down) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - dragState.current.startX;
    if (Math.abs(walk) > 4) {
      dragState.current.moved = true;
      setDragging(true);
    }
    el.scrollLeft = dragState.current.scrollLeft - walk;
  };

  // Suppress click that follows a drag, so cards don't trigger play after a drag.
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      dragState.current.moved = false;
    }
  };

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <section className={cn('group/rail relative', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          {title && (
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h2>
          )}
          {action}
        </div>
      )}

      <div className="relative">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent" />

        {/* Arrow buttons (desktop only) */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          className="hidden md:flex absolute left-1 top-1/2 z-20 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full glass-strong border border-border text-foreground opacity-0 group-hover/rail:opacity-100 transition-opacity hover:bg-primary/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          className="hidden md:flex absolute right-1 top-1/2 z-20 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full glass-strong border border-border text-foreground opacity-0 group-hover/rail:opacity-100 transition-opacity hover:bg-primary/20"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          ref={scrollerRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onClickCapture={onClickCapture}
          className={cn(
            'flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth px-1 py-1',
            'overscroll-x-contain',
            dragging ? 'cursor-grabbing select-none' : 'cursor-grab',
          )}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {Array.isArray(children)
            ? (children as ReactNode[]).map((child, i) => (
                <div key={i} className={cn('snap-start shrink-0', itemWidthClass)}>
                  {child}
                </div>
              ))
            : (
              <div className={cn('snap-start shrink-0', itemWidthClass)}>{children}</div>
            )}
        </div>
      </div>
    </section>
  );
};

export default HorizontalRail;