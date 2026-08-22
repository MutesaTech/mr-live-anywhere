import { Play, Pause, Radio as RadioIcon } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import LazyImage from './LazyImage';
import { getTvChannelNumber, getRadioChannelNumber } from '@/lib/channelNumbers';
import { tvNowPlaying, radioNowPlaying } from '@/lib/nowPlaying';
import { usePlayer } from '@/hooks/usePlayer';

interface Channel {
  id: string;
  name: string;
  logo: string;
  category: string;
  language: string;
}

interface Radio {
  id: string;
  name: string;
  logo: string;
  category: string;
  language: string;
}

interface ContinueTvCardProps {
  channel: Channel;
  onClick: () => void;
}

interface ContinueRadioCardProps {
  radio: Radio;
  onClick: () => void;
}

/** Minimalist TV "Continue Watching" card — logo, name, show title, live progress bar. */
export const ContinueTvCard = ({ channel, onClick }: ContinueTvCardProps) => {
  const title = tvNowPlaying(channel.id, channel.category);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target as HTMLElement).closest('button')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Continue watching ${channel.name}`}
      className={cn(
        'group relative overflow-hidden rounded-2xl cursor-pointer card-interactive',
        'bg-card border border-border',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <LazyImage
          src={channel.logo}
          alt={channel.name}
          className="h-full w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* LIVE tag */}
        <span className="absolute top-1.5 left-1.5 badge-live">
          <span className="h-1 w-1 rounded-full bg-current animate-pulse-dot" />
          LIVE
        </span>
      </div>

      {/* Content */}
      <div className="p-2.5">
        <h3 className="font-semibold text-[13px] text-foreground line-clamp-1">{channel.name}</h3>
        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{title}</p>
      </div>
    </div>
  );
};

/** Minimalist Radio "Continue Listening" card — logo badge, station, track, play/pause. */
export const ContinueRadioCard = ({ radio, onClick }: ContinueRadioCardProps) => {
  const track = radioNowPlaying(radio.id, radio.category);
  const { nowPlaying, isPlaying } = usePlayer();
  const isActive = nowPlaying?.type === 'radio' && nowPlaying.id === radio.id;
  const playing = isActive && isPlaying;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target as HTMLElement).closest('button')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Continue listening to ${radio.name}`}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-2xl cursor-pointer card-interactive',
        'bg-card border border-border p-2.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        playing && 'border-primary/60'
      )}
    >
      {/* Circular station badge */}
      <div className="relative shrink-0">
        <LazyImage
          src={radio.logo}
          alt={radio.name}
          className="h-11 w-11 rounded-full bg-muted border border-border transition-transform duration-500 motion-safe:group-hover:scale-105"
        />
        {playing && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-dot" />
          </span>
        )}
      </div>

      {/* Station + track */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[13px] text-foreground line-clamp-1">{radio.name}</h3>
        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{track}</p>
      </div>

      {/* Inline Play/Pause */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={playing ? `Pause ${radio.name}` : `Play ${radio.name}`}
        className={cn(
          'h-9 w-9 shrink-0 rounded-full',
          playing
            ? 'bg-primary text-primary-foreground hover:bg-primary-dark'
            : 'bg-muted text-foreground hover:bg-primary/80'
        )}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </Button>
    </div>
  );
};
