// API para exclusão em cascata de álbum e faixas
// Coloque este arquivo em /src/api/delete-album-cascade.ts ou ajuste conforme seu backend
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID do álbum obrigatório' });
  try {
    // Exclui faixas do álbum
    const { error: trackErr } = await supabase.from('tracks').delete().eq('album_id', id);
    if (trackErr) throw new Error(trackErr.message);
    // Exclui álbum
    const { error: albumErr } = await supabase.from('albums').delete().eq('id', id);
    if (albumErr) throw new Error(albumErr.message);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
