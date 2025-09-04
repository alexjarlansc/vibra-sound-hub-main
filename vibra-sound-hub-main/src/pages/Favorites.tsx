import { useFavoriteAlbums } from '@/hooks/useFavorites';
import { useTrackFavorites } from '@/hooks/useTrackFavorites';
import PageShell from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';

const Favorites = () => {
  const { data, loading, error, reload, toggleLike } = useFavoriteAlbums();
  const { data: trackLikes, loading: loadingTracks, error: errorTracks, reload: reloadTracks, toggleTrackLike } = useTrackFavorites();
  const [tab, setTab] = useState<'albums'|'tracks'>('albums');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 16;
  const filtered = useMemo(()=> data.filter(a=> !search || (a.album?.name || a.album_id).toLowerCase().includes(search.toLowerCase())), [data, search]);
  const filteredTracks = useMemo(()=> trackLikes.filter(t=> !search || (t.track?.filename || t.track_id).toLowerCase().includes(search.toLowerCase())), [trackLikes, search]);
  const pagedAlbums = useMemo(()=> filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page]);
  const pagedTracks = useMemo(()=> filteredTracks.slice((page-1)*pageSize, page*pageSize), [filteredTracks, page]);
  const totalPages = useMemo(()=> tab==='albums' ? Math.max(1, Math.ceil(filtered.length / pageSize)) : Math.max(1, Math.ceil(filteredTracks.length / pageSize)), [filtered.length, filteredTracks.length, tab]);
  return (
    <PageShell title="Meus Favoritos" headerRight={<div className="flex items-center gap-3">
      <div className="flex items-center bg-muted/40 rounded-full p-1 text-[11px]">
        <button onClick={()=>setTab('albums')} className={`px-3 py-1 rounded-full font-medium transition ${tab==='albums'?'bg-primary text-primary-foreground shadow':'text-muted-foreground hover:text-foreground'}`}>Álbuns ({data.length})</button>
        <button onClick={()=>setTab('tracks')} className={`px-3 py-1 rounded-full font-medium transition ${tab==='tracks'?'bg-primary text-primary-foreground shadow':'text-muted-foreground hover:text-foreground'}`}>Músicas ({trackLikes.length})</button>
      </div>
      <Input placeholder="Buscar" value={search} onChange={e=>setSearch(e.target.value)} className="h-8 w-36" />
      <Button size="sm" variant="outline" onClick={()=>{ tab==='albums'? reload(): reloadTracks(); }}>Reload</Button>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))} className={`px-2 py-1 rounded border ${page<=1?'opacity-40 cursor-default':'hover:bg-muted/40'}`}>Prev</button>
        <span>{page} / {totalPages}</span>
        <button disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages,p+1))} className={`px-2 py-1 rounded border ${page>=totalPages?'opacity-40 cursor-default':'hover:bg-muted/40'}`}>Next</button>
      </div>
    </div>}>
      {tab==='albums' && (
        <>
          {loading && <div className="p-6 text-sm text-muted-foreground">Carregando...</div>}
          {error && <div className="p-6 text-sm text-destructive">{error}</div>}
          {!loading && !filtered.length && <div className="p-6 text-sm text-muted-foreground">Nenhum álbum favorito.</div>}
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {pagedAlbums.map(f=>{
              const a = f.album;
              return (
                <li key={f.id} className="border rounded-md bg-card/60 backdrop-blur-sm text-sm flex flex-col overflow-hidden group">
                  <div className="relative h-40 w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    {a?.cover_url ? <img src={a.cover_url} alt={a.name} className="absolute inset-0 w-full h-full object-cover" /> : <span>Sem capa</span>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2 gap-2">
                      <Button size="sm" variant="secondary" className="h-7 text-[10px] px-2" onClick={()=>toggleLike(f.album_id)}>Remover</Button>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <span className="font-medium truncate" title={a?.name || f.album_id}>{a?.name || f.album_id}</span>
                    {a?.genre && <span className="text-[10px] uppercase tracking-wide text-primary/80 font-semibold">{a.genre}</span>}
                    <span className="text-[11px] text-muted-foreground">Curtido em {new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {tab==='tracks' && (
        <>
          {loadingTracks && <div className="p-6 text-sm text-muted-foreground">Carregando...</div>}
          {errorTracks && <div className="p-6 text-sm text-destructive">{errorTracks}</div>}
          {!loadingTracks && !filteredTracks.length && <div className="p-6 text-sm text-muted-foreground">Nenhuma música favorita.</div>}
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {pagedTracks.map(t=>{
              const tr = t.track;
              return (
                <li key={t.id} className="border rounded-md bg-card/60 backdrop-blur-sm text-sm flex flex-col overflow-hidden group">
                  <div className="flex-1 p-4 flex flex-col items-start gap-2">
                    <span className="font-medium truncate" title={tr?.filename || t.track_id}>{tr?.filename || t.track_id}</span>
                    <span className="text-[11px] text-muted-foreground">Curtida em {new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="p-2 flex justify-end">
                    <Button size="sm" variant="secondary" className="h-7 text-[10px] px-2" onClick={()=>toggleTrackLike(t.track_id)}>Remover</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </PageShell>
  );
};

export default Favorites;
