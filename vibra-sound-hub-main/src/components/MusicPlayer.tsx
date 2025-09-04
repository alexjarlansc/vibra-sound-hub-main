import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Heart, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([30]);
  const [volume, setVolume] = useState([80]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Camada de blur + glass */}
  <div className="relative overflow-hidden border-t supports-[backdrop-filter]:bg-background/30 bg-background/60 supports-[backdrop-filter]:backdrop-blur-xl backdrop-blur-md border-white/10 shadow-[0_-2px_20px_-4px_rgba(0,0,0,0.25)] before:absolute before:inset-0 before:pointer-events-none before:bg-gradient-to-tr before:from-white/10 before:via-white/5 before:to-transparent after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_30%_120%,rgba(255,255,255,0.15),transparent_60%)]">
        {/* Borda interna sutil */}
        <div className="absolute inset-0 border-t border-white/5 pointer-events-none" />
        <div className="container mx-auto px-6 py-4 relative">
          <div className="flex items-center justify-between gap-4">
          {/* Current Song Info */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <div className="w-10 h-10 bg-primary-light rounded-lg"></div>
            </div>
            <div className="min-w-0">
              <h4 className="text-foreground font-semibold text-base truncate">
                Você Não Me Esqueceu
              </h4>
              <p className="text-muted-foreground text-sm truncate">Wesley Safadão</p>
            </div>
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground ml-2">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center space-y-2 flex-2 px-4 md:px-8">
            <div className="flex items-center space-x-4 md:space-x-6">
              <Button size="icon" variant="ghost" className="hidden md:inline-flex text-muted-foreground hover:text-foreground p-2 h-9 w-9">
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-foreground hover:bg-muted p-2 h-9 w-9">
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-12 h-12 md:w-12 md:h-12 rounded-full shadow-lg"
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying? 'Pausar':'Tocar'}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              <Button size="icon" variant="ghost" className="text-foreground hover:bg-muted p-2 h-9 w-9">
                <SkipForward className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="hidden md:inline-flex text-muted-foreground hover:text-foreground p-2 h-9 w-9">
                <Repeat className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3 w-full max-w-lg">
              <span className="hidden md:inline-block text-xs text-muted-foreground min-w-[2.5rem]">1:23</span>
              <Slider
                value={progress}
                onValueChange={setProgress}
                max={100}
                step={1}
                className="flex-1"
                aria-label="Progresso da faixa"
              />
              <span className="hidden md:inline-block text-xs text-muted-foreground min-w-[2.5rem]">4:31</span>
            </div>
          </div>

          {/* Volume Control & Queue */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 justify-end">
            <Button size="icon" variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground p-2 h-9 w-9" aria-label="Fila">
              <ListMusic className="h-4 w-4" />
            </Button>
            <div className="hidden lg:flex items-center space-x-2" aria-label="Controle de volume">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-20"
              />
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;