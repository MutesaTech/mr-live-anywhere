import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Star, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

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

      ctx.fillStyle = 'hsl(var(--card))';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        const hue = (i / bufferLength) * 60 + 250;
        ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
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
    <div className="space-y-8">
      <audio ref={audioRef} crossOrigin="anonymous" />

      {activeRadio && activeRadioData && (
        <Card className="overflow-hidden shadow-card">
          <div className="relative h-64 bg-gradient-to-br from-primary/20 to-accent/20">
            <canvas
              ref={canvasRef}
              width={800}
              height={256}
              className="h-full w-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <img
                  src={activeRadioData.logo}
                  alt={activeRadioData.name}
                  className="mx-auto mb-4 h-24 w-24 rounded-full object-cover shadow-lg"
                />
                <h3 className="mb-2 text-2xl font-bold">{activeRadioData.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {activeRadioData.category} • {activeRadioData.language}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-16 w-16 rounded-full"
                onClick={() => handlePlayRadio(activeRadio)}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
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
            
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="w-12 text-sm text-muted-foreground">{volume}%</span>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {radios.map((radio) => (
          <Card
            key={radio.id}
            className={cn(
              "group cursor-pointer shadow-card hover-lift",
              activeRadio === radio.id && "ring-2 ring-primary"
            )}
            onClick={() => handlePlayRadio(radio.id)}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={radio.logo}
                    alt={radio.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  {activeRadio === radio.id && isPlaying && (
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold line-clamp-1">{radio.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {radio.category}
                  </p>
                  {activeRadio === radio.id && isPlaying && (
                    <p className="mt-1 text-xs font-medium text-primary">Now Playing</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(radio.id);
                  }}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      favorites.includes(radio.id) && "fill-primary text-primary"
                    )}
                  />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RadioPlayer;
