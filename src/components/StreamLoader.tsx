import { cn } from '@/lib/utils';

interface StreamLoaderProps {
  isLoading: boolean;
  className?: string;
}

const StreamLoader = ({ isLoading, className }: StreamLoaderProps) => {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center bg-black/80 z-10",
      "transition-opacity duration-200",
      className
    )}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-primary/30" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
        <span className="text-caption text-white/80">Switching channel...</span>
      </div>
    </div>
  );
};

export default StreamLoader;
