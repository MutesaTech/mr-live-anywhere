import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import HomePage from '@/components/HomePage';
import TvPlayer from '@/components/TvPlayer';
import RadioPlayer from '@/components/RadioPlayer';
import CategoriesGrid from '@/components/CategoriesGrid';
import PlaylistsPage from '@/components/PlaylistsPage';
import type { PlaylistCategory, PlaylistChannelPlayable } from '@/components/PlaylistsPage';
import { PlayerProvider } from '@/components/PlayerProvider';
import Favorites from '@/components/Favorites';
import SettingsPage from '@/components/SettingsPage';
import { getCategoryTheme } from '@/lib/categoryThemes';
import SmartInstallPrompt from '@/components/SmartInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import LowBandwidthToast from '@/components/LowBandwidthToast';
import SocialProofPopup from '@/components/SocialProofPopup';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useRecents } from '@/hooks/useRecents';
import { useSleepTimer } from '@/hooks/useSleepTimer';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useLowBandwidthMode } from '@/hooks/useLowBandwidthMode';
import { useAutoResume } from '@/hooks/useAutoResume';
import { useTheme } from '@/hooks/useTheme';
import { allChannels as channelsData } from '@/lib/channelCatalog';
import { applyChannelOverrides, useChannelOverridesVersion } from '@/lib/channelOverrides';
import { sortCategoryKeys } from '@/lib/categoryThemes';
import radiosData from '@/data/radios.json';

type Section = 'home' | 'tv' | 'radio' | 'playlists' | 'favorites' | 'settings' | 'category' | 'categories';

const sectionTitles: Record<Section, string> = {
  home: 'Beemo',
  tv: 'Live TV',
  radio: 'Radio',
  playlists: 'Playlists',
  favorites: 'Favorites',
  settings: 'Settings',
  category: 'Browse',
  categories: 'Categories',
};

