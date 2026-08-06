import { useMemo, useState, useEffect } from 'react';
import FeaturedCard from './FeaturedCard';
import ChannelCard from './ChannelCard';
import RadioCard from './RadioCard';
import SkeletonCard, { SkeletonGrid } from './SkeletonCard';
import SearchBar from './SearchBar';
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
  lastWatchedTv: string | null;
  onSelectChannel: (id: string) => void;
  onSelectRadio: (id: string) => void;
  onToggleFavoriteTv: (id: string) => void;
  onToggleFavoriteRadio: (id: string) => void;
  reducedAnimations?: boolean;
  onQuickSelect?: (target: { type: 'section' | 'category'; value: string }) => void;
}

const HomePage = ({
  channels,
  radios,
  favoriteTvIds,
  favoriteRadioIds,
  lastWatchedTv,
  onSelectChannel,
  onSelectRadio,
  onToggleFavoriteTv,
  onToggleFavoriteRadio,
  reducedAnimations = false,
  onQuickSelect,
}: HomePageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulate initial load for skeleton
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Featured channel (random or last watched)
  const featuredChannel = useMemo(() => {
    if (lastWatchedTv) {
      return channels.find(c => c.id === lastWatchedTv) || channels[0];
    }
    return channels[Math.floor(Math.random() * Math.min(channels.length, 5))];
  }, [channels, lastWatchedTv]);

  // Continue watching (favorites or recent)
  const continueWatching = useMemo(() => {
    const favorites = channels.filter(c => favoriteTvIds.includes(c.id));
    return favorites.length > 0 ? favorites.slice(0, 4) : channels.slice(0, 4);
  }, [channels, favoriteTvIds]);

  // Popular radios
  const popularRadios = useMemo(() => {
    return radios.slice(0, 4);
  }, [radios]);

  // Instant search filter
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return continueWatching;
    const query = searchQuery.toLowerCase();
    return channels.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.category.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [channels, continueWatching, searchQuery]);

  const filteredRadios = useMemo(() => {
    if (!searchQuery.trim()) return popularRadios;
    const query = searchQuery.toLowerCase();
    return radios.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.category.toLowerCase().includes(query)
    ).slice(0, 4);
  }, [radios, popularRadios, searchQuery]);

  // Explicit per-category rows
  const categoryRows = useMemo(() => {
    const groups: { category: string; items: Channel[] }[] = [];
    channels.forEach((c) => {
      const g = groups.find((x) => x.category === c.category);
      if (g) g.items.push(c);
      else groups.push({ category: c.category, items: [c] });
    });
    return groups;
  }, [channels]);

  const animationClass = reducedAnimations ? '' : 'animate-page-enter';

  return (
    <div className={cn("space-y-6", animationClass)}>
      {/* Super Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search channels & radios..."
        className="mb-4"
      />

      {!searchQuery && onQuickSelect && (
        <QuickCategories onSelect={onQuickSelect} />
      )}

      {/* Loading skeletons */}
      {isLoading ? (
        <>
          <SkeletonCard variant="featured" />
          <SkeletonGrid count={4} variant="channel" />
          <SkeletonGrid count={2} variant="radio" />
        </>
      ) : (
        <>
          {/* Featured */}
          {featuredChannel && !searchQuery && (
            <section>
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

          {/* Channels */}
          {filteredChannels.length > 0 && (
            <HorizontalRail
              title={searchQuery ? 'Search Results' : 'Continue Watching'}
              itemWidthClass="w-[180px] sm:w-[220px] md:w-[260px]"
            >
              {filteredChannels.map((channel) => (
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
          )}

          {/* Radio Stations */}
          {filteredRadios.length > 0 && (
            <HorizontalRail
              title="Radio Stations"
              itemWidthClass="w-[280px] sm:w-[320px]"
            >
              {filteredRadios.map((radio) => (
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
          )}

          {/* Category rows — each category gets its own clearly separated horizontal row */}
          {!searchQuery && (
            <div className="space-y-10 pt-2">
              {categoryRows.map((group) => (
                <section
                  key={group.category}
                  className="border-t border-border/40 pt-6"
                >
                  <HorizontalRail
                    title={group.category.charAt(0).toUpperCase() + group.category.slice(1)}
                    itemWidthClass="w-[180px] sm:w-[220px] md:w-[240px]"
                  >
                    {group.items.map((channel) => (
                      <ChannelCard
                        key={`${group.category}-${channel.id}`}
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
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
