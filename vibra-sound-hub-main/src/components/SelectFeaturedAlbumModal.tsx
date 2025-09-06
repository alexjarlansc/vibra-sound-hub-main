import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSelected?: (album: { id: string; name: string; cover_url?: string }) => void;
}

export const SelectFeaturedAlbumModal: React.FC<Props> = ({ open, onClose, userId, onSelected }) => {
  const { toast } = useToast();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string|null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      // carregar o featured_album_id atual do perfil para pré-selecionar
      try {
        const { data: profile } = await supabase.from('profiles').select('featured_album_id').eq('id', userId).single();
        const p: any = profile as any;
        if (p && p.featured_album_id) {
          setSelected(String(p.featured_album_id));
        }
      } catch (e) {
        // ignore
      }

      let query = supabase.from('albums').select('id, name, cover_url').order('created_at', { ascending: false });
      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }
      const { data, error } = await query;
      setAlbums(data || []);
      setLoading(false);
    })();
  }, [open, search]);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
  const res = await (supabase.from('profiles') as any).update({ featured_album_id: selected } as any).eq('id', userId);
    setSaving(false);
    console.debug('[SelectFeaturedAlbumModal] update result:', res);
    const error = (res as any)?.error ?? null;
    if (!error) {
      const album = albums.find(a => a.id === selected);
      try{ toast({ title: 'Destaque salvo', description: album?.name ?? selected, }); } catch(e){}
      onSelected?.(album);
      try { window.dispatchEvent(new CustomEvent('profile:updated', { detail: { userId } })); } catch(e) {}
      onClose();
    } else {
      try{ toast({ title: 'Falha ao salvar destaque', description: String(error?.message || error), variant: 'destructive' }); }catch(e){}
      // detectar schema-missing e orientar o usuário
      const msg = error?.message || String(error);
      if(msg.toLowerCase().includes('featured_album_id') || msg.toLowerCase().includes('could not find')){
        alert('Erro ao salvar destaque: coluna `featured_album_id` ausente no banco. Rode a migration `supabase/migrations/202509060900_add_featured_album_to_profiles.sql` via Supabase SQL editor ou `supabase db push`.');
      } else {
        alert('Erro ao salvar destaque: ' + msg);
      }
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-background rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <h2 className="text-lg font-bold mb-4">Selecionar álbum em destaque</h2>
        <input
          type="text"
          className="w-full mb-3 px-3 py-2 border rounded focus:outline-none focus:ring"
          placeholder="Buscar álbum por nome..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />
        {loading ? <div>Carregando...</div> : (
          <ul className="space-y-2 max-h-64 overflow-auto mb-4">
            {albums.map(a => (
              <li key={a.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer border ${selected===a.id?'border-primary bg-primary/10':'border-transparent hover:bg-muted/40'}`} onClick={()=>setSelected(a.id)}>
                {a.cover_url ? <img src={a.cover_url} alt={a.name} className="w-10 h-10 object-cover rounded" /> : <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs">No cover</div>}
                <span className="font-medium">{a.name}</span>
                {selected===a.id && <span className="ml-auto text-primary text-xs">Selecionado</span>}
              </li>
            ))}
            {albums.length===0 && <li className="text-sm text-muted-foreground">Nenhum álbum encontrado.</li>}
          </ul>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!selected || saving}>{saving ? 'Salvando...' : 'Salvar destaque'}</Button>
        </div>
      </div>
    </div>
  );
};