const Index = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [favoriteTvIds, setFavoriteTvIds] = useLocalStorage<string[]>('favoriteTv', []);
  const [favoriteRadioIds, setFavoriteRadioIds] = useLocalStorage<string[]>('favoriteRadio', []);
  const [lastWatchedTv, setLastWatchedTv] = useLocalStorage<string | null>('lastWatchedTv', null);
  const [lastPlayedRadio, setLastPlayedRadio] = useLocalStorage<string | null>('lastPlayedRadio', null);
  const [externalChannelId, setExternalChannelId] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [playlistCategory, setPlaylistCategory] = useState<PlaylistCategory>('sports');
  const [playlistChannel, setPlaylistChannel] = useState<PlaylistChannelPlayable | null>(null);
  // Re-render when a channel is renamed/deleted/reported so lists stay in sync.
  const channelOverridesVersion = useChannelOverridesVersion();
  const channels = useMemo(() => applyChannelOverrides(channelsData), [channelOverridesVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  const { isOnline } = useNetworkStatus();
  const { shouldReduceAnimations } = useLowBandwidthMode();
  const { saveResumeState, getResumeState } = useAutoResume();
  const { recentTv, recentRadio, addRecentTv, addRecentRadio } = useRecents();
  // Keep the sleep timer ticking app-wide, not only on the Settings screen
  useSleepTimer();

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

  // Deep linking: /, /channel/:id, /radio/:id, /live/:id, /category/:slug
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      // Leave a resumed session alone; otherwise return Home (e.g. browser back).
      setActiveSection((prev) => (prev === 'category' || prev === 'categories' ? 'home' : prev));
    } else if (path === '/categories') {
      setActiveSection('categories');
    } else if (path.startsWith('/channel/') || path.startsWith('/live/')) {
      const id = params.id;
      if (id) {
        const exists = channelsData.find((c) => c.id === id);
        if (exists) {
          setExternalChannelId(id);
          setActiveSection('tv');
          setLastWatchedTv(id);
          addRecentTv(id);
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
          addRecentRadio(id);
          saveResumeState(id, 'radio');
        }
      }
    } else if (path.startsWith('/playlists/')) {
      const slug = (params.slug || '').toLowerCase();
      if (slug === 'sports' || slug === 'family' || slug === 'movies') {
        setPlaylistCategory(slug);
      }
      setActiveSection('playlists');
    } else if (path.startsWith('/category/')) {
      const slug = (params.slug || '').toLowerCase();
      if (slug) {
        setCategorySlug(slug);
      }
      setActiveSection('category');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, params.id, params.slug]);

  // Light/dark theme — persisted in localStorage, applied via the `dark` class.
  useTheme();

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

  const favoriteChannels = channels.filter(channel => favoriteTvIds.includes(channel.id));
  const favoriteRadios = radiosData.filter(radio => favoriteRadioIds.includes(radio.id));

  const handleSelectChannel = (id: string) => {
    setExternalChannelId(id);
    setActiveSection('tv');
    setLastWatchedTv(id);
    addRecentTv(id);
    saveResumeState(id, 'tv');
  };

  const handleSelectRadio = (id: string) => {
    setActiveSection('radio');
    setLastPlayedRadio(id);
    addRecentRadio(id);
    saveResumeState(id, 'radio');
  };

  const handleQuickSelect = (target: { type: 'section' | 'category'; value: string }) => {
    if (target.type === 'section') {
      setActiveSection(target.value as Section);
    } else {
      handleOpenCategory(target.value);
    }
  };

  const handleOpenCategory = (slug: string) => {
    setCategorySlug(slug);
    setActiveSection('category');
    navigate(`/category/${slug}`);
  };

  const handleOpenCategories = () => {
    setActiveSection('categories');
    navigate('/categories');
  };

  const handleOpenCategoryPlaylist = (cat: PlaylistCategory) => {
    setPlaylistCategory(cat);
    setActiveSection('playlists');
    navigate(`/playlists/${cat}`);
  };

  const handlePlayPlaylistChannel = (channel: PlaylistChannelPlayable) => {
    setPlaylistChannel(channel);
    setActiveSection('tv');
  };

  const handleClosePlaylistChannel = () => {
    setPlaylistChannel(null);
    setActiveSection('playlists');
    navigate(`/playlists/${playlistCategory}`);
  };

  // Every TV category with its channel count — data-driven, ordered.
  const categorySummary = useMemo(() => {
    const counts = new Map<string, number>();
    channels.forEach((c) => {
      const key = (c.category || '').trim().toLowerCase();
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return sortCategoryKeys([...counts.keys()]).map((key) => ({
      key,
      label: getCategoryTheme(key).label,
      count: counts.get(key) ?? 0,
    }));
  }, [channels]);

  const handleExpandPlayer = (type: 'tv' | 'radio', id: string) => {
    if (type === 'tv') handleSelectChannel(id);
    else handleSelectRadio(id);
  };


  // Clear external channel + playlist stream after leaving the TV section
  useEffect(() => {
    if (activeSection !== 'tv') {
      setExternalChannelId(null);
      setPlaylistChannel(null);
    }
  }, [activeSection]);

  const headerTitle =
    activeSection === 'category'
      ? categorySlug === 'all'
        ? 'Live TV'
        : getCategoryTheme(categorySlug || '').label
      : sectionTitles[activeSection];

  return (
    <PlayerProvider activeSection={activeSection} onExpand={handleExpandPlayer}>
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      <SmartInstallPrompt />
      <LowBandwidthToast />
      
      {/* Header — hidden on the TV, Radio, Playlists, Settings, category, and categories screens, which own their top bar */}
      {activeSection !== 'tv' && activeSection !== 'radio' && activeSection !== 'playlists' && activeSection !== 'settings' && activeSection !== 'category' && activeSection !== 'categories' && (
        <Header
          title={headerTitle}
          onFavoritesClick={() => setActiveSection('favorites')}
          favoritesActive={activeSection === 'favorites'}
        />
      )}
      
      {/* Main Content */}
      {/* The TV, Radio, Playlists, Settings, category, and categories sections own the full viewport
          below the nav: the player stays pinned and only the channel/station
          list scrolls, so they must not inherit the default vertical padding
          and none of them render the top header (content starts at the top). */}
      <main className={cn(
        'container px-4',
        (activeSection === 'tv' || activeSection === 'radio' || activeSection === 'playlists' || activeSection === 'settings' || activeSection === 'category' || activeSection === 'categories') ? 'pt-0 pb-0' : 'pt-18 pb-24'
      )}>
        {activeSection === 'home' && (
          <HomePage
            channels={channels}
            radios={radiosData}
            recentTv={recentTv}
            recentRadio={recentRadio}
            onSelectChannel={handleSelectChannel}
            onSelectRadio={handleSelectRadio}
            onQuickSelect={handleQuickSelect}
            onOpenCategories={handleOpenCategories}
            onOpenCategoryPlaylist={handleOpenCategoryPlaylist}
          />
        )}

        {activeSection === 'playlists' && (
          <PlaylistsPage
            category={playlistCategory}
            onBack={() => {
              setActiveSection('home');
              navigate('/');
            }}
            onPlayChannel={handlePlayPlaylistChannel}
          />
        )}

        {activeSection === 'tv' && (
          <TvPlayer
            channels={channels}
            lastWatched={lastWatchedTv}
            onPlay={(id: string) => { setLastWatchedTv(id); addRecentTv(id); }}
            externalChannel={externalChannelId}
            externalStream={playlistChannel}
            onCloseExternal={handleClosePlaylistChannel}
          />
        )}
        
        {activeSection === 'radio' && (
          <RadioPlayer
            radios={radiosData}
            lastPlayed={lastPlayedRadio}
            onPlay={(id: string) => { setLastPlayedRadio(id); addRecentRadio(id); }}
          />
        )}

        {activeSection === 'category' && (
          /* Category links (e.g. Home → Explore Categories) open the TV page
             directly in that category's isolated view — the exact same page the
             "See All" button shows. */
          <TvPlayer
            key={categorySlug || 'all'}
            channels={channels}
            lastWatched={lastWatchedTv}
            onPlay={(id: string) => { setLastWatchedTv(id); addRecentTv(id); }}
            externalChannel={externalChannelId}
            initialExpandedCategory={categorySlug && categorySlug !== 'all' ? categorySlug : null}
          />
        )}
        
        {activeSection === 'categories' && (
          <CategoriesGrid
            categories={categorySummary}
            onBack={() => {
              setActiveSection('home');
              navigate('/');
            }}
            onOpenCategory={handleOpenCategory}
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
      <LowBandwidthToast />
      <SocialProofPopup />
    </div>
    </PlayerProvider>
  );
};

export default Index;
