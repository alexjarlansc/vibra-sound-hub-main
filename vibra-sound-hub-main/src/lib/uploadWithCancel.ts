import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

/**
 * Upload direto via fetch para permitir AbortController.
 * Usa token do usuário (accessToken) quando fornecido, senão recai para anon key.
 */
export async function uploadFileWithCancel(
  bucket: string,
  path: string,
  file: File,
  signal: AbortSignal,
  accessToken?: string
) {
  const token = accessToken || SUPABASE_PUBLISHABLE_KEY; // preferir token do usuário para RLS
  const objectPath = encodeURI(path).replace(/%5C/g,'/');
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-upsert': 'false',
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file,
    signal
  });
  if(!res.ok){
    let body: string = '';
    try { body = await res.text(); } catch {}
    throw new Error(`Falha upload (status ${res.status}): ${body}`);
  }
  // URL pública básica
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}