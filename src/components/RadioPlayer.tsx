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
  Minimize2, 
  Maximize2, 
  Radio as RadioIcon, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  History,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
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
  bitrate?: number;
}

interface RadioPlayerProps {
  radios: Radio[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  lastPlayed: string | null;
  onPlay: (id: string) => void;
}

// Added design states for streaming controls
type ConnectionState = 'idle' | 'buffering' | 'connected' | 'error';
type QualityProfile = '64kbps' | '128kbps' | '320kbps';

const RadioPlayer = ({ radios, favorites, onToggleFavorite, lastPlayed, onPlay }: RadioPlayerProps) => {
  const [activeRadio, setActiveRadio] = useState<string | null>(lastPlayed);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(true);
  
  // New UI feature states
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [streamQuality, setStreamQuality] = useState<QualityProfile>('128kbps');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>(lastPlayed ? [lastPlayed] : []);
  const [trendingStations, setTrendingStations] = useState<Radio[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  // Fetch trending selections as a subset mockup
  useEffect(() => {
    if (radios.length > 0) {
      setTrendingStations(radios.slice().reverse().slice(0, 3));
    }
  }, [radios]);

  // Indexing lookup
  const currentRadioIndex = useMemo(() => {
    return radios.findIndex(r => r.id === activeRadio);
  }, [radios, activeRadio]);

  // Attach framework swipe gestures
  useSwipeGesture(playerRef, {
    onSwipeLeft: () => handleNextRadio(),
    onSwipeRight: () => handlePreviousRadio(),
  });

  // Category computation 
  const categories = useMemo(() => {
    const coreTabs = ['all', 'News', 'Music', 'Sports', 'Talk Shows', 'Jazz', 'Pop', 'Local'];
    const dynamicCats = [...new Set(radios.map(r => r.category))];
    return Array.from(new Set([...coreTabs, ...dynamicCats]));
  }, [radios]);

  // Filter processing
  const filteredRadios = useMemo(() => {
    return radios.filter(radio => {
      const matchesSearch = radio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        radio.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || radio.category.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [radios, searchQuery, activeCategory]);

  // Sync internal layout volume values
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Native hardware event monitors for buffering configurations
  useEffect(() => {
    const currentAudio = audioRef.current;
    if (!currentAudio) return;

    const onWaiting = () => setConnectionState('buffering');
    const onPlaying = () => {
      setConnectionState('connected');
      setIsPlaying(true);
    };
    const onPause = () => setIsPlaying(false);
    const onError = () => setConnectionState('error');

    currentAudio.addEventListener('waiting', onWaiting);
    currentAudio.addEventListener('playing', onPlaying);
    currentAudio.addEventListener('pause', onPause);
    currentAudio.addEventListener('error', onError);

    return () => {
      currentAudio.removeEventListener('waiting', onWaiting);
      currentAudio.removeEventListener('playing', onPlaying);
      currentAudio.removeEventListener('pause', onPause);
      currentAudio.removeEventListener('error', onError);
    };
  }, []);

  // Keyboard accessibility handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (activeRadio) handlePlayRadio(activeRadio);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRadio, isPlaying]);

  // Sleep timer interval engine
  useEffect(() => {
    if (sleepTimer === null) return;
    if (sleepTimer <= 0) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setSleepTimer(null);
      return;
    }
    const internalCounter = setInterval(() => {
      setSleepTimer(prev => (prev !== null ? prev - 1 : null));
    }, 60000);
    return () => clearInterval(internalCounter);
  }, [sleepTimer]);

  // Complete breakdown memory cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const setupAudioVisualization = () => {
    if (!audioRef.current || !canvasRef.current || audioContextRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioRef.current);
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyser.fftSize = 128; // Higher performance value footprint

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      visualize();
    } catch (err) {
      console.warn("Web Audio context initialization blocked until active interactions occur.", err);
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

      // Futuring styling gradients matching glassmorphic neon spectrums
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.05)'); 
      gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.4)');
      gradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)'); 

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        ctx.fillStyle = gradient;
        
        // Render top rounded visualizer columns
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, 4);
        ctx.fill();

