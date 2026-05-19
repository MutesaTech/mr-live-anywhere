import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Star, 
  Volume2, 
  SkipBack, 
  SkipForward, 
  Search, 
  Mic, 
  Radio as RadioIcon, 
  Maximize2, 
  Minimize2, 
  Zap, 
  Clock, 
  RotateCcw, 
  AlertTriangle,
  Flame,
  History,
  Compass,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

// Enhanced Data Architectures
interface Radio {
  id: string;
  name: string;
  logo: string;
  stream: string;
  category: string;
  language: string;
  bitrate?: number;
  trending?: boolean;
}

interface RadioPlayerProps {
  radios: Radio[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  lastPlayed: string | null;
  onPlay: (id: string) => void;
}

type PlaybackState = 'idle' | 'loading' | 'playing' | 'error';
type StreamQuality = 'low' | 'standard' | 'high';

export const RadioPlayer = ({ radios, favorites, onToggleFavorite, lastPlayed, onPlay }: RadioPlayerProps) => {
  // Navigation & View Layout states
  const [activeRadio, setActiveRadio] = useState<string | null>(lastPlayed);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [volume, setVolume] = useState(80);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(true);
  const [quality, setQuality] = useState<StreamQuality>('high');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null); // values in minutes

  // Analytics & History states
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>(() => {
    return lastPlayed ? [lastPlayed] : [];
  });

  // Native Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  // Global Context Index references
  const currentRadioIndex = useMemo(() => {
    return radios.findIndex(r => r.id === activeRadio);
  }, [radios, activeRadio]);

  const activeRadioData = useMemo(() => {
    return radios.find(r => r.id === activeRadio) || null;
  }, [radios, activeRadio]);

  // Handle Swipe Gestures
  useSwipeGesture(playerRef, {
    onSwipeLeft: () => handleNextRadio(),
    onSwipeRight: () => handlePreviousRadio(),
  });

  // Extract Master Category collection
  const categories = useMemo(() => {
    return ['all', 'News', 'Music', 'Sports', 'Talk Shows', 'Jazz', 'Pop', 'Local', ...new Set(radios.map(r => r.category))];
  }, [radios]);

