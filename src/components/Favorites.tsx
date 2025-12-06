import { Star, Tv, Radio } from 'lucide-react';
import ChannelCard from './ChannelCard';
import RadioCard from './RadioCard';

interface Channel {
  id: string;
  name: string;
  logo: string;
  category: string;
}

interface RadioStation {
  id: string;
  name: string;
  logo: string;
  category: string;
}

interface FavoritesProps {
  favoriteChannels: Channel[];
  favoriteRadios: RadioStation[];
  onSelectChannel: (id: string) => void;
  onSelectRadio: (id: string) => void;
}

const Favorites = ({
  favoriteChannels,
  favoriteRadios,
  onSelectChannel,
  onSelectRadio,
}: FavoritesProps) => {
  const hasFavorites = favoriteChannels.length > 0 || favoriteRadios.length > 0;

  if (!hasFavorites) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Star className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-h2 mb-2">No Favorites Yet</h2>
        <p className="text-body text-muted-foreground max-w-xs">
          Start adding your favorite channels and radio stations by tapping the star icon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-page-enter">
      {/* Favorite TV Channels */}
      {favoriteChannels.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Tv className="h-5 w-5 text-primary" />
            <h2 className="text-h2">TV Channels</h2>
            <span className="badge-category">{favoriteChannels.length}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
            {favoriteChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                id={channel.id}
                name={channel.name}
                logo={channel.logo}
                category={channel.category}
                isFavorite={true}
                onClick={() => onSelectChannel(channel.id)}
                onToggleFavorite={(e) => e.stopPropagation()}
              />
            ))}
          </div>
        </section>
      )}

      {/* Favorite Radio Stations */}
      {favoriteRadios.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-5 w-5 text-primary" />
            <h2 className="text-h2">Radio Stations</h2>
            <span className="badge-category">{favoriteRadios.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
            {favoriteRadios.map((radio) => (
              <RadioCard
                key={radio.id}
                id={radio.id}
                name={radio.name}
                logo={radio.logo}
                category={radio.category}
                isFavorite={true}
                onClick={() => onSelectRadio(radio.id)}
                onToggleFavorite={(e) => e.stopPropagation()}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Favorites;
