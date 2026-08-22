import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import LazyImage from './LazyImage';
import ChannelMenu from './ChannelMenu';
import { getTvChannelNumber } from '@/lib/channelNumbers';
import { formatViewers } from '@/lib/media';

interface CompactChannelCardProps {
  id: string;
  name: string;
  logo: string;
  language: string;
  isActive?: boolean;
  isPlaying?: boolean;
  /** Whether the channel has a playable stream; false renders an Offline status instead of dropping it. */
  isAvailable?: boolean;
  /** Live audience for the "watching" indicator. */
  viewerCount?: number;
  onClick: () => void;
  /** 'card' = compact poster tile (carousel), 'row' = horizontal list tile (expanded view). */
  variant?: 'card' | 'row';
}

/** Small-footprint TV channel card for the categorized directory rows. */
const CompactChannelCard = ({
  id,
  name,
  logo,
  language,
  isActive,
  isPlaying,
  isAvailable = true,
  viewerCount,
  onClick,
  variant = 'card',
}: CompactChannelCardProps) => {
  const channelNumber = getTvChannelNumber(id);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target as HTMLElement).closest('button')) {
      e.preventDefault();
      onClick();
    }
  };

  const activeClass = isActive
    ? 'border-primary shadow-[0_0_16px_hsl(var(--primary)/0.25)]'
    : 'border-border hover:border-muted-foreground/40';

  if (variant === 'row') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label={`${name}, channel ${channelNumber}`}
        className={cn(
          'flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer',
          'bg-card',
          activeClass,
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
      >
        {/* Left: logo + info */}
        <div className="flex items-center min-w-0">
          <LazyImage
            src={logo}
            alt={name}
            className="w-9 h-9 rounded-lg object-cover bg-muted shrink-0"
          />
          <div className="flex flex-col ml-3 min-w-0">
            <h3 className="text-[13px] font-semibold text-foreground truncate">{name}</h3>
            <p className={cn('text-[11px] truncate', isAvailable ? 'text-muted-foreground' : 'text-muted-foreground/70')}>
              {isAvailable
                ? viewerCount != null
                  ? `${formatViewers(viewerCount)} watching`
                  : 'Live'
                : 'Offline'}
            </p>
          </div>
        </div>

        {/* Active indicator — or Offline status for stream-less channels */}
        {isActive && isPlaying ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-primary-foreground shrink-0 ml-3">
            <span className="h-1 w-1 rounded-full bg-white animate-pulse-dot" />
            Live
          </span>
        ) : !isAvailable ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 ml-3">
            Offline
          </span>
        ) : null}

        {/* Three-dot menu */}
        <ChannelMenu id={id} name={name} className="ml-1 h-8 w-8" />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`${name}, channel ${channelNumber}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl cursor-pointer border transition-all duration-200',
        'bg-card',
        activeClass,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
    >
      {/* Compact 16:9 thumbnail */}
      <div className="relative h-16 sm:h-20 overflow-hidden bg-muted">
        <LazyImage
          src={logo}
          alt={name}
          className="h-full w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        {/* LIVE pill — or muted Offline pill for stream-less channels */}
        {isAvailable ? (
          <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded px-1 py-px text-[7px] font-bold uppercase tracking-wider text-white bg-red-500/90">
            <span className="h-0.5 w-0.5 rounded-full bg-white animate-pulse-dot" />
            LIVE
          </span>
        ) : (
          <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded px-1 py-px text-[7px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/80">
            OFFLINE
          </span>
        )}

      </div>

      {/* Text */}
      <div className="p-1.5">
        {/* Channel name (primary) + watcher count (secondary), same row */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold truncate text-foreground">{name}</h3>
          {viewerCount != null && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-medium text-muted-foreground">
              <Eye className="h-2.5 w-2.5" />
              {formatViewers(viewerCount)}
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate capitalize mt-0.5">{language}</p>
      </div>
    </div>
  );
};

export default CompactChannelCard;
