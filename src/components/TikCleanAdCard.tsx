import { cn } from '@/lib/utils';

const TIKCLEAN_URL =
  'https://play.google.com/store/apps/details?id=com.mutesatechlink.tikclean&pcampaignid=web_share';

interface TikCleanAdCardProps {
  className?: string;
  /** Destination when the whole card is tapped. */
  href?: string;
  /** Small label pill shown top-left (e.g. "Sponsored"). */
  badge?: string;
  /** Bold headline — 1 line, ellipsis if too long. */
  title?: string;
  /** Supporting line — 1 line, ellipsis if too long. */
  description?: string;
  /** Compact CTA label on the right. */
  cta?: string;
  ariaLabel?: string;
}

/**
 * Compact sponsored banner used on Home (TikClean by default).
 *
 * A short, wide premium card matching the reference proportions: small
 * SPONSORED pill on top, strong 1-line title, muted 1-line description, and a
 * compact cyan/blue CTA vertically centered on the right (~70–75% text /
 * ~25–30% CTA). Fixed compact height (~70px mobile, ~76px larger screens) with
 * an 18px radius, barely-visible translucent border, and a soft shadow. The
 * surface is a horizontal gradient that adapts per theme: soft light blue-gray
 * in Light Mode, deep navy→teal in Dark Mode. A subtle glass reflection
 * (`glass-sweep`) still passes beneath the content, which never moves. The
 * whole card is one link; every piece of content is configurable so other
 * promotions reuse the same design system — TikClean values are the defaults.
 */
const TikCleanAdCard = ({
  className,
  href = TIKCLEAN_URL,
  badge = 'Sponsored',
  title = 'TikTok Without Watermark',
  description = 'Download  videos, sounds & images .',
  cta = 'Go',
  ariaLabel = ' TikClean: download TikTok videos, sounds and images without watermark',
}: TikCleanAdCardProps) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={cn(
        'group relative block w-full h-[70px] sm:h-[76px] overflow-hidden rounded-[18px]',
        'border border-[rgba(23,32,51,0.08)] dark:border-[rgba(255,255,255,0.12)]',
        'shadow-[0_4px_16px_rgba(0,0,0,0.15)]',
        'bg-[linear-gradient(100deg,#EEF4FA_0%,#E8F3F8_55%,#D8F1F3_100%)]',
        'dark:bg-[linear-gradient(100deg,#182B52_0%,#1D3B61_55%,#1F7180_100%)]',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-px hover:brightness-[1.04]',
        'active:scale-[0.99]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
    >
      {/* Subtle glass reflection — passes beneath the content, never moves it */}
      <div className="glass-sweep" aria-hidden />

      {/* Content — compact horizontal: text left (~70%), CTA right (~30%) */}
      <div className="relative z-10 flex h-full items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-4">
        {/* Left: SPONSORED pill → title → description */}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          {badge && (
            <span
              className={cn(
                'mb-1 w-fit rounded-[6px] border px-[7px] py-[2px]',
                'text-[8px] font-bold uppercase leading-none tracking-[0.7px]',
                'border-[rgba(23,32,51,0.10)] bg-[rgba(23,32,51,0.07)] text-[#536071]',
                'dark:border-white/10 dark:bg-white/10 dark:text-white/85'
              )}
            >
              {badge}
            </span>
          )}
          <h3 className="truncate text-sm font-bold leading-[17px] tracking-tight text-[#172033] dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 truncate text-[10px] font-medium leading-[14px] text-[#687386] sm:text-[11px] dark:text-[#B5C2D4]">
              {description}
            </p>
          )}
        </div>

        {/* Right: compact cyan/blue CTA */}
        <span
          className={cn(
            'inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-[16px] px-3.5',
            'bg-[linear-gradient(100deg,#2D8FFF,#21C4E8)] text-[11px] font-bold text-white',
            'shadow-[0_2px_8px_rgba(45,143,255,0.35)]',
            'transition-all duration-200 ease-out group-hover:-translate-y-px group-hover:brightness-110'
          )}
        >
          {cta}
        </span>
      </div>
    </a>
  );
};

export default TikCleanAdCard;
