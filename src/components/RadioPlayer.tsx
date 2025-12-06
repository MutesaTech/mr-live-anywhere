import { useEffect, useRef, useState, useMemo } from 'react';
import { Play, Pause, Star, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import RadioCard from './RadioCard';
import CategoryTabs from './CategoryTabs';
import SearchBar from './SearchBar';

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(radios.map(r => r.category))];
    return cats;
  }, [radios]);

  // Filter radios
  const filteredRadios = useMemo(() => {
    return radios.filter(radio => {
      const matchesSearch = radio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        radio.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || radio.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [radios, searchQuery, activeCategory]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const setupAudioVisualization = () => {
    if (!audioRef.current || !canvasRef.current) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioRef.current);
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 256;

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    visualize();
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

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'hsl(213 90% 58% / 0.1)');
      gradient.addColorStop(1, 'hsl(213 90% 58% / 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Use primary color with varying opacity
        const opacity = 0.4 + (dataArray[i] / 255) * 0.6;
        ctx.fillStyle = `hsl(213 90% 58% / ${opacity})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const handlePlayRadio = async (radioId: string) => {
    const radio = radios.find(r => r.id === radioId);
    if (!radio || !audioRef.current) return;

    if (activeRadio === radioId && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (activeRadio !== radioId) {
        audioRef.current.src = radio.stream;
        setActiveRadio(radioId);
        onPlay(radioId);
      }

      try {
        await audioRef.current.play();
        setIsPlaying(true);
        
        if (!audioContextRef.current) {
          setupAudioVisualization();
        }
      } catch (error) {
        console.error('Playback failed:', error);
      }
    }
  };

  const activeRadioData = radios.find(r => r.id === activeRadio);

  return (
    <div className="space-y-6 animate-page-enter">
      <audio ref={audioRef} crossOrigin="anonymous" />

      {/* Full Player */}
      {activeRadio && activeRadioData && (
        <div className="rounded-2xl overflow-hidden bg-card border border-border/50 shadow-strong animate-scale-in">
          {/* Visualizer */}
          <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/10 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={192}
              className="h-full w-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <img
                  src={activeRadioData.logo}
                  alt={activeRadioData.name}
                  className="mx-auto mb-3 h-20 w-20 rounded-2xl object-cover shadow-strong border-2 border-background/50"
                />
                <h3 className="text-h2 font-bold">{activeRadioData.name}</h3>
                <p className="text-caption text-muted-foreground capitalize mt-1">
                  {activeRadioData.category} • {activeRadioData.language}
                </p>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-16 w-16 rounded-full shadow-glow"
                onClick={() => handlePlayRadio(activeRadio)}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => onToggleFavorite(activeRadio)}
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    favorites.includes(activeRadio) && "fill-primary text-primary"
                  )}
                />
              </Button>
            </div>
            
            {/* Volume */}
            <div className="flex items-center gap-3 max-w-xs mx-auto">
              <Volume2 className="h-5 w-5 text-muted-foreground shrink-0" />
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="w-10 text-caption text-muted-foreground text-right">{volume}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Categories */}
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

      {/* Radio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
        {filteredRadios.map((radio) => (
          <RadioCard
            key={radio.id}
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
        ))}
      </div>

      {/* Empty state */}
      {filteredRadios.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No radio stations found</p>
        </div>
      )}
    </div>
  );
};

export default RadioPlayer;
