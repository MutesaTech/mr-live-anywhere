import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  variant?: 'channel' | 'radio' | 'featured';
  className?: string;
}

const SkeletonCard = ({ variant = 'channel', className }: SkeletonCardProps) => {
  if (variant === 'featured') {
    return (
      <div className={cn("relative aspect-video rounded-2xl bg-muted animate-pulse overflow-hidden", className)}>
        <div className="absolute inset-0 shimmer" />
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="h-3 w-16 bg-muted-foreground/20 rounded" />
          <div className="h-5 w-32 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    );
  }

  if (variant === 'radio') {
    return (
      <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50", className)}>
        <div className="w-14 h-14 rounded-xl bg-muted animate-pulse shrink-0">
          <div className="w-full h-full shimmer rounded-xl" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-3 w-16 bg-muted animate-pulse rounded" />
        </div>
        <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl bg-card border border-border/50 overflow-hidden", className)}>
      <div className="aspect-video bg-muted animate-pulse relative">
        <div className="absolute inset-0 shimmer" />
      </div>
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
};

export const SkeletonGrid = ({ count = 4, variant = 'channel' }: { count?: number; variant?: 'channel' | 'radio' }) => {
  const gridClass = variant === 'radio' 
    ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
    : 'grid grid-cols-2 md:grid-cols-4 gap-3';

  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
};

export default SkeletonCard;
