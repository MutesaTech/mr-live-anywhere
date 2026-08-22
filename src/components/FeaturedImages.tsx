import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

export type PromoKey = 'sports' | 'family' | 'movies';

interface FeaturedImagesProps {
  className?: string;
  /** Opens the playlist page for the given category when a promo slide is tapped. */
  onOpenCategoryPlaylist: (category: PromoKey) => void;
}

/** Playlist promo slides — the entire Featured showcase. */
const PROMOS: {
  key: PromoKey;
  // title: string;
  // description: string;
  button: string;
  gradient: string;
  image: string;
}[] = [
  {
    key: 'sports',
    // title: 'Sports',
    // description: 'Create your sports playlist',
    button: 'Explore Sports',
    gradient: 'bg-[linear-gradient(120deg,#064e3b,#059669_55%,#34d399)]',
    image: 'https://i.postimg.cc/mD8RFTbk/FIFA-World-Cup-2022-Qatar-Official-Promo-Magic-In-The-Air-HD.jpg',
  },
  {
    key: 'family',
    // title: 'Family',
    // description: 'Create a playlist for everyone',
    button: 'Explore Family',
    gradient: 'bg-[linear-gradient(120deg,#7c2d12,#ea580c_55%,#f472b6)]',
    image: 'https://i.postimg.cc/Hn1yh0q3/download.jpg',
  },
  {
    key: 'movies',
    // title: 'Movies',
    // description: 'Build your movie-night playlist',
    button: 'Explore Movies',
    gradient: 'bg-[linear-gradient(120deg,#1e1b4b,#6d28d9_55%,#9d174d)]',
    image: 'https://i.postimg.cc/66zWSfxT/download-(1).jpg',
  },
];

const AUTO_ADVANCE_MS = 6000;

/**
 * \"Featured Images\" showcase — ONE large promo slide at a time (Sports /
 * Family / Movies), with automatic rotation (timer resets on manual
 * navigation), horizontal swipe, and subtle pagination dots. Every slide
 * opens its matching Playlist page directly.
 */
const FeaturedImages = ({ className, onOpenCategoryPlaylist }: FeaturedImagesProps) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const goNext = useCallback(() => {
    setDir(1);
    setIndex((i) => (i + 1) % PROMOS.length);
  }, []);

  const goPrev = useCallback(() => {
    setDir(-1);
    setIndex((i) => (i - 1 + PROMOS.length) % PROMOS.length);
  }, []);

  useSwipeGesture(containerRef, {
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  // Auto-advance; the effect re-runs on every index change (manual or auto),
  // so user interaction naturally resets the timer. Pauses on hover/focus and
  // respects reduced motion.
  useEffect(() => {
    if (paused || reducedMotion || PROMOS.length <= 1) return;
    const t = window.setTimeout(goNext, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, reducedMotion, goNext]);

  const item = PROMOS[index];

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-lg sm:text-xl font-bold tracking-tight px-1">Featured</h2>

      <div
        ref={containerRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured playlists"
        tabIndex={0}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') goNext();
          if (e.key === 'ArrowLeft') goPrev();
        }}
        className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* ONE slide at a time — subtle directional fade/slide */}
        <div
          key={item.key}
          className="relative h-44 sm:h-56 w-full"
          style={{
            animation: reducedMotion
              ? 'none'
              : `featured-in 0.45s cubic-bezier(0.16, 1, 0.3, 1)`,
            ['--slide-from' as string]: dir === 1 ? '24px' : '-24px',
          }}
        >
          {/* Playlist promo slide — opens the matching playlist page */}
          <button
            type="button"
            onClick={() => onOpenCategoryPlaylist(item.key)}
            aria-label={`${item.title} — ${item.button}`}
            className="group relative block h-full w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
          >
            {/* Themed gradient base — visible while the photo loads or if it fails */}
            <div className={cn('absolute inset-0', item.gradient)} />
            {/* Muted placeholder while the photo streams in */}
            <div className="absolute inset-0 bg-slate-950/40" />
            {/* Real imagery — graceful fallback to the gradient on error */}
            <img
              src={item.image}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Dark gradient overlay — keeps the text readable while the photo stays visible */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 pb-6 sm:pb-8">
              <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
                {item.title}
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm text-white/80">{item.description}</p>
              <span className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md transition-transform duration-200 group-hover:scale-[1.03] sm:text-xs">
                {item.button}
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Pagination indicators — subtle, underneath the image */}
      <div className="flex justify-center gap-1.5 pt-1">
        {PROMOS.map((p, i) => {
          const active = i === index;
          return (
            <button
              key={p.key}
              type="button"
              aria-label={`Go to featured image ${i + 1}`}
              aria-current={active}
              onClick={() => setIndex(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                active ? 'w-6 bg-primary' : 'w-1.5 bg-foreground/20 hover:bg-foreground/40'
              )}
            />
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedImages;
