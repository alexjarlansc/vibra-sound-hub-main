import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Heart, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState([30]);
  const [volume, setVolume] = useState([80]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border/50 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
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
          <div className="flex flex-col items-center space-y-3 flex-2 px-8">
            <div className="flex items-center space-x-6">
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground p-2">
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-foreground hover:bg-muted p-2">
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-12 h-12 rounded-full shadow-lg"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
              <Button size="sm" variant="ghost" className="text-foreground hover:bg-muted p-2">
                <SkipForward className="h-5 w-5" />
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground p-2">
                <Repeat className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center space-x-3 w-full max-w-lg">
              <span className="text-xs text-muted-foreground min-w-[2.5rem]">1:23</span>
              <Slider
                value={progress}
                onValueChange={setProgress}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground min-w-[2.5rem]">4:31</span>
            </div>
          </div>

          {/* Volume Control & Queue */}
          <div className="flex items-center space-x-4 min-w-0 flex-1 justify-end">
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground p-2">
              <ListMusic className="h-4 w-4" />
            </Button>
            <div className="hidden lg:flex items-center space-x-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;