import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageShell from '@/components/PageShell';

interface AlbumRow { id: string; name: string; cover_url: string | null; genre: string | null; created_at: string; }
interface TrackRow { id: string; album_id: string; filename: string; file_url: string; created_at: string; }

const PAGE_SIZE = 12;

const MyAlbums = () => {
  const { userId } = useAuth();
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [openAlbum, setOpenAlbum] = useState<AlbumRow | null>(null);
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(async (reset=false) => {
    if(!userId) return;
    if(reset){ setPage(0); setHasMore(true); setAlbums([]); }
    const currentPage = reset ? 0 : page;
    if(!hasMore && !reset) return;
    if(reset || currentPage===0) setLoading(true);
    let query = supabase.from('albums').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(currentPage*PAGE_SIZE, currentPage*PAGE_SIZE + PAGE_SIZE -1);
    if(search.trim()) query = query.ilike('name', `%${search.trim()}%`);
    const { data, error } = await query;
    if(!error){
      const newData = (data as AlbumRow[]) || [];
      setAlbums(prev => reset ? newData : [...prev, ...newData]);
      if(newData.length < PAGE_SIZE) setHasMore(false);
      if(!reset) setPage(currentPage+1);
    }
    setLoading(false);
  }, [userId, page, search, hasMore]);

  useEffect(()=>{ if(userId) loadPage(true); }, [userId, search, loadPage]);

  useEffect(()=>{
    if(!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => { if(entry.isIntersecting) loadPage(); });
    }, { rootMargin: '200px' });
    obs.observe(el);
    return ()=> obs.disconnect();
  }, [loadPage]);

  useEffect(()=>{
    if(!openAlbum) return; setTracksLoading(true);
    supabase.from('tracks').select('*').eq('album_id', openAlbum.id).order('created_at', { ascending:false })
      .then(({ data })=> { setTracks((data as TrackRow[]) || []); setTracksLoading(false); });
  }, [openAlbum]);

  if(!userId){
    return <PageShell title="Meus Álbuns" subtitle="Faça login para ver seus álbuns enviados."><></></PageShell>;
  }

  return (
    <PageShell title="Meus Álbuns" headerRight={<div className="flex items-center gap-3"><Input placeholder="Buscar..." value={search} onChange={e=> setSearch(e.target.value)} className="h-9 w-40" /><Button variant="outline" size="sm" onClick={()=> window.scrollTo({ top:0, behavior:'smooth'})}>+ Upload</Button></div>}>
    {loading && page===0 && <div className="panel p-6 grid grid-cols-2 md:grid-cols-4 gap-6">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="aspect-square w-full" />)}</div>}
    {!loading && albums.length === 0 && <div className="panel p-10 text-center text-sm text-muted-foreground">Nenhum álbum ainda.</div>}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {albums.map(a => (
      <Card key={a.id} className="overflow-hidden group cursor-pointer panel-interactive" onClick={()=> setOpenAlbum(a)}>
            <CardContent className="p-0">
              <div className="aspect-square bg-muted relative">
                {a.cover_url ? <img src={a.cover_url} alt={a.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Sem capa</div>}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-black/40 flex items-center justify-center text-white text-xs">{a.genre || 'Sem gênero'}</div>
              </div>
              <div className="p-2">
                <p className="text-sm font-medium truncate" title={a.name}>{a.name}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div ref={sentinelRef} className="h-8"></div>
      {loading && page>0 && <p className="text-center text-xs text-muted-foreground">Carregando...</p>}
      {!hasMore && albums.length>0 && <p className="text-center text-xs text-muted-foreground mt-4">Fim da lista.</p>}
      <Dialog open={!!openAlbum} onOpenChange={(o)=> !o && setOpenAlbum(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{openAlbum?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {tracksLoading && <p className="text-sm text-muted-foreground">Carregando faixas...</p>}
            {!tracksLoading && tracks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma faixa.</p>}
            <ul className="space-y-2 max-h-80 overflow-auto pr-2">
              {tracks.map(t => (
                <li key={t.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                  <span className="truncate mr-2" title={t.filename}>{t.filename}</span>
                  <a href={t.file_url} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline">Abrir</a>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default MyAlbums;