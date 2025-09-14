import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useTrendingTracks } from '@/hooks/useTrendingTracks';
import { useTrendingProfiles } from '@/hooks/useTrendingProfiles';
import { usePlayer } from '@/context/PlayerContext';
import Top100Modal from '@/components/Top100Modal';
import Top50ArtistsModal from '@/components/Top50ArtistsModal';

type Item = { title: string; artist?: string; id?: string; url?: string; album_id?: string | null };
type Artist = { name: string; id?: string };

export default function TopMusicTemplate(){
  const { data: trendingTracks = [], loading: loadingTracks } = useTrendingTracks({ limit: 10 });
  // solicitar 9 artistas para exibir uma lista maior (antes era 5)
  const { data: trendingProfiles = [] } = useTrendingProfiles({ limit: 9 });
  const player = usePlayer();
  const [openTop100, setOpenTop100] = useState(false);
  const [openTopArtists, setOpenTopArtists] = useState(false);

  // Helper: resolve file_url for a set of track ids from Supabase
  const resolveTrackUrls = async (ids: string[]) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.from('tracks').select('id, filename, file_url, album_id').in('id', ids) as any;
      const rows: any[] = data || [];
      // preserve original order of ids
      const byId: Record<string, any> = {};
      rows.forEach(r => { byId[r.id] = r; });
      return ids.map(id => {
        const r = byId[id];
        const title = r?.filename ? String(r.filename).replace(/\.[a-zA-Z0-9]+$/, '') : undefined;
        return {
          id,
          title: title || undefined,
          artist: undefined,
          url: r?.file_url || undefined,
          albumId: r?.album_id || undefined,
          coverUrl: undefined,
        };
      });
    } catch (e) {
      console.error('[TopMusicTemplate] erro ao resolver urls das faixas', e);
      return ids.map(id => ({ id, title: undefined, artist: undefined, url: undefined, albumId: undefined, coverUrl: undefined }));
    }
  };

  // now opening modal; playback handled inside modal or by resolving urls elsewhere
  const handlePlayTop = async () => {
    setOpenTop100(true);
  };

  const displayTracks: Item[] = trendingTracks.length ? trendingTracks.map(t=>({ id: t.id, title: t.name, artist: undefined, album_id: t.album_id })) : [];
  const displayArtists: Artist[] = trendingProfiles.length ? trendingProfiles.map(p=>({ id: p.id, name: p.username })) : [];

  return (
    <div className="bg-card/90 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Top Músicas e Artistas</h3>
          <p className="text-sm text-muted-foreground">A semana está bombando — com dados do seu banco.</p>
        </div>
        <div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handlePlayTop} disabled={!displayTracks.length}>OUVIR TOP MÚSICAS</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 gap-4">
          {loadingTracks && <div className="text-sm text-muted-foreground">Carregando...</div>}
          {displayTracks.map((t, i)=> (
            <div key={t.id || i} className="flex items-start gap-4 text-muted-foreground">
              <div className="w-8 flex-shrink-0">
                <button
                  aria-label={`Tocar ${i+1}`}
                  onClick={async ()=>{
                    // resolve this track url then play
                    const ids = [t.id!];
                    const resolved = await resolveTrackUrls(ids);
                    const track = resolved[0];
                    if(track && track.url){
                      // play single track replacing queue
                      player.play({ id: track.id, title: track.title || t.title, url: track.url, albumId: track.albumId }, { replaceQueue: false });
                    } else {
                      console.warn('[TopMusicTemplate] URL da faixa n\u00e3o encontrada para', t.id);
                    }
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent group-hover:bg-transparent relative transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold bg-transparent hover:bg-primary group cursor-pointer transition-colors duration-200">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-primary transition-colors duration-200">
                      <span className="text-2xl font-semibold text-muted-foreground group-hover:opacity-0 transition-opacity duration-150">{i+1}</span>
                      <Play className="absolute w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                    </span>
                  </div>
                </button>
              </div>
              <div>
                <div className="font-semibold text-foreground">{t.title}</div>
                <div className="text-xs text-muted-foreground">{/* poderia exibir plays_count se disponível */}plays</div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {displayArtists.map((a, idx)=> (
            <div key={a.id || idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold">{idx+1}</div>
                <div>
                  <div className="font-semibold text-foreground">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{(200000 - idx*20000).toLocaleString()} plays</div>
                </div>
              </div>
              <div className="hidden md:block"> 
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">{idx+1}</div>
              </div>
            </div>
          ))}

            <div className="mt-4 flex space-x-2">
            <Button variant="outline" className="flex-1" onClick={()=> setOpenTop100(true)}>VER TOP MÚSICAS</Button>
            <Button variant="outline" className="flex-1" onClick={()=> setOpenTopArtists(true)}>VER TOP ARTISTAS</Button>
          </div>
        </div>
      </div>
  {openTop100 && <Top100Modal open={openTop100} onOpenChange={(o)=> setOpenTop100(o)} />}
  {openTopArtists && <Top50ArtistsModal open={openTopArtists} onOpenChange={(o)=> setOpenTopArtists(o)} />}
    </div>
  );
}
