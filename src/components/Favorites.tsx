import { Star } from 'lucide-react';
import { Card } from './ui/card';

interface Channel {
  id: string;
  name: string;
  logo: string;
  category: string;
}

interface Radio {
  id: string;
  name: string;
  logo: string;
  category: string;
}

interface FavoritesProps {
  favoriteChannels: Channel[];
  favoriteRadios: Radio[];
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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Star className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-semibold">No Favorites Yet</h2>
          <p className="text-muted-foreground">
            Start adding your favorite channels and radio stations!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {favoriteChannels.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Favorite TV Channels</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteChannels.map((channel) => (
              <Card
                key={channel.id}
                className="group cursor-pointer shadow-card hover-lift"
                onClick={() => onSelectChannel(channel.id)}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={channel.logo}
                    alt={channel.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-1">{channel.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {channel.category}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {favoriteRadios.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Favorite Radio Stations</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteRadios.map((radio) => (
              <Card
                key={radio.id}
                className="group cursor-pointer shadow-card hover-lift"
                onClick={() => onSelectRadio(radio.id)}
              >
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={radio.logo}
                      alt={radio.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-semibold line-clamp-1">{radio.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {radio.category}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;
