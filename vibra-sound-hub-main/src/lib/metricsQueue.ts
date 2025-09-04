import { supabase } from '@/integrations/supabase/client';

// Fila simples para agrupar registros de métricas (plays, downloads) e enviar em lote.
// Versão inicial: debounced flush.

interface MetricItem { type: 'track_play'|'track_download'|'album_download'; id: string; ts: number; }
const queue: MetricItem[] = [];
let timer: any = null;
const DEBOUNCE_MS = 1200;

async function flush(){
  if(!queue.length) return;
  const items = queue.splice(0, queue.length);
  // Agrupar por tipo
  const plays = items.filter(i=> i.type === 'track_play');
  const tDownloads = items.filter(i=> i.type === 'track_download');
  const aDownloads = items.filter(i=> i.type === 'album_download');
  try {
    if(plays.length){
      const rows = plays.map(p=> ({ track_id: p.id }));
      await (supabase.from('track_plays') as any).insert(rows);
    }
    if(tDownloads.length){
      for(const d of tDownloads){
        await (supabase.rpc as any)('register_track_download', { p_track: d.id });
      }
    }
    if(aDownloads.length){
      for(const d of aDownloads){
        await (supabase.rpc as any)('register_album_download', { p_album: d.id });
      }
    }
  } catch(e){
    console.warn('[metricsQueue] flush error', e);
  }
}

function schedule(){
  if(timer) clearTimeout(timer);
  timer = setTimeout(flush, DEBOUNCE_MS);
}

export function enqueueMetric(item: MetricItem){
  queue.push(item);
  schedule();
}
