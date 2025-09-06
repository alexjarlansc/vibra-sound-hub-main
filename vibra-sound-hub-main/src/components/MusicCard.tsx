import { Play, Heart, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MusicCardProps {
  // React key (não chega via props em runtime, mas adicionamos para satisfazer TS nas declarações de uso)
  key?: string | number;
  id?: string;
  title: string;
  artist: string;
  image?: string;
  colorVariant: 1 | 2 | 3 | 4 | 5 | 6;
  size?: "small" | "medium" | "large";
  onClick?: () => void;
  onPlay?: () => void;
  onLike?: () => void;
  onDownload?: () => void;
  onAddToPlaylist?: () => void;
  liked?: boolean;
  likeCount?: number;
  downloadsCount?: number;
  playsCount?: number;
  disableActions?: boolean;
}

const MusicCard = ({ title, artist, image, colorVariant, size = "medium", onClick, onPlay, onLike, onDownload, onAddToPlaylist, liked, likeCount, downloadsCount, playsCount, disableActions }: MusicCardProps) => {
  const sizeClasses = {
    small: "w-40 h-40",
    medium: "w-48 h-48", 
    large: "w-56 h-56",
  };

  const textSizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  };

  return (
  <Card onClick={onClick} className="group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10 overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 relative hover:z-20 isolate">
      <CardContent className="p-0 relative">
        <div className={`${sizeClasses[size]} relative overflow-hidden`}>
          {/* Badges topo */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 text-[10px] font-medium">
            {typeof playsCount === 'number' && <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur text-white/90">▶ {playsCount}</span>}
            {typeof downloadsCount === 'number' && <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur text-white/90">⬇ {downloadsCount}</span>}
          </div>
          {image ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              decoding="async"
              width={400}
              height={400}
              onError={(e)=>{ e.currentTarget.style.opacity='0'; e.currentTarget.parentElement?.classList.add('bg-muted'); }}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className={`w-full h-full bg-music-card-${colorVariant} flex items-center justify-center relative`}>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-black/20"></div>
              <div className="text-white text-center p-6 relative z-10">
                <h3 className={`font-bold ${textSizeClasses[size]} mb-2 leading-tight`}>{title}</h3>
                <p className={`${textSizeClasses[size]} opacity-90`}>{artist}</p>
              </div>
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
            <div className="flex space-x-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Button
                size="sm"
                disabled={disableActions}
                onClick={(e)=>{ e.stopPropagation(); onPlay?.(); }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg border-0 rounded-full w-12 h-12 p-0"
                aria-label="Tocar"
              >
                <Play className="h-5 w-5 fill-current" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={disableActions}
                onClick={(e)=>{ e.stopPropagation(); onAddToPlaylist?.(); }}
                className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
                aria-label="Adicionar à playlist"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={disableActions}
                onClick={(e)=>{ e.stopPropagation(); console.debug('[MusicCard] like button clicked', { id: (typeof (title)==='string'? title: undefined) }); onLike?.(); }}
                className={`rounded-full w-10 h-10 p-0 transition ${liked ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-inner' : 'text-white hover:bg-white/20'}`}
                aria-label="Curtir"
              >
                <div className="flex flex-col items-center justify-center leading-none">
                  <Heart className={`h-4 w-4 transition-transform ${liked ? 'scale-110' : ''}`} fill={liked ? 'currentColor' : 'none'} />
                  {typeof likeCount === 'number' && <span className="text-[10px] mt-0.5 font-medium">{likeCount}</span>}
                </div>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={disableActions}
                onClick={(e)=>{ e.stopPropagation(); onDownload?.(); }}
                className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
                aria-label="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {image && (
          <div className="p-4 bg-card/90 backdrop-blur-sm relative z-10">
            <h3 className={`font-semibold text-card-foreground ${textSizeClasses[size]} mb-1 truncate`}>
              {title}
            </h3>
            <p className={`text-muted-foreground ${textSizeClasses[size]} truncate`}>
              {artist}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MusicCard;