  // Compound Filter System (Search + Tab Selection)
  const filteredRadios = useMemo(() => {
    return radios.filter(radio => {
      const matchesSearch = radio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        radio.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || radio.category.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [radios, searchQuery, activeCategory]);

  // Trending & Recommendation Computation matrices
  const trendingStations = useMemo(() => radios.filter(r => r.trending), [radios]);
  const recommendedStations = useMemo(() => {
    if (!activeRadioData) return radios.slice(0, 3);
    return radios.filter(r => r.category === activeRadioData.category && r.id !== activeRadio).slice(0, 3);
  }, [radios, activeRadioData, activeRadio]);

  // Synchronize system audio engine attributes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Audio Event Hooks (Connection tracking)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => setPlaybackState('loading');
    const handlePlaying = () => setPlaybackState('playing');
    const handlePause = () => setPlaybackState(audio.seeking ? 'loading' : 'idle');
    const handleError = () => setPlaybackState('error');

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('waiting', handleLoadStart);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('waiting', handleLoadStart);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Sleep Timer countdown engine
  useEffect(() => {
    if (sleepTimer === null) return;
    if (sleepTimer <= 0) {
      if (audioRef.current) audioRef.current.pause();
      setPlaybackState('idle');
      setSleepTimer(null);
      return;
    }

    const timer = setTimeout(() => {
      setSleepTimer(prev => (prev !== null ? prev - 1 : null));
    }, 60000);

    return () => clearTimeout(timer);
  }, [sleepTimer]);

  // Unmount Garbage Collection
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // High Fidelity FFT Frequency Web Audio Visualizer API Setup
  const setupAudioVisualization = () => {
    if (!audioRef.current || !canvasRef.current) return;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioRef.current);
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyser.fftSize = 128; // Optimized precision arrays

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      visualize();
    } catch (e) {
      console.warn("AudioContext setup locked/interrupted by cross-origin policies:", e);
    }
  };

  const visualize = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 1.8;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.75;

        // Custom Neon Gradient arrays matching player styling rules
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, 'rgba(147, 51, 234, 0.2)'); // Violet Neon
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.6)'); // Cyan/Blue
        gradient.addColorStop(1, 'rgba(6, 182, 212, 1)'); // Hot Neon highlight

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };

    draw();
  };

  // Stream Player Manager Execution Framework
  const handlePlayRadio = async (radioId: string) => {
    const radio = radios.find(r => r.id === radioId);
    if (!radio || !audioRef.current) return;

    // Fast-append to Recents tracking arrays
    setRecentlyPlayed(prev => [radioId, ...prev.filter(id => id !== radioId)].slice(0, 5));

    if (activeRadio === radioId && playbackState === 'playing') {
      audioRef.current.pause();
      setPlaybackState('idle');
    } else {
      if (activeRadio !== radioId) {
        audioRef.current.src = radio.stream;
        setActiveRadio(radioId);
        onPlay(radioId);
      }

      try {
        setPlaybackState('loading');
        await audioRef.current.play();
        setPlaybackState('playing');
        
        // Haptic execution feedback profile
        if (navigator.vibrate) navigator.vibrate(10);

        if (!audioContextRef.current) {
          setupAudioVisualization();
        }
      } catch (error) {
        console.error('Playback failed:', error);
        setPlaybackState('error');
      }
    }
  };

  const handleNextRadio = useCallback(() => {
    if (radios.length === 0) return;
    const nextIdx = currentRadioIndex < radios.length - 1 ? currentRadioIndex + 1 : 0;
    handlePlayRadio(radios[nextIdx].id);
  }, [currentRadioIndex, radios]);

  const handlePreviousRadio = useCallback(() => {
    if (radios.length === 0) return;
    const prevIdx = currentRadioIndex > 0 ? currentRadioIndex - 1 : radios.length - 1;
    handlePlayRadio(radios[prevIdx].id);
  }, [currentRadioIndex, radios]);

  // Global Event Binding Context for keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // Prevent interface locks when searching
      if (e.code === 'Space') {
        e.preventDefault();
        if (activeRadio) handlePlayRadio(activeRadio);
      } else if (e.code === 'ArrowRight') {
        handleNextRadio();
      } else if (e.code === 'ArrowLeft') {
        handlePreviousRadio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRadio, handleNextRadio, handlePreviousRadio]);

  return (
    <div className="min-h-screen bg-[#09090e] bg-radial-gradient text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      <audio ref={audioRef} crossOrigin="anonymous" />
      
      {/* BACKGROUND GLOWS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* TOP SECTION: Glassmorphism Search Hub */}
        <header className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] p-4 rounded-3xl shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-3 bg-black/30 rounded-2xl px-4 py-3 border border-white/[0.05] shadow-inner group transition-all focus-within:border-cyan-500/50 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stations, categories, frequencies, genres..."
              className="bg-transparent flex-1 outline-none text-sm font-medium placeholder:text-slate-500"
              aria-label="Search radio stations"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-purple-400 rounded-xl hover:bg-white/5">
              <Mic className="h-4 w-4" />
            </Button>
          </div>

          {/* Horizontal Custom Category Scrolling Track */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold capitalize tracking-wide transition-all duration-300 whitespace-nowrap snap-center border",
                  activeCategory === cat 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white shadow-[0_4px_12px_rgba(147,51,234,0.3)] scale-[1.02]" 
                    : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* MAIN LAYOUT: Pro Dashboard Config */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: Stations Hub Grid (7 Cols) */}
          <section className="lg:col-span-7 space-y-6 order-2 lg:order-1">
            
            {/* SEARCH / RESULTS OVERVIEW CONDITIONALS */}
            {searchQuery && (
              <div className="flex items-center justify-between px-2">
                <span className="text-sm text-slate-400 font-medium">
                  Found <span className="text-cyan-400 font-bold">{filteredRadios.length}</span> results for &ldquo;{searchQuery}&rdquo;
                </span>
                <Button variant="link" onClick={() => setSearchQuery('')} className="text-xs text-purple-400 p-0 h-auto">Clear Search</Button>
              </div>
            )}

            {/* Standard Primary Station Roster List */}
            <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1 scrollbar-thin">
              <AnimatePresence mode="popLayout">
                {filteredRadios.map((radio) => {
                  const isCurrent = activeRadio === radio.id;
                  return (
                    <motion.div
                      layout
                      key={radio.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handlePlayRadio(radio.id)}
                      className={cn(
                        "backdrop-blur-md p-3 rounded-2xl flex items-center justify-between cursor-pointer border group transition-all duration-300 select-none",
                        isCurrent 
                          ? "bg-gradient-to-r from-purple-950/40 to-blue-950/40 border-purple-500/40 shadow-[inset_0_1px_20px_rgba(147,51,234,0.15)]" 
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {/* Artwork Cover Module */}
                        <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex-shrink-0">
                          <img src={radio.logo} alt={radio.name} className="h-full w-full object-cover" />
                          {isCurrent && playbackState === 'playing' && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                              <span className="flex gap-0.5 items-end h-4">
                                <span className="w-0.5 bg-cyan-400 rounded-full animate-[bounce_1s_infinite_100ms] h-full" />
                                <span className="w-0.5 bg-purple-400 rounded-full animate-[bounce_1s_infinite_300ms] h-3" />
                                <span className="w-0.5 bg-cyan-400 rounded-full animate-[bounce_1s_infinite_200ms] h-4" />
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm tracking-wide text-slate-100 group-hover:text-white transition-colors">{radio.name}</h4>
                            <span className="bg-red-500/10 text-red-400 font-black text-[9px] px-1.5 py-0.5 rounded-md tracking-widest border border-red-500/20 uppercase animate-pulse">Live</span>
                          </div>
                          <p className="text-xs text-slate-400 capitalize mt-0.5">{radio.category} &bull; <span className="text-slate-500">{radio.language}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Bitrate Badge Metadata */}
                        <span className="text-[10px] font-mono bg-white/5 border border-white/5 text-slate-400 px-2 py-1 rounded-lg">
                          {radio.bitrate || 192}kbps
                        </span>
                        
                        {/* Favorite Heart/Star Trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(radio.id);
                          }}
                          className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/10 border border-white/[0.05] transition-colors group/star"
                          aria-label="Toggle Station Favorite Selection State"
                        >
                          <Star className={cn("h-4 w-4 transition-transform group-hover/star:scale-110", 
                            favorites.includes(radio.id) ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-slate-400")} 
                          />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* EMPTY ROSTER CONTEXTUAL VIEW MODULE */}
              {filteredRadios.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="backdrop-blur-md bg-white/[0.01] border border-dashed border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center"
                >
                  <RadioIcon className="h-12 w-12 text-slate-600 stroke-[1.5] mb-4 animate-pulse" />
                  <h5 className="text-base font-semibold text-slate-300">No Radio Stations Discovered</h5>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">Try altering your structural search queries or select a completely different category matrix tab up above.</p>
                </motion.div>
              )}
            </div>

            {/* EXPANDED CAROUSELS: Recently Played Hub */}
            {recentlyPlayed.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 px-1 text-xs font-bold text-slate-400 tracking-wider uppercase">
                  <History className="h-3.5 w-3.5 text-purple-400" />
                  <span>Recently Tuned Channels</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {recentlyPlayed.map(id => {
                    const rData = radios.find(r => r.id === id);
                    if (!rData) return null;
                    return (
                      <div 
                        key={`recent-${id}`} 
                        onClick={() => handlePlayRadio(id)}
                        className="p-2.5 rounded-xl backdrop-blur-sm bg-white/[0.01] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer flex items-center gap-2.5 overflow-hidden group"
                      >
                        <img src={rData.logo} alt="" className="h-7 w-7 rounded-lg object-cover flex-shrink-0" />
                        <span className="text-xs font-medium truncate text-slate-300 group-hover:text-white transition-colors">{rData.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TRENDING SECTIONS HUB */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 px-1 text-xs font-bold text-slate-400 tracking-wider uppercase">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span>Trending Broadcasts Network</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trendingStations.slice(0, 2).map(r => (
                  <div 
                    key={`trending-${r.id}`}
                    onClick={() => handlePlayRadio(r.id)}
                    className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/5 to-purple-500/5 border border-orange-500/10 hover:border-orange-500/20 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <img src={r.logo} alt="" className="h-9 w-9 rounded-xl object-cover" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-orange-400 transition-colors">{r.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{r.category}</p>
                      </div>
                    </div>
                    <Zap className="h-3.5 w-3.5 text-orange-400 fill-orange-400/20 flex-shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </div>

          </section>

          {/* RIGHT PANEL: Immersive Console Engine (5 Cols) */}
          <section className="lg:col-span-5 order-1 lg:order-2 sticky top-6">
            <AnimatePresence mode="wait">
              {isPlayerExpanded && activeRadioData ? (
                <motion.div
                  key="full-player"
                  ref={playerRef}
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                  className="backdrop-blur-2xl bg-gradient-to-b from-white/[0.05] to-black/40 border border-white/[0.08] rounded-[24px] shadow-3xl p-6 overflow-hidden relative group/player"
                >
                  {/* Dynamic Glowing Halo Core Layer */}
                  <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/20 blur-[80px] rounded-full pointer-events-none group-hover/player:bg-purple-500/20 transition-colors duration-700" />

                  {/* Header Utility Controllers */}
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/5">
                      <span className={cn("w-1.5 h-1.5 rounded-full", playbackState === 'playing' ? "bg-emerald-400 animate-pulse" : "bg-zinc-500")} />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        {playbackState === 'playing' ? 'Now Streamed' : playbackState === 'loading' ? 'Connecting' : playbackState === 'error' ? 'Fault Line' : 'Paused'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Sleep Timer Indicator */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSleepTimer(prev => prev === null ? 15 : prev === 45 ? null : prev + 15)}
                        className={cn("h-8 w-8 rounded-xl transition-all", sleepTimer ? "text-cyan-400 bg-cyan-500/10" : "text-slate-400 hover:bg-white/5")}
                        title="Configure Auto Sleep Countdown System"
                      >
                        <Clock className="h-4 w-4" />
                        {sleepTimer && <span className="absolute -top-1 -right-1 text-[8px] bg-cyan-500 px-1 rounded-full font-black text-black">{sleepTimer}m</span>}
                      </Button>

                      {/* Quality Stream Switcher Engine */}
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setQuality(p => p === 'high' ? 'standard' : p === 'standard' ? 'low' : 'high')}
                        className="h-8 w-8 rounded-xl text-slate-400 hover:bg-white/5 text-[10px] font-mono font-bold"
                        title="Toggle Bitrate Delivery Profiles"
                      >
                        {quality === 'high' ? 'HQ' : quality === 'standard' ? 'SQ' : 'LQ'}
                      </Button>

                      {/* Collapse trigger */}
                      <Button 
                        variant="ghost" size="icon" 
                        onClick={() => setIsPlayerExpanded(false)}
                        className="h-8 w-8 rounded-xl text-slate-400 hover:bg-white/5"
                      >
                        <Minimize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Core Main Station Visualizer Frame Canvas Container Frame Box */}
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-black/40 border border-white/5 mb-6 flex flex-col justify-end">
                    
                    {/* Visualizer Frame Canvas layer */}
                    <canvas ref={canvasRef} width={400} height={176} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d13] via-transparent to-transparent" />

                    {/* Central Image Display Grid Panel */}
                    <div className="relative z-10 p-4 flex items-center gap-4">
                      <div className="h-16 w-16 rounded-xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 bg-slate-900 group-hover/player:scale-105 transition-transform duration-500">
                        <img src={activeRadioData.logo} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="truncate">
                        <h3 className="font-bold text-lg text-white tracking-wide truncate">{activeRadioData.name}</h3>
                        <p className="text-xs text-cyan-400/90 font-medium capitalize flex items-center gap-1.5 mt-0.5">
                          <span>{activeRadioData.category}</span>
                          <span className="text-slate-600">&bull;</span>
                          <span className="text-slate-400 font-normal">{activeRadioData.language}</span>
                        </p>
                      </div>
                    </div>

                    {/* Swipe Hint Trackline */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/40 px-3 py-1 rounded-full text-[9px] text-slate-400/70 border border-white/[0.03] select-none tracking-wider whitespace-nowrap">
                      &larr; SWIPE PANEL TO FLIP TRACKS &rarr;
                    </div>
                  </div>

                  {/* LOADING & ERROR DECORATOR SWITCHES */}
                  {playbackState === 'loading' && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400 flex items-center gap-2 mb-4 animate-pulse">
                      <Sliders className="h-4 w-4 animate-spin" />
                      <span>Optimizing content stream buffer pipeline cache structures...</span>
                    </div>
                  )}

                  {playbackState === 'error' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2 truncate">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Station broadcast stream offline or blocked by client CORS.</span>
                      </div>
                      <Button size="sm" onClick={() => handlePlayRadio(activeRadioData.id)} className="h-7 px-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-[10px]">
                        <RotateCcw className="h-3 w-3 mr-1" /> Retry
                      </Button>
                    </div>
                  )}

                  {/* Central Control Dashboard Board Matrix Deck */}
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-center gap-6">
                      <Button
                        variant="ghost" size="icon"
                        className="h-11 w-11 rounded-full bg-white/[0.02] border border-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                        onClick={handlePreviousRadio}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="lg"
                        className={cn(
                          "h-20 w-20 rounded-full transition-all duration-300 transform active:scale-95 shadow-2xl border flex items-center justify-center",
                          playbackState === 'playing' 
                            ? "bg-gradient-to-tr from-purple-600 to-indigo-600 border-purple-400/30 text-white shadow-purple-500/20 drop-shadow-[0_0_20px_rgba(147,51,234,0.3)]" 
                            : "bg-white text-slate-950 hover:bg-slate-100 border-white shadow-white/10"
                        )}
                        onClick={() => handlePlayRadio(activeRadioData.id)}
                        aria-label={playbackState === 'playing' ? "Pause Broadcast Audio Stream" : "Initiate Live Station Stream Connection"}
                      >
                        {playbackState === 'playing' ? (
                          <Pause className="h-8 w-8 stroke-[2.5]" />
                        ) : (
                          <Play className="h-8 w-8 fill-current ml-1 stroke-[2.5]" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost" size="icon"
                        className="h-11 w-11 rounded-full bg-white/[0.02] border border-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                        onClick={handleNextRadio}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Master Volume Management Slider Deck Layer */}
                    <div className="space-y-2 max-w-sm mx-auto bg-black/20 p-3 rounded-2xl border border-white/[0.03]">
                      <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-slate-400 px-1">
                        <span className="flex items-center gap-1.5"><Volume2 className="h-3.5 w-3.5 text-cyan-400" /> Output Volume</span>
                        <span className="font-mono text-slate-300">{volume}%</span>
                      </div>
                      <Slider
                        value={[volume]}
                        onValueChange={(val) => setVolume(val[0])}
                        max={100}
                        step={1}
                        className="py-2 cursor-pointer"
                      />
                    </div>

                    {/* Contextual Sub recommendations element list box */}
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-1"><Compass className="h-3 w-3" /> Selected Channels in Category</p>
                      <div className="flex flex-col gap-1.5">
                        {recommendedStations.map(rec => (
                          <div 
                            key={`rec-${rec.id}`}
                            onClick={() => handlePlayRadio(rec.id)}
                            className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 text-xs transition-colors cursor-pointer group/rec"
                          >
                            <span className="text-slate-300 group-hover/rec:text-white transition-colors truncate">{rec.name}</span>
                            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/10 capitalize shrink-0">{rec.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : activeRadioData ? (
                
                /* COLLAPSED STICKY MINI PLAYER DECK STATE */
                <motion.div
                  key="mini-player"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-6 left-6 right-6 lg:absolute lg:bottom-auto lg:left-auto lg:right-auto lg:top-0 lg:w-full backdrop-blur-2xl bg-slate-950/80 border border-cyan-500/30 p-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center justify-between gap-4 z-50 animate-bounce-in"
                >
                  <div className="flex items-center gap-3 truncate">
                    <img src={activeRadioData.logo} alt="" className="h-10 w-10 rounded-xl object-cover border border-white/10 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{activeRadioData.name}</p>
                      <p className="text-[10px] text-cyan-400 capitalize truncate">{activeRadioData.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="icon" variant="ghost"
                      onClick={() => handlePlayRadio(activeRadioData.id)}
                      className="h-9 w-9 rounded-xl bg-white text-slate-950 hover:bg-slate-200"
                    >
                      {playbackState === 'playing' ? <Pause className="h-4 w-4 fill-current text-slate-950" /> : <Play className="h-4 w-4 fill-current text-slate-950 ml-0.5" />}
                    </Button>
                    <Button 
                      size="icon" variant="ghost"
                      onClick={() => setIsPlayerExpanded(true)}
                      className="h-9 w-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                
                /* EMPTY / IDLE STATE CONSOLE PANEL */
                <motion.div
                  key="empty-player"
                  className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] border-dashed rounded-[24px] p-12 text-center flex flex-col items-center justify-center min-h-[340px]"
                >
                  <div className="h-14 w-14 bg-gradient-to-tr from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center border border-purple-500/20 shadow-inner mb-4">
                    <RadioIcon className="h-6 w-6 text-purple-400 animate-pulse" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300 tracking-wide uppercase">No Active Selection</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
                    Choose a station from the terminal directory grid on the left to initiate real-time audio bitstream virtualization.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </main>
      </div>
    </div>
  );
};

export default RadioPlayer;
