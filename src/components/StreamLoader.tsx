import { cn } from '@/lib/utils';

interface StreamLoaderProps {
  isLoading: boolean;
  className?: string;
  channelLogo?: string;
  channelName?: string;
  channelCategory?: string;
}

const StreamLoader = ({
  isLoading,
  className,
  channelLogo,
  channelName,
  channelCategory,
}: StreamLoaderProps) => {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center overflow-hidden',
        'bg-gradient-to-br from-[hsl(225_55%_6%)] via-[hsl(224_50%_10%)] to-[hsl(225_55%_5%)]',
        'animate-fade-in',
        className,
      )}
    >
      {/* Ambient radial glow */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(50% 60% at 50% 50%, hsl(217 91% 60% / 0.18), transparent 70%)',
        }}
      />
      {/* Shimmer sweep */}
      <div
        className="absolute inset-y-0 -left-1/3 w-1/3 opacity-30"
        style={{
          background:
            'linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.08), transparent)',
          animation: 'shimmerSweep 2s linear infinite',
        }}
      />
      <style>{`@keyframes shimmerSweep { 0%{transform:translateX(0)} 100%{transform:translateX(400%)} }`}</style>

      <div className="relative flex flex-col items-center gap-4 px-6 text-center">
        {/* Logo with pulsing aura */}
        <div className="relative">
          <span className="absolute inset-0 rounded-2xl gradient-primary blur-2xl opacity-50 animate-pulse-dot" />
          {channelLogo ? (
            <img
              src={channelLogo}
              alt={channelName ?? 'Loading channel'}
              className="relative h-20 w-20 rounded-2xl object-contain bg-card p-2 border border-white/10 shadow-glow"
            />
          ) : (
            <div className="relative h-20 w-20 rounded-2xl bg-card border border-white/10 shadow-glow" />
          )}
          {/* Spinning ring */}
          <span
            className="pointer-events-none absolute -inset-2 rounded-3xl border-2 border-transparent border-t-accent border-r-primary animate-spin"
            style={{ animationDuration: '1.4s' }}
          />
        </div>

        {channelName && (
          <div className="space-y-1">
            <h3 className="text-white text-base font-semibold tracking-tight">
              {channelName}
            </h3>
            {channelCategory && (
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 capitalize">
                {channelCategory} · Tuning in
              </p>
            )}
          </div>
        )}

        {/* Buffering bar */}
        <div className="mt-1 h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <span
            className="block h-full w-1/2 rounded-full gradient-primary"
            style={{ animation: 'shimmerSweep 1.6s ease-in-out infinite' }}
          />
        </div>
      </div>
    </div>
  );
};

export default StreamLoader;