        x += barWidth;
      }
    };

    draw();
  };

  const handlePlayRadio = async (radioId: string) => {
    const radio = radios.find(r => r.id === radioId);
    if (!radio || !audioRef.current) return;

    if (playerRef.current && isPlayerExpanded) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Trigger basic operational haptic feedbacks on devices that accept it
    if (navigator.vibrate) navigator.vibrate(12);

    if (activeRadio === radioId && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setConnectionState('idle');
    } else {
      try {
        setConnectionState('buffering');
        if (activeRadio !== radioId) {
          audioRef.current.src = radio.stream;
          setActiveRadio(radioId);
          onPlay(radioId);
          
          // History tracking additions
          setRecentlyPlayed(prev => [radioId, ...prev.filter(id => id !== radioId)].slice(0, 6));
        }

        await audioRef.current.play();
        setIsPlaying(true);
        setConnectionState('connected');
        
        if (!audioContextRef.current) {
          setupAudioVisualization();
        } else if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      } catch (error) {
        console.error('Playback failed:', error);
        setConnectionState('error');
        setIsPlaying(false);
      }
    }
  };

  const handleNextRadio = useCallback(() => {
    if (radios.length === 0) return;
    const nextIndex = currentRadioIndex < radios.length - 1 ? currentRadioIndex + 1 : 0;
    handlePlayRadio(radios[nextIndex].id);
  }, [currentRadioIndex, radios]);

  const handlePreviousRadio = useCallback(() => {
    if (radios.length === 0) return;
    const prevIndex = currentRadioIndex > 0 ? currentRadioIndex - 1 : radios.length - 1;
    handlePlayRadio(radios[prevIndex].id);
  }, [currentRadioIndex, radios]);

  const activeRadioData = radios.find(r => r.id === activeRadio);

  return (
    <div className="space-y-6 animate-page-enter min-h-screen bg-[#0b0c10] text-slate-100 p-2 md:p-6 select-none relative">
      
      {/* Glow decorative vector rings */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* TOP CONTAINER: Sticky frosted search hub instrumentation panel */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-3">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-1.5 border border-white/5 group focus-within:border-cyan-500/50 transition-all">
          <Search className="h-4 w-4 text-slate-400 group-focus-within:text-cyan-400" />
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search radio stations, genres, styles..."
            />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white rounded-lg">
            <Mic className="h-4 w-4" />
          </Button>
        </div>

        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* COMPACT DESKTOP SPLIT CONTAINER TRACK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPARTMENT: Directory List (7 Grid Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {searchQuery && (
            <p className="text-xs text-slate-400 font-medium px-1">
              Showing {filteredRadios.length} indexing matches for &ldquo;{searchQuery}&rdquo;
            </p>
          )}

          {/* Core Station Grid display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredRadios.map((radio) => (
              <div 
                key={radio.id} 
                className={cn(
                  "relative group transition-all duration-300 rounded-2xl border",
                  activeRadio === radio.id 
                    ? "bg-gradient-to-r from-cyan-950/30 to-purple-950/30 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                )}
              >
                {/* Embedded Active Node Pulse Rings */}
                {activeRadio === radio.id && isPlaying && (
                  <span className="absolute top-3 right-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}

                <RadioCard
                  id={radio.id}
                  name={radio.name}
                  logo={radio.logo}
                  category={radio.category}
                  isActive={activeRadio === radio.id}
                  isPlaying={activeRadio === radio.id && isPlaying}
                  isFavorite={favorites.includes(radio.id)}
                  onClick={() => handlePlayRadio(radio.id)}
                  onToggleFavorite={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(radio.id);
                  }}
                />

                {/* Micro Quality Display indicators */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none opacity-60 text-[10px] font-mono">
                  <span>{radio.bitrate || 128}K</span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-1 rounded uppercase text-[8px] font-bold tracking-widest">Live</span>
                </div>
              </div>
            ))}
          </div>

          {/* EMPTY COMPONENT CONTAINER FOR SEARCH QUERIES */}
          {filteredRadios.length === 0 && (
            <div className="backdrop-blur-md bg-white/[0.01] border border-dashed border-white/10 rounded-2xl py-16 text-center flex flex-col items-center justify-center">
              <RadioIcon className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-slate-300">No radio stations found</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">Refine your search inputs or toggle a separate music genre category filter block.</p>
            </div>
          )}

          {/* ADDITIONAL COMPONENT: Recently Tuned Carousel Track */}
          {recentlyPlayed.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-purple-400" /> Recently Tuned Stations
              </h4>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {recentlyPlayed.map((id) => {
                  const recentStation = radios.find(r => r.id === id);
                  if (!recentStation) return null;
                  return (
                    <div 
                      key={`recent-${id}`}
                      onClick={() => handlePlayRadio(id)}
                      className="flex items-center gap-3 backdrop-blur-md bg-white/[0.02] border border-white/5 hover:bg-white/[0.07] p-2 rounded-xl cursor-pointer min-w-[160px] max-w-[200px] transition-all"
                    >
                      <img src={recentStation.logo} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      <span className="text-xs font-medium truncate text-slate-200">{recentStation.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADDITIONAL COMPONENT: Trending Selection Array */}
          {trendingStations.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-cyan-400" /> Trending Broadcast Networks
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {trendingStations.map((station) => (
                  <div 
                    key={`trending-${station.id}`}
                    onClick={() => handlePlayRadio(station.id)}
                    className="backdrop-blur-md bg-gradient-to-br from-white/[0.01] to-white/[0.03] p-3 rounded-xl border border-white/5 hover:border-cyan-500/20 transition-all cursor-pointer flex items-center gap-3"
                  >
                    <img src={station.logo} alt="" className="h-9 w-9 rounded-xl object-cover" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-200 truncate">{station.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{station.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COMPARTMENT: Full Immersive Hardware Controller Hub (5 Grid Columns) */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 z-30">
          {activeRadio && activeRadioData ? (
            <div 
              ref={playerRef}
              className={cn(
                "rounded-3xl overflow-hidden backdrop-blur-2xl bg-gradient-to-b from-white/[0.07] to-black/40 border border-white/10 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)]",
                "transition-all duration-300 ease-out touch-pan-x relative",
                isPlayerExpanded ? "opacity-100 scale-100 p-6 space-y-6" : "h-0 opacity-0 overflow-hidden p-0 border-0"
              )}
            >
              {/* Dynamic glowing structural color background overlay */}
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent pointer-events-none" />

              {/* Utility Header Trackline controls */}
              <div className="flex items-center justify-between relative z-10 text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Now Broadcasting</span>
                <div className="flex items-center gap-1">
                  {/* Sleep Timer Module */}
                  <Button 
                    variant="ghost" size="icon" 
                    className={cn("h-7 w-7 rounded-lg text-slate-400", sleepTimer && "text-cyan-400 bg-cyan-500/10")}
                    onClick={() => setSleepTimer(prev => prev === null ? 15 : prev === 60 ? null : prev + 15)}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {sleepTimer && <span className="absolute -top-1 -right-1 text-[8px] bg-cyan-500 text-black px-1 rounded-full font-bold">{sleepTimer}m</span>}
                  </Button>

                  {/* Quality Stream Switcher Menu */}
                  <Button 
                    variant="ghost" className="h-7 px-2 text-[10px] font-mono text-slate-400 hover:text-white"
                    onClick={() => setStreamQuality(p => p === '128kbps' ? '320kbps' : p === '320kbps' ? '64kbps' : '128kbps')}
                  >
                    {streamQuality}
                  </Button>

                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400" onClick={() => setIsPlayerExpanded(false)}>
                    <Minimize2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Audio Visualizer Canvas Container Section */}
              <div className="relative h-44 bg-black/40 rounded-2xl overflow-hidden border border-white/5 flex flex-col justify-end">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={176}
                  className="absolute inset-0 h-full w-full pointer-events-none"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                <div className="relative z-10 p-4 text-center mx-auto space-y-2">
                  <img
                    src={activeRadioData.logo}
                    alt={activeRadioData.name}
                    className="mx-auto h-16 w-16 rounded-xl object-cover shadow-2xl border border-white/10 transform hover:scale-105 transition-transform duration-500"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">{activeRadioData.name}</h3>
                    <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                      {activeRadioData.category} &bull; {activeRadioData.language}
                    </p>
                  </div>
                </div>

                {/* Swipe Gestures Info Ribbon */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-medium tracking-widest text-slate-500/80 uppercase">
                  &larr; Swipe to flip channel &rarr;
                </div>
              </div>

              {/* BUFFERING & FAULT MANAGEMENT NOTIFICATION CONDITIONAL SWITCHES */}
              {connectionState === 'buffering' && (
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-400 flex items-center gap-2 animate-pulse">
                  <Sliders className="h-3.5 w-3.5 animate-spin" />
                  <span>Configuring stable stream buffer pipeline parameters...</span>
                </div>
              )}

              {connectionState === 'error' && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">Source connection timeout. Check stream origin link properties.</span>
                  </div>
                  <Button size="sm" onClick={() => handlePlayRadio(activeRadioData.id)} className="h-6 px-2 bg-red-500 hover:bg-red-600 text-[10px] text-white rounded-md">
                    <RefreshCw className="h-3 w-3 mr-1" /> Retry
                  </Button>
                </div>
              )}
              
              {/* Central Player Command Controls Row */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-5">
                  <Button
                    variant="ghost" size="icon"
                    className="h-10 w-10 rounded-full bg-white/[0.02] border border-white/5 text-slate-300 hover:text-white"
                    onClick={handlePreviousRadio}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="lg"
                    className={cn(
                      "h-16 w-16 rounded-full transform active:scale-95 transition-all shadow-[0_0_30px_rgba(6,182,212,0.2)]",
                      isPlaying 
                        ? "bg-gradient-to-tr from-cyan-500 to-purple-600 text-white border-transparent" 
                        : "bg-white text-slate-900 hover:bg-slate-200"
                    )}
                    onClick={() => handlePlayRadio(activeRadio)}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6 stroke-[2.5]" />
                    ) : (
                      <Play className="h-6 w-6 ml-0.5 fill-current stroke-[2.5]" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost" size="icon"
                    className="h-10 w-10 rounded-full bg-white/[0.02] border border-white/5 text-slate-300 hover:text-white"
                    onClick={handleNextRadio}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost" size="icon"
                    className="h-10 w-10 rounded-full bg-white/[0.02] border border-white/5 text-slate-300 hover:text-white"
                    onClick={() => onToggleFavorite(activeRadio)}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 transition-colors",
                        favorites.includes(activeRadio) && "fill-cyan-400 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                      )}
                    />
                  </Button>
                </div>
                
                {/* Master Volume Management Rails Slider Section */}
                <div className="space-y-1.5 max-w-xs mx-auto pt-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1"><Volume2 className="h-3 w-3" /> Monitor Volume</span>
                    <span className="font-mono">{volume}%</span>
                  </div>
                  <Slider
                    value={[volume]}
                    onValueChange={(value) => setVolume(value[0])}
                    max={100}
                    step={1}
                    className="flex-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* CONSOLE SYSTEM VACANT IDLE PANELS CARD STATE */
            <div className="backdrop-blur-xl bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 mb-4">
                <RadioIcon className="h-5 w-5 text-slate-400 animate-pulse" />
              </div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">No Stream Active</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                Select a live broadcasting node station from the catalog directory grid list to connect to its realtime audio bitstream payload.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CONTINUOUS DECK BAR: Sticky bottom mini-player utility track panel */}
      {activeRadio && activeRadioData && !isPlayerExpanded && (
        <div className="fixed bottom-4 inset-x-4 md:inset-x-8 z-50 backdrop-blur-xl bg-slate-900/80 border border-cyan-500/30 p-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4 animate-scale-in">
          <div className="flex items-center gap-3 truncate">
            <img src={activeRadioData.logo} alt="" className="h-9 w-9 rounded-xl object-cover border border-white/10 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{activeRadioData.name}</p>
              <p className="text-[10px] text-cyan-400 capitalize truncate">{activeRadioData.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button 
              size="icon" variant="ghost"
              onClick={() => handlePlayRadio(activeRadioData.id)}
              className="h-8 w-8 rounded-lg bg-white text-slate-950 hover:bg-slate-200"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current text-slate-950" /> : <Play className="h-4 w-4 fill-current text-slate-950 ml-0.5" />}
            </Button>
            <Button 
              size="icon" variant="ghost"
              onClick={() => setIsPlayerExpanded(true)}
              className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white/5"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadioPlayer;
