import { useMemo } from 'react';
import { Tv, Radio as RadioIcon, History } from 'lucide-react';
import ChannelCard from './ChannelCard';
import RadioCard from './RadioCard';
import HorizontalRail from './HorizontalRail';
import QuickCategories from './QuickCategories';
import { cn } from '@/lib/utils';

interface Channel {
  id: string;
  name: string;
  logo: string;
  stream: string;
  category: string;
  language: string;
}

interface Radio {
  id: string;
  name: string;
  logo: string;
  stream: string;
  category: string;
  language: string;
}

interface HomePageProps {
  channels: Channel[];
  radios: Radio[];
  favoriteTvIds: string[];
  favoriteRadioIds: string[];
  recentTvIds: string[];
  recentRadioIds: string[];
  onSelectChannel: (id: string) => void;
  onSelectRadio: (id: string) => void;
  onToggleFavoriteTv: (id: string) => void;
  onToggleFavoriteRadio: (id: string) => void;
  reducedAnimations?: boolean;
  onQuickSelect?: (target: { type: 'section' | 'category'; value: string }) => void;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: typeof Tv;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}) => (
  <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 backdrop-blur p-8 flex flex-col items-center text-center gap-3">
    <div className="h-14 w-14 rounded-full bg-muted/50 grid place-items-center">
      <Icon className="h-6 w-6 text-muted-foreground" />
    </div>
    <div>
      <p className="text-body font-semibold">{title}</p>
      <p className="text-caption text-muted-foreground mt-1 max-w-xs">{description}</p>
    </div>
    {onAction && (
      <button
        onClick={onAction}
        className="mt-1 rounded-full px-4 py-2 text-sm font-semibold gradient-primary text-primary-foreground shadow-glow"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

const HomePage = ({
  channels,
  radios,
  favoriteTvIds,
  favoriteRadioIds,
  recentTvIds,
  recentRadioIds,
  onSelectChannel,
  onSelectRadio,
  onToggleFavoriteTv,
  onToggleFavoriteRadio,
  reducedAnimations = false,
  onQuickSelect,
}: HomePageProps) => {
  const recentChannels = useMemo(
    () => recentTvIds.map((id) => channels.find((c) => c.id === id)).filter(Boolean) as Channel[],
    [recentTvIds, channels]
  );

  const recentRadios = useMemo(
    () => recentRadioIds.map((id) => radios.find((r) => r.id === id)).filter(Boolean) as Radio[],
    [recentRadioIds, radios]
  );

  const animationClass = reducedAnimations ? '' : 'animate-page-enter';

  return (
    <div className={cn('space-y-8', animationClass)}>
      {/* Category shortcuts */}
      {onQuickSelect && <QuickCategories onSelect={onQuickSelect} />}

      {/* Recently Watched */}
      <section className="space-y-3">
        {recentChannels.length > 0 ? (
          <HorizontalRail
            title="Recently Watched"
            itemWidthClass="w-[180px] sm:w-[220px] md:w-[260px]"
          >
            {recentChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                id={channel.id}
                name={channel.name}
                logo={channel.logo}
                category={channel.category}
                isFavorite={favoriteTvIds.includes(channel.id)}
                onClick={() => onSelectChannel(channel.id)}
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  onToggleFavoriteTv(channel.id);
                }}
              />
            ))}
          </HorizontalRail>
        ) : (
          <>
            <div className="flex items-center gap-2 px-1">
              <History className="h-4 w-4 text-primary" />
              <h2 className="text-h3 font-semibold">Recently Watched</h2>
            </div>
            <EmptyState
              icon={Tv}
              title="Nothing watched yet"
              description="Channels you watch will appear here for quick access."
              actionLabel="Browse Live TV"
              onAction={() => onQuickSelect?.({ type: 'section', value: 'tv' })}
            />
          </>
        )}
      </section>

      {/* Recently Played Radio */}
      <section className="space-y-3">
        {recentRadios.length > 0 ? (
          <HorizontalRail title="Recently Played Radio" itemWidthClass="w-[280px] sm:w-[320px]">
            {recentRadios.map((radio) => (
              <RadioCard
                key={radio.id}
                id={radio.id}
                name={radio.name}
                logo={radio.logo}
                category={radio.category}
                isFavorite={favoriteRadioIds.includes(radio.id)}
                onClick={() => onSelectRadio(radio.id)}
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  onToggleFavoriteRadio(radio.id);
                }}
              />
            ))}
          </HorizontalRail>
        ) : (
          <>
            <div className="flex items-center gap-2 px-1">
              <History className="h-4 w-4 text-accent" />
              <h2 className="text-h3 font-semibold">Recently Played Radio</h2>
            </div>
            <EmptyState
              icon={RadioIcon}
              title="No stations played yet"
              description="Stations you listen to will show up here."
              actionLabel="Browse Radio"
              onAction={() => onQuickSelect?.({ type: 'section', value: 'radio' })}
            />
          </>
        )}
      </section>
    </div>
  );
};

export default HomePage;
