import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import HomePage from '@/components/HomePage';
import TvPlayer from '@/components/TvPlayer';
import RadioPlayer from '@/components/RadioPlayer';
import BooksPage from '@/components/BooksPage';
import ExplorePage from '@/components/ExplorePage';
import SupportPage from '@/components/SupportPage';
import SmartInstallPrompt from '@/components/SmartInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import LowBandwidthToast from '@/components/LowBandwidthToast';
import SocialProofPopup from '@/components/SocialProofPopup';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useLowBandwidthMode } from '@/hooks/useLowBandwidthMode';
import { useAutoResume } from '@/hooks/useAutoResume';
import channelsData from '@/data/channels.json';
import radiosData from '@/data/radios.json';

type Section = 'home' | 'books' | 'explore' | 'support';

const sectionTitles: Record<Section, string> = {
  home: 'Beemo',
  books: 'Books',
  explore: 'Explore',
  support: 'Help & Support',
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
  const [externalRadioId, setExternalRadioId] = useState<string | null>(null);
  const [homeSearch, setHomeSearch] = useState('');
  const [homeFilter, setHomeFilter] = useState<'all' | 'tv' | 'radio'>('all');
  const [homeKey, setHomeKey] = useState(0);
  const { isOnline } = useNetworkStatus();
  const { shouldReduceAnimations } = useLowBandwidthMode();
  const { saveResumeState, getResumeState } = useAutoResume();

  // Auto-resume on app load
  useEffect(() => {
    const resume = getResumeState();
    if (resume && resume.channelId) {
      setActiveSection('home');
      if (resume.type === 'tv') {
        setExternalChannelId(resume.channelId);
      } else {
        setExternalRadioId(resume.channelId);
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
          setActiveSection('home');
          setLastWatchedTv(id);
          saveResumeState(id, 'tv');
        }
      }
    } else if (path.startsWith('/radio/')) {
      const id = params.id;
      if (id) {
        const exists = radiosData.find((r) => r.id === id);
        if (exists) {
          setExternalRadioId(id);
          setActiveSection('home');
          setLastPlayedRadio(id);
          saveResumeState(id, 'radio');
        }
      }
    } else if (path.startsWith('/category/')) {
      const slug = (params.slug || '').toLowerCase();
      if (slug) {
        setHomeSearch(slug);
        setHomeKey((k) => k + 1);
      }
      setActiveSection('home');
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

  const handleSelectChannel = (id: string) => {
    setExternalChannelId(id);
    setActiveSection('home');
    setLastWatchedTv(id);
    saveResumeState(id, 'tv');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectRadio = (id: string) => {
    setExternalRadioId(id);
    setActiveSection('home');
    setLastPlayedRadio(id);
    saveResumeState(id, 'radio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreCategory = (category: string, kind: 'tv' | 'radio') => {
    setHomeSearch(category);
    setHomeFilter(kind);
    setHomeKey((k) => k + 1);
    setActiveSection('home');
  };

  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      <SmartInstallPrompt />
      <LowBandwidthToast />
      
      {/* Header */}
      <Header title={sectionTitles[activeSection]} />
      
      {/* Main Content */}
      <main className="container px-4 pt-18 pb-24">
        {/* Players stay mounted so playback survives tab switches */}
        <div className={activeSection === 'home' ? 'space-y-6' : 'hidden'}>
          {externalChannelId && (
            <TvPlayer
              playerOnly
              channels={channelsData}
              favorites={favoriteTvIds}
              onToggleFavorite={toggleFavoriteTv}
              lastWatched={lastWatchedTv}
              onPlay={setLastWatchedTv}
              externalChannel={externalChannelId}
            />
          )}

          {externalRadioId && (
            <RadioPlayer
              playerOnly
              radios={radiosData}
              favorites={favoriteRadioIds}
              onToggleFavorite={toggleFavoriteRadio}
              lastPlayed={lastPlayedRadio}
              externalRadio={externalRadioId}
              onPlay={setLastPlayedRadio}
            />
          )}

          <HomePage
            key={homeKey}
            channels={channelsData}
            radios={radiosData}
            favoriteTvIds={favoriteTvIds}
            favoriteRadioIds={favoriteRadioIds}
            lastWatchedTv={lastWatchedTv}
            lastPlayedRadio={lastPlayedRadio}
            activeChannelId={externalChannelId}
            activeRadioId={externalRadioId}
            onSelectChannel={handleSelectChannel}
            onSelectRadio={handleSelectRadio}
            onToggleFavoriteTv={toggleFavoriteTv}
            onToggleFavoriteRadio={toggleFavoriteRadio}
            reducedAnimations={shouldReduceAnimations}
            initialSearch={homeSearch}
            initialFilter={homeFilter}
          />
        </div>

        {activeSection === 'books' && <BooksPage />}

        {activeSection === 'explore' && (
          <ExplorePage
            channels={channelsData}
            radios={radiosData}
            onSelectCategory={handleExploreCategory}
            onOpenBooks={() => setActiveSection('books')}
          />
        )}

        {activeSection === 'support' && <SupportPage />}
      </main>

      <BottomNav activeSection={activeSection} onSectionChange={setActiveSection} />
      <SocialProofPopup />
    </div>
  );
};

export default Index;
