import { useMemo } from 'react';
import FeaturedCard from './FeaturedCard';
import ChannelCard from './ChannelCard';
import RadioCard from './RadioCard';
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
}: HomePageProps) => {
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

  return (
    <div className="space-y-8 animate-page-enter">
      {/* Featured */}
      {featuredChannel && (
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

      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2">Continue Watching</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
            {continueWatching.map((channel) => (
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
          </div>
        </section>
      )}

      {/* Radio Stations */}
      {popularRadios.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2">Radio Stations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
            {popularRadios.map((radio) => (
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
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
