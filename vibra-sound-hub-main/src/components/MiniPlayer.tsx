import { usePlayer } from '@/context/PlayerContext';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export function MiniPlayer(){
  const { current, playing, toggle, next, prev, progress, seek } = usePlayer();
  if(!current) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur border-t px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{current.title}</p>
          {current.artist && <p className="text-[11px] text-muted-foreground truncate">{current.artist}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground" aria-label="Anterior"><SkipBack className="h-4 w-4"/></button>
          <button onClick={toggle} className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow" aria-label="Play/Pause">
            {playing ? <Pause className="h-5 w-5"/> : <Play className="h-5 w-5"/>}
          </button>
          <button onClick={next} className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted/50 text-muted-foreground" aria-label="Próxima"><SkipForward className="h-4 w-4"/></button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Slider value={[progress*100]} onValueChange={(v)=> seek((v[0]||0)/100)} className="flex-1" />
      </div>
    </div>
  );
}
export default MiniPlayer;
