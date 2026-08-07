import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Play, Pause, Heart, Menu, Grid3x3, SkipBack, SkipForward } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import RadioCard from './RadioCard';
import CategoryTabs from './CategoryTabs';
import SearchBar from './SearchBar';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface Radio {
  id: string;
  name: string;
  logo: string;
  stream: string;
  category: string;
  language: string;
  frequency?: string;
}

interface RadioPlayerProps {
  radios: Radio[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  lastPlayed: string | null;
  onPlay: (id: string) => void;
  externalRadio?: string | null;
  /** Render only the player — station browsing lives on the Home page. */
  playerOnly?: boolean;
}

const EQ_BARS = 28;

const RadioPlayer = ({ radios, favorites, onToggleFavorite, lastPlayed, onPlay, externalRadio, playerOnly = false }: RadioPlayerProps) => {
  const [activeRadio, setActiveRadio] = useState<string | null>(lastPlayed);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const filteredRadios = useMemo(() => radios.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = activeCategory === 'all' || r.category === activeCategory;
    return matchSearch && matchCat;
  }), [radios, searchQuery, activeCategory]);

  const categories = useMemo(() => ['all', ...new Set(radios.map(r => r.category))], [radios]);
  const activeRadioData = useMemo(() => radios.find(r => r.id === activeRadio) || null, [radios, activeRadio]);
  const currentIndex = useMemo(() => radios.findIndex(r => r.id === activeRadio), [radios, activeRadio]);

  // Deterministic frequency derived from id (visual only)
  const frequencyDisplay = useMemo(() => {
    if (!activeRadioData) return '94.3';
    if (activeRadioData.frequency) return activeRadioData.frequency;
    const seed = Array.from(activeRadioData.id).reduce((a, c) => a + c.charCodeAt(0), 0);
    const freq = 87.5 + (seed % 220) / 10; // 87.5 - 109.5
    return freq.toFixed(1);
  }, [activeRadioData]);

  const handlePlayRadio = useCallback(async (id: string) => {
    const radio = radios.find(r => r.id === id);
    if (!radio || !audioRef.current) return;
    if (activeRadio === id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    try {
      if (activeRadio !== id) {
        audioRef.current.src = radio.stream;
        audioRef.current.load();
        setActiveRadio(id);
        onPlay(id);
      }
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (e) {
      console.error('Radio playback failed', e);
      setIsPlaying(false);
    }
  }, [radios, activeRadio, isPlaying, onPlay]);

  // MediaSession metadata for lockscreen / notification controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !activeRadioData) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeRadioData.name,
        artist: activeRadioData.category,
        album: 'Beemo Radio',
        artwork: [{ src: activeRadioData.logo, sizes: '512x512', type: 'image/png' }],
      });
      navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play().catch(() => {}));
      navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    } catch {}
  }, [activeRadioData]);

  const handleNext = useCallback(() => {
    if (!radios.length) return;
    const next = currentIndex < radios.length - 1 ? currentIndex + 1 : 0;
    handlePlayRadio(radios[next].id);
  }, [radios, currentIndex, handlePlayRadio]);
  const handlePrev = useCallback(() => {
    if (!radios.length) return;
    const prev = currentIndex > 0 ? currentIndex - 1 : radios.length - 1;
    handlePlayRadio(radios[prev].id);
  }, [radios, currentIndex, handlePlayRadio]);

  useSwipeGesture(playerRef, { onSwipeLeft: handleNext, onSwipeRight: handlePrev });

  // React to a station picked elsewhere (Home page / deep link)
  useEffect(() => {
    if (externalRadio && externalRadio !== activeRadio) {
      handlePlayRadio(externalRadio);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalRadio]);

  return (
    <div className={cn('select-none -mx-4', playerOnly ? 'space-y-0' : 'space-y-6')}>
      <audio ref={audioRef} />

      {/* ===== Premium Futuristic Player ===== */}
      <div className="relative overflow-hidden radio-bg rounded-3xl mx-4 px-5 pt-5 pb-8 sm:pt-8 sm:pb-10 shadow-strong border border-white/5">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />

        {/* Top nav */}
        <div className="relative flex items-center justify-between text-white">
          <button className="h-10 w-10 grid place-items-center rounded-full hover:bg-white/10 transition-colors" aria-label="Menu">
            <Menu className="h-5 w-5 drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]" />
          </button>
          <div className="text-xs font-bold tracking-[0.35em] text-white/90 drop-shadow-[0_0_10px_rgba(0,245,255,0.55)]">RADIO</div>
          <button className="h-10 w-10 grid place-items-center rounded-full hover:bg-white/10 transition-colors" aria-label="Menu">
            <Grid3x3 className="h-5 w-5 drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]" />
          </button>
        </div>

        {/* Circular frequency display */}
        <div ref={playerRef} className="relative mt-8 flex justify-center touch-pan-x">
          <div className="relative animate-float-soft">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300/30 via-blue-500/20 to-transparent blur-2xl" />
            {/* Disc */}
            <div className={cn(
              "relative h-56 w-56 sm:h-64 sm:w-64 rounded-full",
              "bg-gradient-to-br from-cyan-200/40 via-cyan-500/10 to-blue-900/40",
              "backdrop-blur-xl border border-cyan-300/40",
              "flex items-center justify-center",
              isPlaying ? "animate-neon-pulse" : "shadow-[0_0_36px_rgba(0,245,255,0.45),inset_0_0_24px_rgba(0,245,255,0.25)]"
            )}>
              {/* Inner ring */}
              <div className="absolute inset-4 rounded-full border border-white/15" />
              <div className="absolute inset-8 rounded-full border border-cyan-200/20" />
              {/* Frequency */}
              <div className="relative text-center">
                <div className="text-[64px] sm:text-[72px] leading-none font-extrabold tracking-tight text-[#021B79] drop-shadow-[0_2px_0_rgba(255,255,255,0.4)]" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
                  {frequencyDisplay}
                </div>
                <div className="mt-1 text-[10px] font-bold tracking-[0.4em] text-[#021B79]/70">MHZ</div>
              </div>
            </div>
          </div>
        </div>

        {/* Station name */}
        <div className="relative mt-6 text-center">
          <h2 className="text-white text-xl sm:text-2xl font-extrabold tracking-[0.25em] uppercase drop-shadow-[0_0_18px_rgba(0,245,255,0.55)]">
            {activeRadioData?.name || 'Select a Station'}
          </h2>
          {activeRadioData && (
            <p className="text-white/50 text-[11px] mt-1 uppercase tracking-[0.3em]">
              {activeRadioData.category} • {activeRadioData.language}
            </p>
          )}
        </div>

        {/* Equalizer card */}
        <div className="relative mt-6 mx-auto max-w-md">
          <div className="rounded-2xl border border-white/10 bg-[#021B79]/50 backdrop-blur-xl px-4 py-4 shadow-[inset_0_0_24px_rgba(0,153,255,0.15)]">
            <div className="flex items-end justify-center gap-1.5 h-16">
              {Array.from({ length: EQ_BARS }).map((_, i) => {
                const isCenter = i === Math.floor(EQ_BARS / 2);
                const delay = `${(i * 60) % 900}ms`;
                const height = 24 + ((i * 13) % 28); // 24-52px base
                return (
                  <span
                    key={i}
                    className={cn('eq-bar', isCenter && 'eq-bar--red')}
                    style={{
                      height: `${height}px`,
                      animationDelay: delay,
                      animationPlayState: isPlaying ? 'running' : 'paused',
                      opacity: isPlaying ? 1 : 0.45,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Playback controls */}
        <div className="relative mt-7 flex items-center justify-center gap-6">
          <button
            onClick={() => activeRadioData && onToggleFavorite(activeRadioData.id)}
            disabled={!activeRadioData}
            className="h-12 w-12 grid place-items-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white hover:bg-white/10 transition-all hover:scale-105 disabled:opacity-40"
            aria-label="Favorite"
          >
            <Heart className={cn('h-5 w-5 drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]', activeRadioData && favorites.includes(activeRadioData.id) && 'fill-[#FF3B5C] text-[#FF3B5C]')} />
          </button>

          <button
            onClick={handlePrev}
            className="h-11 w-11 grid place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Previous"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          {/* Primary play */}
          <button
            onClick={() => activeRadioData ? handlePlayRadio(activeRadioData.id) : radios[0] && handlePlayRadio(radios[0].id)}
            className={cn(
              "relative h-20 w-20 rounded-full grid place-items-center",
              "bg-gradient-to-br from-[#0099FF] to-[#021B79]",
              "border-2 border-cyan-300/60",
              "shadow-[0_0_36px_rgba(0,245,255,0.65),inset_0_0_20px_rgba(0,0,0,0.4)]",
              "transition-transform active:scale-95 hover:scale-105"
            )}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
            ) : (
              <Play className="h-8 w-8 text-white ml-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" fill="currentColor" />
            )}
          </button>

          <button
            onClick={handleNext}
            className="h-11 w-11 grid place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Next"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search & categories */}
      {!playerOnly && (
        <div className="px-4 space-y-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search radio stations..." />
          <CategoryTabs categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        </div>
      )}

      {/* Station list */}
      <div className={cn('px-4 grid grid-cols-1 sm:grid-cols-2 gap-3', playerOnly && 'hidden')}>
        {filteredRadios.map((radio) => (
          <div key={radio.id} className={cn(
            'rounded-xl border transition-all duration-150',
            activeRadio === radio.id ? 'border-primary bg-primary/[0.05]' : 'border-border/60 hover:bg-muted/20'
          )}>
            <RadioCard
              id={radio.id}
              name={radio.name}
              logo={radio.logo}
              category={radio.category}
              isActive={activeRadio === radio.id}
              isPlaying={activeRadio === radio.id && isPlaying}
              isFavorite={favorites.includes(radio.id)}
              onClick={() => handlePlayRadio(radio.id)}
              onToggleFavorite={(e) => { e.stopPropagation(); onToggleFavorite(radio.id); }}
            />
          </div>
        ))}
      </div>

      {!playerOnly && filteredRadios.length === 0 && (
        <div className="mx-4 border border-dashed border-border rounded-xl py-12 text-center">
          <p className="text-sm text-muted-foreground">No radio stations found</p>
        </div>
      )}
    </div>
  );
};

export default RadioPlayer;