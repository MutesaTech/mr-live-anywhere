import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TvPlayer from '@/components/TvPlayer';
import RadioPlayer from '@/components/RadioPlayer';
import Favorites from '@/components/Favorites';
import SearchBar from '@/components/SearchBar';
import InstallPrompt from '@/components/InstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import channelsData from '@/data/channels.json';
import radiosData from '@/data/radios.json';

const Index = () => {
  const [activeSection, setActiveSection] = useState<'tv' | 'radio' | 'favorites'>('tv');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteTvIds, setFavoriteTvIds] = useLocalStorage<string[]>('favoriteTv', []);
  const [favoriteRadioIds, setFavoriteRadioIds] = useLocalStorage<string[]>('favoriteRadio', []);
  const [lastWatchedTv, setLastWatchedTv] = useLocalStorage<string | null>('lastWatchedTv', null);
  const [lastPlayedRadio, setLastPlayedRadio] = useLocalStorage<string | null>('lastPlayedRadio', null);

  const toggleFavoriteTv = (id: string) => {
    setFavoriteTvIds(prev =>
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const toggleFavoriteRadio = (id: string) => {
    setFavoriteRadioIds(prev =>
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const filteredChannels = channelsData.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRadios = radiosData.filter(radio =>
    radio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    radio.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteChannels = channelsData.filter(channel => favoriteTvIds.includes(channel.id));
  const favoriteRadios = radiosData.filter(radio => favoriteRadioIds.includes(radio.id));

  const handleSelectChannel = (id: string) => {
    setActiveSection('tv');
    setLastWatchedTv(id);
  };

  const handleSelectRadio = (id: string) => {
    setActiveSection('radio');
    setLastPlayedRadio(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      <InstallPrompt />
      <Navbar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <div className="space-y-2 animate-fade-in">
            <h1 className="text-4xl font-bold lg:text-5xl">
              {activeSection === 'tv' && 'Live TV Channels'}
              {activeSection === 'radio' && 'Radio Stations'}
              {activeSection === 'favorites' && 'My Favorites'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {activeSection === 'tv' && 'Watch live TV from around the world'}
              {activeSection === 'radio' && 'Listen to your favorite radio stations'}
              {activeSection === 'favorites' && 'Quick access to your favorite content'}
            </p>
          </div>
          
          {activeSection !== 'favorites' && (
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${activeSection === 'tv' ? 'channels' : 'radio stations'}...`}
            />
          )}
        </div>

        <div className="animate-slide-up">
          {activeSection === 'tv' && (
            <TvPlayer
              channels={filteredChannels}
              favorites={favoriteTvIds}
              onToggleFavorite={toggleFavoriteTv}
              lastWatched={lastWatchedTv}
              onPlay={setLastWatchedTv}
            />
          )}
          
          {activeSection === 'radio' && (
            <RadioPlayer
              radios={filteredRadios}
              favorites={favoriteRadioIds}
              onToggleFavorite={toggleFavoriteRadio}
              lastPlayed={lastPlayedRadio}
              onPlay={setLastPlayedRadio}
            />
          )}
          
          {activeSection === 'favorites' && (
            <Favorites
              favoriteChannels={favoriteChannels}
              favoriteRadios={favoriteRadios}
              onSelectChannel={handleSelectChannel}
              onSelectRadio={handleSelectRadio}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
