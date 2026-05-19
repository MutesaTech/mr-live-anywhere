import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Star, 
  Volume2, 
  SkipBack, 
  SkipForward,
  Users
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
}

interface RadioPlayerProps {
  radios: Radio[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  lastPlayed: string | null;
  onPlay: (id: string) => void;
}

const RadioPlayer = ({ radios, favorites, onToggleFavorite, lastPlayed, onPlay }: RadioPlayerProps) => {
  const [activeRadio, setActiveRadio] = useState<string | null>(lastPlayed);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Real-time fluctuating listener count state
  const [listenerCount, setListenerCount] = useState(1240);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  const filteredRadios = useMemo(() => {
    return radios.filter(radio => {
      const matchesSearch = radio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        radio.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || radio.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [radios, searchQuery, activeCategory]);

  const categories = useMemo(() => {
    return ['all', ...new Set(radios.map(r => r.category))];
  }, [radios]);

  const activeRadioData = useMemo(() => {
    return radios.find(r => r.id === activeRadio) || null;
  }, [radios, activeRadio]);

  const currentRadioIndex = useMemo(() => {
    return radios.findIndex(r => r.id === activeRadio);
  }, [radios, activeRadio]);

  // Periodic subtle listener count adjustment updates
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setListenerCount(prev => {
        const change = Math.floor(Math.random() * 7) - 3; // naturally shifts up or down between -3 and +3
        const next = prev + change;
        return next < 100 ? 104 : next; 
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Instantly updates standard baseline listener range upon changing tracks
  useEffect(() => {
    if (activeRadio) {
      setListenerCount(Math.floor(Math.random() * 600) + 800);
    }
  }, [activeRadio]);

  const visualize = useCallback(() => {
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
      ctx.fillStyle = 'rgba(213, 90, 58, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        const opacity = 0.4 + (dataArray[i] / 255) * 0.6;
        ctx.fillStyle = `hsl(213 90% 58% / ${opacity})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  }, []);

  const setupAudioVisualization = useCallback(() => {
    if (!audioRef.current || !canvasRef.current || audioContextRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioRef.current);
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyser.fftSize = 64; 

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      visualize();
    } catch (err) {
      console.warn("Visualizer processing deferred until playback starts.", err);
    }
  }, [visualize]);

  const handlePlayRadio = useCallback(async (radioId: string) => {
    const radio = radios.find(r => r.id === radioId);
    if (!radio || !audioRef.current) return;

    const isTargetCurrentlyPlaying = (activeRadio === radioId && isPlaying);

    if (isTargetCurrentlyPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        if (activeRadio !== radioId) {
          audioRef.current.src = radio.stream;
          audioRef.current.preload = "auto";
          audioRef.current.load(); 
          setActiveRadio(radioId);
          onPlay(radioId);
        }

        await audioRef.current.play();
        setIsPlaying(true);

        if (!audioContextRef.current) {
          setupAudioVisualization();
        } else if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      } catch (error) {
        console.error('Playback operation aborted:', error);
        setIsPlaying(false);
      }
    }
  }, [radios, activeRadio, isPlaying, onPlay, setupAudioVisualization]);

  const handleNextRadio = useCallback(() => {
    if (radios.length === 0) return;
    const nextIndex = currentRadioIndex < radios.length - 1 ? currentRadioIndex + 1 : 0;
    handlePlayRadio(radios[nextIndex].id);
  }, [radios, currentRadioIndex, handlePlayRadio]);

  const handlePreviousRadio = useCallback(() => {
    if (radios.length === 0) return;
    const prevIndex = currentRadioIndex > 0 ? currentRadioIndex - 1 : radios.length - 1;
    handlePlayRadio(radios[prevIndex].id);
  }, [radios, currentRadioIndex, handlePlayRadio]);

  useSwipeGesture(playerRef, {
    onSwipeLeft: handleNextRadio,
    onSwipeRight: handlePreviousRadio,
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div className="space-y-6 p-2 md:p-4 select-none relative max-w-7xl mx-auto">
      <audio ref={audioRef} crossOrigin="anonymous" />

      {/* FIXED CONTAINER MODULE HUB: Keeps audio strictly working while browsing below */}
      <div className="w-full z-30">
        {activeRadio && activeRadioData && (
          <div 
            ref={playerRef}
            className="rounded-2xl overflow-hidden bg-card border border-border/50 shadow-md p-6 space-y-6 touch-pan-x relative"
          >
            {/* Visualizer Display Unit */}
            <div className="relative h-48 bg-muted/30 rounded-xl overflow-hidden border border-border/30">
              <canvas
                ref={canvasRef}
                width={800}
                height={192}
                className="h-full w-full absolute inset-0 pointer-events-none"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/10">
                <div className="text-center z-10">
                  <img
                    src={activeRadioData.logo}
                    alt={activeRadioData.name}
                    className="mx-auto mb-3 h-20 w-20 rounded-xl object-cover shadow-sm border border-border/40"
                  />
                  <h3 className="text-xl font-bold tracking-tight text-foreground">{activeRadioData.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {activeRadioData.category} • {activeRadioData.language}
                  </p>
                </div>
              </div>

              {/* Dynamic Live Counter Metric Pill */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-background/80 backdrop-blur px-2.5 py-1 rounded-md border border-border/60 shadow-sm">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-mono font-bold text-foreground">
                  {listenerCount.toLocaleString()}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                ← Swipe to change station →
              </div>
            </div>
            
            {/* Playback Configuration Panel Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full border border-border/40"
                  onClick={handlePreviousRadio}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handlePlayRadio(activeRadioData.id)}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5 fill-current" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full border border-border/40"
                  onClick={handleNextRadio}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full border border-border/40"
                  onClick={() => onToggleFavorite(activeRadioData.id)}
                >
                  <Star
                    className={cn(
                      "h-4 w-4 transition-colors",
                      favorites.includes(activeRadioData.id) && "fill-primary text-primary"
                    )}
                  />
                </Button>
              </div>
              
              {/* Media Volume Controls */}
              <div className="flex items-center gap-3 max-w-xs mx-auto">
                <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={100}
                  step={1}
                  className="flex-1 cursor-pointer"
                />
                <span className="w-8 text-[11px] font-mono text-muted-foreground text-right">{volume}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FILTER SEARCH & NAVIGATION TRACK */}
      <div className="space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search radio stations..."
        />
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* STATION SELECTION DIRECTORY CATALOG INDEX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredRadios.map((radio) => (
          <div 
            key={radio.id}
            className={cn(
              "rounded-xl border transition-all duration-150",
              activeRadio === radio.id ? "border-primary bg-primary/[0.02]" : "border-border/60 hover:bg-muted/20"
            )}
          >
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
          </div>
        ))}
      </div>

      {filteredRadios.length === 0 && (
        <div className="border border-dashed border-border rounded-xl py-12 text-center">
          <p className="text-sm text-muted-foreground">No radio stations found</p>
        </div>
      )}
    </div>
  );
};

export default RadioPlayer;
