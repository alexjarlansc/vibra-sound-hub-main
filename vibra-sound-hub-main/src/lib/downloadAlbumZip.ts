// import dinâmico para evitar erro de tipo antes de instalação dos types
// @ts-ignore - types opcionais
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { enqueueMetric } from './metricsQueue';

/**
 * Faz download de todas as faixas de um álbum (pela tabela tracks) e gera um ZIP client-side.
 * Regras:
 *  - Registra métrica (fila) album_download
 *  - Mantém estrutura simples: /{número sequencial - nome original}
 */
export async function downloadAlbumAsZip(albumId: string, options?: { onProgress?: (pct:number)=>void }) {
  const { onProgress } = options || {};
  // Busca faixas do álbum
  const { data: tracks, error } = await (supabase.from('tracks') as any)
    .select('id, filename, file_url')
    .eq('album_id', albumId)
    .order('created_at', { ascending: true });
  if(error) throw new Error('Erro ao carregar faixas do álbum: '+ error.message);
  if(!tracks || !tracks.length) throw new Error('Álbum sem faixas.');

  const zip = new JSZip();
  const folder = zip.folder('album-'+albumId)!!;
  let idx = 0;
  for(const t of tracks){
    idx++;
    const url = t.file_url as string;
    try {
      const res = await fetch(url);
      if(!res.ok) throw new Error('HTTP '+res.status);
      const blob = await res.blob();
      const arrayBuf = await blob.arrayBuffer();
      const clean = (t.filename || ('track-'+idx)).replace(/[/\\]/g,'-');
      const name = String(idx).padStart(2,'0')+' - '+ clean;
      folder.file(name, arrayBuf);
      if(onProgress){ onProgress(Math.round((idx/tracks.length)*80)); }
    } catch(e:any){
      console.warn('[downloadAlbumAsZip] falha em faixa', t.id, e);
    }
  }
  if(onProgress){ onProgress(90); }
  const zipBlob = await zip.generateAsync({ type: 'blob' }, (meta)=>{ if(onProgress) onProgress(80 + Math.round(meta.percent*0.2)); });
  if(onProgress){ onProgress(100); }
  enqueueMetric({ type: 'album_download', id: albumId, ts: Date.now() });
  const a = document.createElement('a');
  const url = URL.createObjectURL(zipBlob);
  a.href = url;
  a.download = `album-${albumId}.zip`;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 3000);
}
