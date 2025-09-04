import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { enqueueMetric } from '@/lib/metricsQueue';

/*
  Hook simples para registrar play de track.
  (Para álbuns, você pode optar por registrar play da primeira track ou criar uma tabela album_plays).
*/
export function useRegisterPlay() {
  const registerTrackPlay = useCallback(async (trackId: string) => {
    try {
      // Usa tabela track_plays assumindo RLS permitindo insert autenticado (já existente no schema atual)
  enqueueMetric({ type:'track_play', id: trackId, ts: Date.now() });
    } catch(e) {
      console.warn('[registerTrackPlay] erro', e);
    }
  },[]);

  return { registerTrackPlay };
}
