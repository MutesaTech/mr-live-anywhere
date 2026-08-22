import SkeletonCard from './SkeletonCard';

/** Skeleton layout that mirrors the new Home page structure (no layout shift). */
const HomeSkeleton = () => (
  <div className="space-y-8 animate-page-enter" aria-hidden>
    {/* Featured Images showcase — top featured */}
    <div className="space-y-3">
      <div className="h-5 w-32 bg-muted animate-pulse rounded" />
      <div className="h-44 sm:h-56 w-full rounded-2xl bg-muted animate-pulse" />
      <div className="flex justify-center gap-1.5 pt-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse" />
        ))}
      </div>
    </div>

    {/* Explore Categories */}
    <div className="space-y-3">
      <div className="h-5 w-44 bg-muted animate-pulse rounded" />
      <div className="flex gap-3 overflow-hidden -mx-4 px-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-[104px] w-24 shrink-0 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>

    {/* Continue Watching */}
    <div className="space-y-3">
      <div className="h-5 w-40 bg-muted animate-pulse rounded" />
      <div className="flex gap-3 sm:gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, j) => (
          <SkeletonCard key={j} className="w-[220px] sm:w-[260px] shrink-0" />
        ))}
      </div>
    </div>

    {/* Continue Listening */}
    <div className="space-y-3">
      <div className="h-5 w-40 bg-muted animate-pulse rounded" />
      <div className="flex gap-3 sm:gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, j) => (
          <SkeletonCard key={j} variant="radio" className="w-[280px] shrink-0" />
        ))}
      </div>
    </div>

    {/* TikClean promo banner — mirrors the compact ad card */}
    <div className="h-[70px] sm:h-[76px] w-full rounded-[18px] bg-muted animate-pulse" />
  </div>
);

export default HomeSkeleton;
