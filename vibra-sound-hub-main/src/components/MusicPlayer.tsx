import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, ListMusic, X, Repeat, Plus, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayer } from '@/context/PlayerContext';
import { useCallback, useMemo, useState } from 'react';
import { useTrackFavorites } from '@/hooks/useTrackFavorites';
import { usePlaylists } from '@/hooks/usePlaylists';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button as UIButton } from '@/components/ui/button';

// util simples para formatar tempo mm:ss
function fmt(sec: number){
  if(!isFinite(sec) || sec <= 0) return '0:00';
  const m = Math.floor(sec/60); const s = Math.floor(sec%60); return m+':' + String(s).padStart(2,'0');
}

const MusicPlayer = () => {
  const { current, playing, toggle, next, prev, progress, duration, seek, volume, setVolume, queue, clear, buffered, coverUrl, addToQueue, loop, toggleLoop } = usePlayer();
  const { isLiked, toggleTrackLike, data: likedData, counts } = useTrackFavorites();
  const { data: playlists, loading: loadingPlaylists } = usePlaylists();
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [muted, setMuted] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const pct = progress * 100;
  const bufPct = Math.min(100, Math.max(0, buffered*100));
  const handleSeek = useCallback((vals:number[])=>{ const v = vals[0]; seek(v/100); }, [seek]);
  const handleVolume = useCallback((vals:number[])=>{ const v = vals[0]; setVolume(v/100); if(v>0) setMuted(false); }, [setVolume]);
  const volPct = Math.round(volume*100);
  const volIcon = volPct === 0 || muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />;
  const handleDownload = async ()=>{
    if(!current) return;
    try {
      const res = await fetch(current.url, { credentials:'omit' });
      if(!res.ok) throw new Error('Falha download');
      const blob = await res.blob();
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      // tenta extrair extensão
      const guessedExt = current.title.includes('.') ? '' : '.mp3';
      const safeName = current.title.replace(/[^a-zA-Z0-9-_\. ]/g,'_');
      a.href = url;
      a.download = safeName + guessedExt;
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 2000);
    } catch {/* opcional: toast futuro */}
  };
  const currentTime = useMemo(()=> fmt(progress*duration), [progress, duration]);
  const totalTime = useMemo(()=> fmt(duration), [duration]);
  const toggleMute = () => { if(muted){ setMuted(false); setVolume(0.6);} else { setMuted(true); setVolume(0);} };
  const initials = current?.title?.trim().slice(0,2) || '??';

  if(!current) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 select-none">
      <div className="relative border-t bg-background/90 backdrop-blur-xl border-border/50 shadow-[0_-4px_18px_-4px_rgba(0,0,0,0.35)]">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8 py-3 md:py-4 flex flex-col gap-1">
          {/* Barra de progresso (buffer + progresso) */}
          <div className="h-1.5 w-full rounded-full bg-muted/60 relative overflow-hidden group cursor-pointer" aria-label="Linha de progresso">
            <div className="absolute inset-y-0 left-0 bg-muted-foreground/30" style={{ width: `${bufPct}%` }} />
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-4 w-full">
            {/* Info + capa real */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative w-12 h-12 rounded-md ring-1 ring-border overflow-hidden bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center shadow-inner">
                {coverUrl ? (
                  <img src={coverUrl} alt={current?.title} className="w-full h-full object-cover" onError={(e)=>{ e.currentTarget.style.display='none'; }} />
                ) : (
                  <span className="text-[10px] uppercase font-medium tracking-wide text-foreground/70">{initials}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{current?.title || 'Sem título'}</p>
                <p className="text-[11px] text-muted-foreground truncate">{current?.artist || 'Desconhecido'}</p>
                <div className="flex items-center gap-2 mt-0.5 md:hidden">
                  <span className="text-[10px] text-muted-foreground">{currentTime}</span>
                  <span className="text-[10px] text-muted-foreground">/ {totalTime}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 min-w-[2.5rem] justify-end">
                <Button size="icon" variant="ghost" aria-label="Favoritar" onClick={()=> current && toggleTrackLike(current.id)}
                  className={`h-8 w-8 relative transition ${current && isLiked(current.id) ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-inner' : 'text-muted-foreground hover:text-foreground'} `}>
                  <Heart className={`h-4 w-4 transition-transform ${current && isLiked(current.id) ? 'fill-current scale-110' : ''}`} />
                  {current && isLiked(current.id) && (
                    <span className="sr-only">Curtido</span>
                  )}
                </Button>
                {current && counts?.[current.id] !== undefined && (
                  <span className="text-[10px] font-medium text-muted-foreground tabular-nums px-1">{counts[current.id]}</span>
                )}
              </div>
            </div>
            {/* Controles centrais */}
            <div className="flex flex-col items-center flex-1 max-w-xl">
              <div className="flex items-center gap-3 md:gap-4">
                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={prev} disabled={!queue.length} aria-label="Anterior"><SkipBack className="h-5 w-5"/></Button>
                <Button size="icon" className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg" onClick={toggle} aria-label={playing? 'Pausar':'Tocar'}>
                  {playing ? <Pause className="h-6 w-6"/> : <Play className="h-6 w-6 ml-0.5"/>}
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={next} disabled={!queue.length} aria-label="Próxima"><SkipForward className="h-5 w-5"/></Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={()=> current && setShowAddPlaylist(true)} aria-label="Adicionar a playlist"><Plus className="h-5 w-5"/></Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={handleDownload} aria-label="Download"><Download className="h-5 w-5"/></Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={()=> seek(0)} aria-label="Reiniciar"><RotateCcw className="h-5 w-5"/></Button>
                <Button size="icon" variant="ghost" onClick={toggleLoop} aria-label="Repetir" className={`hidden sm:inline-flex h-9 w-9 hover:text-foreground ${loop ? 'text-primary font-bold ring-1 ring-primary/40 bg-primary/10' : 'text-muted-foreground'}`}>
                  <Repeat className="h-5 w-5"/>
                </Button>
              </div>
              <div className="hidden md:flex items-center gap-2 mt-1 w-full">
                <span className="text-[11px] tabular-nums text-muted-foreground min-w-[2.6rem] text-right">{currentTime}</span>
                <Slider value={[pct]} onValueChange={handleSeek} max={100} step={1} className="flex-1" aria-label="Progresso da faixa" />
                <span className="text-[11px] tabular-nums text-muted-foreground min-w-[2.6rem]">{totalTime}</span>
              </div>
            </div>
            {/* Volume + fila */}
            <div className="flex items-center gap-3 justify-end flex-1">
              <div className="hidden lg:flex items-center gap-2">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={toggleMute} aria-label="Mudo">{volIcon}</Button>
                <Slider value={[muted ? 0 : volPct]} onValueChange={handleVolume} max={100} step={1} className="w-24" />
              </div>
              <Button size="icon" variant="ghost" className={`h-8 w-8 ${showQueue ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground`} aria-label="Fila" onClick={()=> setShowQueue(s=> !s)}><ListMusic className="h-4 w-4"/></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Limpar" onClick={clear}><X className="h-4 w-4"/></Button>
            </div>
          </div>
          {/* Painel lateral fila */}
          {showQueue && queue.length > 0 && (
            <div className="mt-3 border-t border-border/40 pt-3 animate-in fade-in slide-in-from-bottom-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">Fila de Reprodução ({queue.length})</p>
                <button onClick={()=> setShowQueue(false)} className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/70 transition">Fechar</button>
              </div>
              <ul className="max-h-56 overflow-auto space-y-1 pr-1 text-sm">
                {queue.map((t,i)=>(
                  <li key={t.id} className={`group flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-muted/60 ${current?.id===t.id ? 'bg-primary/15 ring-1 ring-primary/30' : ''}`}
                    onClick={()=> seek(0) /* placeholder: poderia saltar index via contexto futuramente */}>
                    <span className="text-[10px] w-5 text-muted-foreground text-right tabular-nums">{i+1}</span>
                    <span className="truncate flex-1" title={t.title}>{t.title}</span>
                    {current?.id===t.id && <span className="text-[9px] text-primary font-medium">Tocando</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {/* Modal adicionar à playlist */}
      <Dialog open={showAddPlaylist} onOpenChange={(o)=>{ if(!adding) { setShowAddPlaylist(o); if(!o) setSelectedPlaylist(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar à Playlist</DialogTitle>
          </DialogHeader>
          {!current && <p className="text-sm text-muted-foreground">Nenhuma faixa ativa.</p>}
          {current && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground truncate">Faixa: <span className="font-medium">{current.title}</span></p>
              {loadingPlaylists && <p className="text-xs text-muted-foreground">Carregando playlists...</p>}
              {!loadingPlaylists && playlists.length === 0 && <p className="text-xs text-muted-foreground">Você não tem playlists. Crie uma na página Playlists.</p>}
              {!loadingPlaylists && playlists.length > 0 && (
                <select value={selectedPlaylist} onChange={e=> setSelectedPlaylist(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Selecionar playlist...</option>
                  {playlists.map(p=> <option key={p.id} value={p.id}>{p.name} ({p.tracks_count||0})</option>)}
                </select>
              )}
            </div>
          )}
          <DialogFooter className="pt-2">
            <UIButton variant="outline" size="sm" disabled={adding} onClick={()=> setShowAddPlaylist(false)}>Cancelar</UIButton>
            <UIButton size="sm" disabled={!current || !selectedPlaylist || adding}
              onClick={async ()=>{
                if(!current || !selectedPlaylist) return; setAdding(true);
                try {
                  const { supabase } = await import('@/integrations/supabase/client');
                  await (supabase.from('playlist_tracks') as any).insert({ playlist_id: selectedPlaylist, track_id: current.id });
                  setShowAddPlaylist(false); setSelectedPlaylist('');
                } catch(e){ /* silencia */ }
                finally { setAdding(false); }
              }}>{adding? 'Adicionando...' : 'Adicionar'}</UIButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MusicPlayer;