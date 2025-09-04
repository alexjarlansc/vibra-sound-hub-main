import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserAlbums } from '@/hooks/useUserAlbums';
import { useAlbumTracks } from '@/hooks/useAlbumTracks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageShell from '@/components/PageShell';
import UploadMusicModal from '@/components/UploadMusicModal';

const MyAlbums = () => {
  const { userId } = useAuth();
  const [search, setSearch] = useState('');
  const { albums, loadMore, hasMore, initialLoading, loading, reset } = useUserAlbums({ pageSize: 12, search, enabled: !!userId });
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  const { tracks, loading: tracksLoading, reload: reloadTracks } = useAlbumTracks(openAlbumId || undefined);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // infinite scroll
  useEffect(()=>{
    if(!sentinelRef.current) return;
    const el = sentinelRef.current;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => { if(entry.isIntersecting) loadMore(); });
    }, { rootMargin: '200px' });
    obs.observe(el);
    return ()=> obs.disconnect();
  }, [loadMore]);

  // reload tracks when album changes
  useEffect(()=>{ if(openAlbumId) reloadTracks(); }, [openAlbumId, reloadTracks]);

  const openAlbum = albums.find(a => a.id === openAlbumId) || null;

  if(!userId){
    return <PageShell title="Meus Álbuns" subtitle="Faça login para ver seus álbuns enviados."><></></PageShell>;
  }

  return (
    <PageShell title="Meus Álbuns" headerRight={<div className="flex items-center gap-3"><Input placeholder="Buscar..." value={search} onChange={e=> setSearch(e.target.value)} className="h-9 w-40" /><Button variant="outline" size="sm" onClick={()=> setShowUpload(true)}>+ Upload</Button></div>}>
    {initialLoading && <div className="panel p-6 grid grid-cols-2 md:grid-cols-4 gap-6">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="aspect-square w-full" />)}</div>}
    {!initialLoading && albums.length === 0 && <div className="panel p-10 text-center text-sm text-muted-foreground">Nenhum álbum ainda.</div>}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {albums.map(a => (
      <Card key={a.id} className="overflow-hidden group cursor-pointer panel-interactive" onClick={()=> setOpenAlbumId(a.id)}>
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
      {loading && !initialLoading && <p className="text-center text-xs text-muted-foreground">Carregando...</p>}
      {!hasMore && albums.length>0 && <p className="text-center text-xs text-muted-foreground mt-4">Fim da lista.</p>}
      <Dialog open={!!openAlbum} onOpenChange={(o)=> !o && setOpenAlbumId(null)}>
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
      <UploadMusicModal open={showUpload} onOpenChange={setShowUpload} userId={userId} onUploaded={()=>{ setShowUpload(false); reset(); loadMore(); }} />
    </PageShell>
  );
};

export default MyAlbums;