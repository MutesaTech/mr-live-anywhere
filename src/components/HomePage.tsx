import { useMemo, useState, useEffect } from 'react';
import FeaturedCard from './FeaturedCard';
import ChannelCard from './ChannelCard';
import RadioCard from './RadioCard';
import SkeletonCard, { SkeletonGrid } from './SkeletonCard';
import SearchBar from './SearchBar';
import HorizontalRail from './HorizontalRail';
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
        </>
      )}
    </div>
  );
};

export default HomePage;
