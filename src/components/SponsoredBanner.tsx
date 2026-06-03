import { cn } from '@/lib/utils';

interface SponsoredBannerProps {
  className?: string;
  /** Optional image URL. When omitted, a tasteful placeholder is rendered. */
  imageUrl?: string;
  href?: string;
  title?: string;
  subtitle?: string;
  cta?: string;
}

/**
 * Premium 16:5 sponsored banner placed directly below the live player.
 * Responsive heights: ~65-85px mobile, ~80-100px tablet, ~90-120px desktop.
 */
const SponsoredBanner = ({
  className,
  imageUrl,
  href,
  title = 'Your brand could be here',
  subtitle = 'Premium 16:5 sponsored placement',
  cta = 'Learn more',
}: SponsoredBannerProps) => {
  const content = (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl md:rounded-3xl',
        'border border-white/10 shadow-card',
        'h-[72px] sm:h-[88px] md:h-[104px] lg:h-[116px]',
        className,
      )}
      style={{ aspectRatio: '16 / 5' }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(120deg, hsl(224 50% 12%) 0%, hsl(217 60% 18%) 45%, hsl(187 70% 22%) 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background:
                'radial-gradient(40% 80% at 85% 50%, hsl(187 85% 53% / 0.35), transparent 70%), radial-gradient(35% 80% at 15% 50%, hsl(217 91% 60% / 0.35), transparent 70%)',
            }}
          />
        </>
      )}

      {/* Glass content layer */}
      <div className="absolute inset-0 flex items-center justify-between gap-3 px-4 sm:px-5 md:px-6">
        <div className="min-w-0 flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] bg-white/10 text-white/80 backdrop-blur-md border border-white/10">
            Sponsored
          </span>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm sm:text-base truncate">
              {title}
            </p>
            <p className="text-white/60 text-[11px] sm:text-xs truncate">
              {subtitle}
            </p>
          </div>
        </div>
        <span className="shrink-0 inline-flex items-center rounded-full gradient-primary px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-white shadow-glow">
          {cta}
        </span>
      </div>

      {/* Mobile sponsored chip */}
      <span className="sm:hidden absolute top-1.5 left-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-black/40 text-white/80 backdrop-blur-md">
        Sponsored
      </span>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener sponsored"
        className="block transition-transform duration-300 hover:-translate-y-0.5"
      >
        {content}
      </a>
    );
  }
  return content;
};

export default SponsoredBanner;