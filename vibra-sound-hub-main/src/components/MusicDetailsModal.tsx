import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  item: { id: string; type: 'album'|'track' }|null;
  onDeleted?: (id: string, type: 'album'|'track') => void;
}

export const MusicDetailsModal: React.FC<Props> = ({ open, onClose, item, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setLoading(true);
    setDetails(null);
    (async () => {
      try {
        if (item.type === 'album') {
          const { data: album, error } = await supabase.from('albums').select('*, tracks(id, filename, file_url, created_at)').eq('id', item.id).single();
          if (error) throw new Error(error.message);
          setDetails(album);
        } else {
          const { data: track, error } = await supabase.from('tracks').select('*').eq('id', item.id).single();
          if (error) throw new Error(error.message);
          setDetails(track);
        }
      } catch (e: any) {
        toast({ title: 'Erro ao carregar detalhes', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, item]);

  async function handleDelete() {
    if (!item) return;
    if (!window.confirm('Tem certeza que deseja excluir? Esta ação não pode ser desfeita.')) return;
    setDeleting(true);
    try {
      if (item.type === 'album') {
        const { error } = await supabase.from('albums').delete().eq('id', item.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('tracks').delete().eq('id', item.id);
        if (error) throw new Error(error.message);
      }
      toast({ title: 'Excluído com sucesso' });
      onDeleted?.(item.id, item.type);
      onClose();
    } catch (e: any) {
      toast({ title: 'Erro ao excluir', description: e.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-background rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <button className="absolute top-2 right-2 text-lg" onClick={onClose}>&times;</button>
        {loading && <div className="text-center py-10">Carregando...</div>}
        {!loading && details && (
          <div>
            <h2 className="text-xl font-bold mb-2">{details.name || details.filename}</h2>
            {details.cover_url && <img src={details.cover_url} alt="Capa" className="w-32 h-32 object-cover rounded mb-2" />}
            <div className="text-sm text-muted-foreground mb-2">{details.created_at && new Date(details.created_at).toLocaleString()}</div>
            {item?.type === 'album' && details.tracks && (
              <div className="mb-2">
                <b>Faixas:</b>
                <ul className="list-disc ml-5">
                  {details.tracks.map((t: any) => (
                    <li key={t.id}>{t.filename}</li>
                  ))}
                </ul>
              </div>
            )}
            {item?.type === 'track' && (
              <div className="mb-2">
                <b>Arquivo:</b> {details.filename}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? 'Excluindo...' : 'Excluir'}</Button>
              <Button variant="outline" onClick={onClose}>Fechar</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
