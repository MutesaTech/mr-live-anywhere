import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import HomePage from '@/components/HomePage';
import TvPlayer from '@/components/TvPlayer';
import RadioPlayer from '@/components/RadioPlayer';
import Favorites from '@/components/Favorites';
import SettingsPage from '@/components/SettingsPage';
import SmartInstallPrompt from '@/components/SmartInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import LowBandwidthToast from '@/components/LowBandwidthToast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import channelsData from '@/data/channels.json';
import radiosData from '@/data/radios.json';

type Section = 'home' | 'tv' | 'radio' | 'favorites' | 'settings';

const sectionTitles: Record<Section, string> = {
  home: 'MR LIVE',
  tv: 'Live TV',
  radio: 'Radio',
  favorites: 'Favorites',
  settings: 'Settings',
};

const Index = () => {
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [favoriteTvIds, setFavoriteTvIds] = useLocalStorage<string[]>('favoriteTv', []);
  const [favoriteRadioIds, setFavoriteRadioIds] = useLocalStorage<string[]>('favoriteRadio', []);
  const [lastWatchedTv, setLastWatchedTv] = useLocalStorage<string | null>('lastWatchedTv', null);
  const [lastPlayedRadio, setLastPlayedRadio] = useLocalStorage<string | null>('lastPlayedRadio', null);
  const [externalChannelId, setExternalChannelId] = useState<string | null>(null);

  // Apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemDark);
    }
  }, []);

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

  const favoriteChannels = channelsData.filter(channel => favoriteTvIds.includes(channel.id));
  const favoriteRadios = radiosData.filter(radio => favoriteRadioIds.includes(radio.id));

  const handleSelectChannel = (id: string) => {
    setExternalChannelId(id);
    setActiveSection('tv');
    setLastWatchedTv(id);
  };

  const handleSelectRadio = (id: string) => {
    setActiveSection('radio');
    setLastPlayedRadio(id);
  };

  // Clear external channel after navigation
  useEffect(() => {
    if (activeSection !== 'tv') {
      setExternalChannelId(null);
    }
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      <SmartInstallPrompt />
      <LowBandwidthToast />
      
      {/* Header */}
      <Header title={sectionTitles[activeSection]} />
      
      {/* Main Content */}
      <main className="container px-4 pt-18 pb-24">
        {activeSection === 'home' && (
          <HomePage
            channels={channelsData}
            radios={radiosData}
            favoriteTvIds={favoriteTvIds}
            favoriteRadioIds={favoriteRadioIds}
            lastWatchedTv={lastWatchedTv}
            onSelectChannel={handleSelectChannel}
            onSelectRadio={handleSelectRadio}
            onToggleFavoriteTv={toggleFavoriteTv}
            onToggleFavoriteRadio={toggleFavoriteRadio}
          />
        )}

        {activeSection === 'tv' && (
          <TvPlayer
            channels={channelsData}
            favorites={favoriteTvIds}
            onToggleFavorite={toggleFavoriteTv}
            lastWatched={lastWatchedTv}
            onPlay={setLastWatchedTv}
            externalChannel={externalChannelId}
          />
        )}
        
        {activeSection === 'radio' && (
          <RadioPlayer
            radios={radiosData}
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

        {activeSection === 'settings' && (
          <SettingsPage />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeSection={activeSection} onSectionChange={setActiveSection} />
    </div>
  );
};

export default Index;
