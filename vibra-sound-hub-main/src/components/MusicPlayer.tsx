import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayer } from '@/context/PlayerContext';
import { useCallback } from 'react';

const MusicPlayer = () => {
  const { current, playing, toggle, next, prev, progress, duration, seek, volume, setVolume, queue } = usePlayer();

  const pct = progress * 100;
  const handleSeek = useCallback((vals:number[])=>{ const v = vals[0]; seek(v/100); }, [seek]);
  const handleVolume = useCallback((vals:number[])=>{ const v = vals[0]; setVolume(v/100); }, [setVolume]);
  const volPct = Math.round(volume*100);

  if(!current) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Camada de blur + glass */}
  <div className="relative border-t bg-background/85 backdrop-blur-md border-white/10 shadow-[0_-2px_14px_-4px_rgba(0,0,0,0.25)]">
        <div className="container mx-auto px-6 py-4 relative">
          <div className="flex items-center justify-between gap-4">
          {/* Current Song Info */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="min-w-0">
              <h4 className="text-foreground font-semibold text-base truncate">
                {current?.title || 'Sem título'}
              </h4>
              <p className="text-muted-foreground text-sm truncate">{current?.artist || 'Desconhecido'}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground ml-2">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Player Controls simplificados */}
          <div className="flex flex-col items-center space-y-1 flex-2 px-4 md:px-6">
            <div className="flex items-center space-x-4 md:space-x-5">
              <Button size="icon" variant="ghost" className="text-foreground hover:bg-muted p-2 h-9 w-9" onClick={prev} disabled={!queue.length} aria-label="Anterior">
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="w-11 h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                onClick={toggle}
                aria-label={playing? 'Pausar':'Tocar'}
              >
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>
              <Button size="icon" variant="ghost" className="text-foreground hover:bg-muted p-2 h-9 w-9" onClick={next} disabled={!queue.length} aria-label="Próxima">
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3 w-full max-w-lg">
              <span className="hidden md:inline-block text-xs text-muted-foreground min-w-[2.5rem]">1:23</span>
              <Slider value={[pct]} onValueChange={handleSeek} max={100} step={1} className="flex-1" aria-label="Progresso da faixa" />
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
              <Slider value={[volPct]} onValueChange={handleVolume} max={100} step={1} className="w-20" />
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;