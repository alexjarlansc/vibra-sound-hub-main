import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

// Upload direto via fetch para permitir AbortController (Supabase JS não expõe cancelamento ainda)
export async function uploadFileWithCancel(bucket: string, path: string, file: File, signal: AbortSignal) {
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURI(path)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, 'x-upsert': 'false', 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
    signal
  });
  if(!res.ok) throw new Error('Falha upload: ' + await res.text());
  // URL pública básica
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}