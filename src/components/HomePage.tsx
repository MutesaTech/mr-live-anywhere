import { useMemo, useState, useEffect } from 'react';
import FeaturedCard from './FeaturedCard';
import ChannelCard from './ChannelCard';
import RadioCard from './RadioCard';
import SkeletonCard, { SkeletonGrid } from './SkeletonCard';
import SearchBar from './SearchBar';
import HorizontalRail from './HorizontalRail';
import { cn } from '@/lib/utils';

interface Media {
  id: string;
  name: string;
  logo: string;
  stream: string;
  category: string;
  language: string;
}

type Filter = 'all' | 'tv' | 'radio';

interface HomePageProps {
  channels: Media[];
  radios: Media[];
  favoriteTvIds: string[];
  favoriteRadioIds: string[];
  lastWatchedTv: string | null;
  lastPlayedRadio: string | null;
  activeChannelId?: string | null;
  activeRadioId?: string | null;
  onSelectChannel: (id: string) => void;
  onSelectRadio: (id: string) => void;
  onToggleFavoriteTv: (id: string) => void;
  onToggleFavoriteRadio: (id: string) => void;
  reducedAnimations?: boolean;
}

const CHANNEL_WIDTH = 'w-[180px] sm:w-[220px] md:w-[240px]';
const RADIO_WIDTH = 'w-[280px] sm:w-[320px]';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tv', label: 'Live TV' },
  { id: 'radio', label: 'Radio' },
];

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const HomePage = ({
  channels,
  radios,
  favoriteTvIds,
  favoriteRadioIds,
  lastWatchedTv,
  lastPlayedRadio,
  activeChannelId,
  activeRadioId,
  onSelectChannel,
  onSelectRadio,
  onToggleFavoriteTv,
  onToggleFavoriteRadio,
  reducedAnimations = false,
}: HomePageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const showTv = filter !== 'radio';
  const showRadio = filter !== 'tv';

  const featuredChannel = useMemo(() => {
    if (lastWatchedTv) return channels.find((c) => c.id === lastWatchedTv) || channels[0];
    return channels[0];
  }, [channels, lastWatchedTv]);

  const recentlyWatched = useMemo(() => {
    const ids = [lastWatchedTv, ...favoriteTvIds].filter(Boolean) as string[];
    const unique = [...new Set(ids)];
    return unique.map((id) => channels.find((c) => c.id === id)).filter(Boolean) as Media[];
  }, [channels, favoriteTvIds, lastWatchedTv]);

  const recentRadios = useMemo(() => {
    const ids = [lastPlayedRadio, ...favoriteRadioIds].filter(Boolean) as string[];
    const unique = [...new Set(ids)];
    return unique.map((id) => radios.find((r) => r.id === id)).filter(Boolean) as Media[];
  }, [radios, favoriteRadioIds, lastPlayedRadio]);

  const byCategory = (list: Media[], category: string) =>
    list.filter((m) => m.category.toLowerCase() === category);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { tv: [] as Media[], radio: [] as Media[] };
    const match = (m: Media) =>
      m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    return {
      tv: showTv ? channels.filter(match) : [],
      radio: showRadio ? radios.filter(match) : [],
    };
  }, [channels, radios, searchQuery, showTv, showRadio]);

  const otherCategories = useMemo(() => {
    const excluded = new Set(['news', 'sports']);
    const groups: { category: string; items: Media[] }[] = [];
    channels.forEach((c) => {
      if (excluded.has(c.category.toLowerCase())) return;
      const g = groups.find((x) => x.category === c.category);
      if (g) g.items.push(c);
      else groups.push({ category: c.category, items: [c] });
    });
    return groups;
  }, [channels]);

  const renderChannels = (items: Media[], keyPrefix: string) =>
    items.map((channel) => (
      <ChannelCard
        key={`${keyPrefix}-${channel.id}`}
        id={channel.id}
        name={channel.name}
        logo={channel.logo}
        category={channel.category}
        isActive={activeChannelId === channel.id}
        isPlaying={activeChannelId === channel.id}
        isFavorite={favoriteTvIds.includes(channel.id)}
        onClick={() => onSelectChannel(channel.id)}
        onToggleFavorite={(e) => {
          e.stopPropagation();
          onToggleFavoriteTv(channel.id);
        }}
      />
    ));

  const renderRadios = (items: Media[], keyPrefix: string) =>
    items.map((radio) => (
      <RadioCard
        key={`${keyPrefix}-${radio.id}`}
        id={radio.id}
        name={radio.name}
        logo={radio.logo}
        category={radio.category}
        isActive={activeRadioId === radio.id}
        isFavorite={favoriteRadioIds.includes(radio.id)}
        onClick={() => onSelectRadio(radio.id)}
        onToggleFavorite={(e) => {
          e.stopPropagation();
          onToggleFavoriteRadio(radio.id);
        }}
      />
    ));

  const animationClass = reducedAnimations ? '' : 'animate-page-enter';

  return (
    <div className={cn('space-y-6', animationClass)}>
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search live TV & radio..."
      />

      {/* Top-level view filters — instant switching, no reload */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              filter === f.id
                ? 'gradient-primary text-primary-foreground border-white/15 shadow-glow'
                : 'bg-secondary/70 text-secondary-foreground border-white/5 hover:bg-secondary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <>
          <SkeletonCard variant="featured" />
          <SkeletonGrid count={4} variant="channel" />
          <SkeletonGrid count={2} variant="radio" />
        </>
      ) : searchQuery ? (
        <>
          {searchResults.tv.length > 0 && (
            <HorizontalRail title="TV Results" itemWidthClass={CHANNEL_WIDTH}>
              {renderChannels(searchResults.tv, 'search-tv')}
            </HorizontalRail>
          )}
          {searchResults.radio.length > 0 && (
            <HorizontalRail title="Radio Results" itemWidthClass={RADIO_WIDTH}>
              {renderRadios(searchResults.radio, 'search-radio')}
            </HorizontalRail>
          )}
          {searchResults.tv.length === 0 && searchResults.radio.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Nothing matched your search</p>
          )}
        </>
      ) : (
        <>
          {/* Featured Streams */}
          {showTv && featuredChannel && (
            <section className="space-y-3">
              <h2 className="text-h3 font-semibold px-1">Featured Streams</h2>
              <FeaturedCard
                id={featuredChannel.id}
                name={featuredChannel.name}
                logo={featuredChannel.logo}
                category={featuredChannel.category}
                isFavorite={favoriteTvIds.includes(featuredChannel.id)}
                onClick={() => onSelectChannel(featuredChannel.id)}
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  onToggleFavoriteTv(featuredChannel.id);
                }}
              />
            </section>
          )}

          {/* Recently watched */}
          {showTv && recentlyWatched.length > 0 && (
            <HorizontalRail title="Recently Watched" itemWidthClass={CHANNEL_WIDTH}>
              {renderChannels(recentlyWatched, 'recent')}
            </HorizontalRail>
          )}
          {showRadio && recentRadios.length > 0 && (
            <HorizontalRail title="Recently Played Radio" itemWidthClass={RADIO_WIDTH}>
              {renderRadios(recentRadios, 'recent-radio')}
            </HorizontalRail>
          )}

          {/* Trending TV */}
          {showTv && channels.length > 0 && (
            <section className="border-t border-border/40 pt-6">
              <HorizontalRail title="Trending TV" itemWidthClass={CHANNEL_WIDTH}>
                {renderChannels(channels.slice(0, 12), 'trending')}
              </HorizontalRail>
            </section>
          )}

          {/* Radio Stations */}
          {showRadio && radios.length > 0 && (
            <section className="border-t border-border/40 pt-6">
              <HorizontalRail title="Radio Stations" itemWidthClass={RADIO_WIDTH}>
                {renderRadios(radios, 'radio-all')}
              </HorizontalRail>
            </section>
          )}

          {/* News */}
          {showTv && byCategory(channels, 'news').length > 0 && (
            <section className="border-t border-border/40 pt-6">
              <HorizontalRail title="News" itemWidthClass={CHANNEL_WIDTH}>
                {renderChannels(byCategory(channels, 'news'), 'news')}
              </HorizontalRail>
            </section>
          )}

          {/* Sports */}
          {showTv && byCategory(channels, 'sports').length > 0 && (
            <section className="border-t border-border/40 pt-6">
              <HorizontalRail title="Sports" itemWidthClass={CHANNEL_WIDTH}>
                {renderChannels(byCategory(channels, 'sports'), 'sports')}
              </HorizontalRail>
            </section>
          )}

          {/* Remaining TV categories */}
          {showTv &&
            otherCategories.map((group) => (
              <section key={group.category} className="border-t border-border/40 pt-6">
                <HorizontalRail title={titleCase(group.category)} itemWidthClass={CHANNEL_WIDTH}>
                  {renderChannels(group.items, group.category)}
                </HorizontalRail>
              </section>
            ))}
        </>
      )}
    </div>
  );
};

export default HomePage;
