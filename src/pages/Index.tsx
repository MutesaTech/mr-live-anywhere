import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
import OfflineFallback from '@/components/OfflineFallback';
import SocialProofPopup from '@/components/SocialProofPopup';
import ReminderToast from '@/components/ReminderToast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useLowBandwidthMode } from '@/hooks/useLowBandwidthMode';
import { useAutoResume } from '@/hooks/useAutoResume';
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
  const params = useParams();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [favoriteTvIds, setFavoriteTvIds] = useLocalStorage<string[]>('favoriteTv', []);
  const [favoriteRadioIds, setFavoriteRadioIds] = useLocalStorage<string[]>('favoriteRadio', []);
  const [lastWatchedTv, setLastWatchedTv] = useLocalStorage<string | null>('lastWatchedTv', null);
  const [lastPlayedRadio, setLastPlayedRadio] = useLocalStorage<string | null>('lastPlayedRadio', null);
  const [externalChannelId, setExternalChannelId] = useState<string | null>(null);
  const [tvCategoryFilter, setTvCategoryFilter] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();
  const { shouldReduceAnimations } = useLowBandwidthMode();
  const { saveResumeState, getResumeState } = useAutoResume();

  // Auto-resume on app load
  useEffect(() => {
    const resume = getResumeState();
    if (resume && resume.channelId) {
      if (resume.type === 'tv') {
        setExternalChannelId(resume.channelId);
        setActiveSection('tv');
      } else {
        setActiveSection('radio');
      }
    }
  }, []);

  // Deep linking: /channel/:id, /radio/:id, /live/:id, /category/:slug
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/channel/') || path.startsWith('/live/')) {
      const id = params.id;
      if (id) {
        const exists = channelsData.find((c) => c.id === id);
        if (exists) {
          setExternalChannelId(id);
          setActiveSection('tv');
          setLastWatchedTv(id);
          saveResumeState(id, 'tv');
        }
      }
    } else if (path.startsWith('/radio/')) {
      const id = params.id;
      if (id) {
        const exists = radiosData.find((r) => r.id === id);
        if (exists) {
          setActiveSection('radio');
          setLastPlayedRadio(id);
          saveResumeState(id, 'radio');
        }
      }
    } else if (path.startsWith('/category/')) {
      const slug = (params.slug || '').toLowerCase();
      if (slug) setTvCategoryFilter(slug);
      setActiveSection('tv');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, params.id, params.slug]);

  // Always use the premium default dark theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
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
    saveResumeState(id, 'tv');
  };

  const handleSelectRadio = (id: string) => {
    setActiveSection('radio');
    setLastPlayedRadio(id);
    saveResumeState(id, 'radio');
  };

  const handleQuickSelect = (target: { type: 'section' | 'category'; value: string }) => {
    if (target.type === 'section') {
      setActiveSection(target.value as Section);
      setTvCategoryFilter(null);
    } else {
      setTvCategoryFilter(target.value);
      setActiveSection('tv');
    }
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
            onQuickSelect={handleQuickSelect}
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
            initialCategory={tvCategoryFilter}
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

      <BottomNav activeSection={activeSection} onSectionChange={setActiveSection} />
      <OfflineIndicator />
      <LowBandwidthToast />
      <SocialProofPopup />
      <ReminderToast />
    </div>
  );
};

export default Index;
