import PageShell from '@/components/PageShell';
import { usePlaylists, usePlaylistTracks } from '@/hooks/usePlaylists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const PlaylistsPage = () => {
  const { data, loading, error, create, remove, update } = usePlaylists();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<string|null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [openTracks, setOpenTracks] = useState<string|null>(null);

  const handleCreate = async () => {
    if(!name.trim()) return;
    await create({ name: name.trim(), description: desc.trim()||undefined });
    setName(''); setDesc(''); setOpenCreate(false);
  };

  return (
    <PageShell title="Minhas Playlists" headerRight={<Button size="sm" onClick={()=> setOpenCreate(o=>!o)}>{openCreate? 'Cancelar':'Nova Playlist'}</Button>}>
      {openCreate && (
        <div className="p-4 border-b bg-muted/20 flex flex-col gap-3">
          <Input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
          <Input placeholder="Descrição (opcional)" value={desc} onChange={e=>setDesc(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" disabled={!name.trim()} onClick={handleCreate}>Salvar</Button>
            <Button size="sm" variant="ghost" onClick={()=>{ setOpenCreate(false); }}>Fechar</Button>
          </div>
        </div>
      )}
      {loading && <div className="p-6 text-sm text-muted-foreground">Carregando...</div>}
      {error && <div className="p-6 text-sm text-destructive">{error}</div>}
      {!loading && !data.length && <div className="p-6 text-sm text-muted-foreground">Nenhuma playlist ainda.</div>}
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {data.map(p=> {
          const isEditing = editing === p.id;
          return (
            <li key={p.id} className="border rounded-md bg-card/60 backdrop-blur-sm p-4 flex flex-col gap-2 group">
              {isEditing ? (
                <>
                  <Input value={editName} onChange={e=>setEditName(e.target.value)} className="h-8" />
                  <Input value={editDesc} onChange={e=>setEditDesc(e.target.value)} className="h-8" placeholder="Descrição" />
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" disabled={!editName.trim()} onClick={async ()=>{ await update(p.id, { name: editName.trim(), description: editDesc.trim()||null }); setEditing(null); }}>Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={()=> setEditing(null)}>Cancelar</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold truncate" title={p.name}>{p.name}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p.tracks_count||0} faixas</span>
                  </div>
                  {p.description && <div className="text-xs text-muted-foreground line-clamp-2 min-h-[28px]">{p.description}</div>}
                  <div className="mt-auto flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                    <Button size="sm" variant="outline" onClick={()=>{ setEditing(p.id); setEditName(p.name); setEditDesc(p.description||''); }}>Editar</Button>
                    <Button size="sm" variant="outline" onClick={()=> setOpenTracks(p.id)}>Faixas</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={()=>remove(p.id)}>Excluir</Button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {openTracks && <PlaylistTracksManager playlistId={openTracks} onClose={()=> setOpenTracks(null)} />}
    </PageShell>
  );
};

export default PlaylistsPage;

// Gerenciador simples de faixas (inline)
import { useTrendingTracks } from '@/hooks/useTrendingTracks';

const PlaylistTracksManager: React.FC<{ playlistId:string; onClose:()=>void }> = ({ playlistId, onClose }) => {
  const { data, loading, addTrack, removeTrack, moveTrack } = usePlaylistTracks(playlistId);
  const { data: trending } = useTrendingTracks({ limit: 20 });
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-6 overflow-auto">
      <div className="max-w-3xl mx-auto bg-card/90 border rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Gerenciar Faixas</h2>
          <Button size="sm" variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
        <div className="space-y-3">
          <div className="text-sm font-medium">Adicionar de Músicas em Alta</div>
          <div className="flex flex-wrap gap-2">
            {trending.map(t=> (
              <button key={t.id} className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80" onClick={()=> addTrack(t.id)}>+ {t.name}</button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">Faixas ({data.length})</h3>
          {loading && <div className="text-xs text-muted-foreground">Carregando...</div>}
          <ul className="divide-y text-sm border rounded-md">
      {data.sort((a,b)=>(a.position||0)-(b.position||0)).map(tr => (
              <li key={tr.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/40">
                <span className="text-xs w-6 text-muted-foreground">{tr.position ?? 0}</span>
        <span className="flex-1 truncate" title={tr.track?.filename || tr.track_id}>{tr.track?.filename || tr.track_id}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 px-2" onClick={()=> moveTrack(tr.track_id,'up')}>↑</Button>
                  <Button size="sm" variant="outline" className="h-7 px-2" onClick={()=> moveTrack(tr.track_id,'down')}>↓</Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={()=> removeTrack(tr.track_id)}>x</Button>
                </div>
              </li>
            ))}
            {!data.length && !loading && <li className="px-3 py-4 text-xs text-muted-foreground">Sem faixas ainda.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};
