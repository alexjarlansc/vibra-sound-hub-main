import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { uploadFileWithCancel } from '@/lib/uploadWithCancel';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

// Tipos aceitos
const ACCEPT = {
  audio: ['audio/mpeg','audio/wav','audio/x-wav','audio/wma','audio/x-ms-wma'],
  archives: ['application/zip','application/x-zip-compressed','application/vnd.rar','application/x-rar-compressed']
};

const MAX_FILE_MB = 150; // limite por arquivo

interface UploadMusicModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId?: string | null; // se não tiver user não deixa enviar
  onUploaded?: () => void; // callback para atualizar listas externas
}

export const UploadMusicModal: React.FC<UploadMusicModalProps> = ({ open, onOpenChange, userId, onUploaded }) => {
  const { toast } = useToast();
  const [albumName, setAlbumName] = useState('');
  const [genre, setGenre] = useState('');
  const GENRES = ['Sertanejo','Pagode','Forró','Funk','Pop','Rock','Gospel','MPB','Eletrônica','Rap'];
  const [cover, setCover] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const [wasAborted, setWasAborted] = useState(false);

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    setFiles(Array.from(e.target.files));
  };

  const onSelectCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files) return;
    setCover(e.target.files[0]);
  }

  const validate = useCallback(() => {
    if(!userId){
      toast({ title: 'Você precisa estar logado.', variant: 'destructive' });
      return false;
    }
    if(!albumName.trim()){
      toast({ title: 'Informe o nome do álbum.' , variant: 'destructive'});
      return false;
    }
    if(files.length === 0){
      toast({ title: 'Selecione arquivos de áudio ou ZIP/RAR.' , variant: 'destructive'});
      return false;
    }
    for(const f of files){
      const sizeMb = f.size / (1024*1024);
      if(sizeMb > MAX_FILE_MB){
        toast({ title: `Arquivo muito grande: ${f.name}` , variant: 'destructive'});
        return false;
      }
    }
    return true;
  },[albumName, files, toast, userId]);

  const handleUpload = async () => {
    if(!validate()) return;
    try {
      setLoading(true);
  setProgress(2);
      setWasAborted(false);
      abortRef.current = new AbortController();
  // Recupera token de sessão autenticada para políticas RLS de storage
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
      if(import.meta.env.DEV){ console.debug('[UploadMusicModal] session token present?', !!accessToken, accessToken?.slice(0,16)+'...'); }
      if(!accessToken){
        throw new Error('Sessão não encontrada para upload autenticado. Faça login novamente e tente de novo.');
      }
  const BUCKET = import.meta.env.VITE_SUPABASE_MUSIC_BUCKET || import.meta.env.VITE_SUPABASE_BUCKET_MUSIC || 'music';
  // cria album
  const albumPayload: TablesInsert<'albums'> = { name: albumName, genre: genre || null, cover_url: null, user_id: userId || null };
  // Workaround de tipagem: codegen atual está inferindo 'never' para inserts; usar cast any
  const { data: albumInsert, error: albumErr } = await (supabase.from('albums') as any).insert(albumPayload).select().single();
      if(albumErr) {
        // Intercepta erro de RLS com mensagem mais amigável
        const raw = JSON.stringify(albumErr);
        if(/row level security/i.test(raw) || albumErr.code === '42501' || albumErr.message?.includes('violates row-level security')){
          throw new Error('Permissão negada ao inserir álbum. Crie policies RLS de INSERT em public.albums (auth.uid() = user_id). Veja README seção Storage/RLS.');
        }
        throw albumErr;
      }
  if(!albumInsert){ throw new Error('Falha ao criar álbum (sem retorno).'); }

      // envia capa se houver
      let coverUrl: string | null = null;
    if(cover && albumInsert){
        const path = `covers/${albumInsert.id}-${Date.now()}-${cover.name}`;
        try {
          coverUrl = await uploadFileWithCancel(BUCKET, path, cover, abortRef.current.signal, accessToken);
          await (supabase.from('albums') as any).update({ cover_url: coverUrl }).eq('id', albumInsert.id);
        } catch(err){
          if(isAbortError(err)) throw { name: 'AbortError', albumId: albumInsert.id } as AbortLikeWithAlbum;
          const msg = err instanceof Error ? err.message : 'erro desconhecido';
          if(/Bucket not found/i.test(msg)){
            throw new Error('Bucket de storage não encontrado. Crie o bucket "'+BUCKET+'" no painel Supabase (Storage) e permita acesso público.');
          }
          if(/row level security/i.test(msg) || /violates row-level security/i.test(msg)){
            const hint = `Permissão negada ao salvar capa. Crie políticas de Storage para o bucket "${BUCKET}". Exemplo SQL:

-- permitir upload por usuários autenticados
create policy "music-insert" on storage.objects for insert with check (
  bucket_id = '${BUCKET}' AND auth.role() = 'authenticated'
);
-- permitir leitura pública
create policy "music-select" on storage.objects for select using (
  bucket_id = '${BUCKET}'
);

-- Depois, marque o bucket como Public (Storage > bucket > toggle Public).
`;
            throw new Error(hint);
          }
          throw new Error('Falha ao enviar capa: '+ msg);
        }
      }

      // envia arquivos de áudio ou pacotes
      const total = files.length;
      let current = 0;
    for(const f of files){
        const path = `tracks/${albumInsert.id}/${Date.now()}-${f.name}`;
        try {
      const signal = abortRef.current?.signal; // guarda referência segura
      if(!signal){ throw new Error('Abort controller ausente'); }
          const publicUrl = await uploadFileWithCancel(BUCKET, path, f, signal, accessToken);
          // garantir que albumInsert existe
          if(!albumInsert) throw new Error('Álbum não retornado da criação.');
          const trackPayload: TablesInsert<'tracks'> = {
            album_id: albumInsert.id,
            user_id: userId || null,
            filename: f.name,
            file_url: publicUrl,
            mime_type: f.type || null,
            size_bytes: f.size
          };
          const { error: trackErr } = await (supabase.from('tracks') as any).insert(trackPayload);
          if(trackErr){
            const raw = JSON.stringify(trackErr);
            if(/row level security/i.test(raw) || trackErr.code === '42501' || trackErr.message?.includes('violates row-level security')){
              throw new Error('Permissão negada ao inserir faixa. Crie policy INSERT em public.tracks (auth.uid() = user_id e album pertence ao usuário).');
            }
            throw trackErr;
          }
        } catch(err){
          if(isAbortError(err)) throw { name: 'AbortError', albumId: albumInsert.id } as AbortLikeWithAlbum;
          const msg = err instanceof Error ? err.message : 'erro desconhecido';
          if(/Bucket not found/i.test(msg)){
            throw new Error('Bucket de storage não encontrado. Crie o bucket "'+BUCKET+'" no painel Supabase (Storage) e permita acesso público.');
          }
          if(/row level security/i.test(msg) || /violates row-level security/i.test(msg)){
            throw new Error('Permissão negada ao salvar arquivo. Adicione políticas de INSERT/SELECT no bucket "'+BUCKET+'". Veja instruções exibidas no erro da capa.');
          }
          throw new Error('Falha ao enviar arquivo '+ f.name + ': ' + msg);
        }
        current++;
        setProgress( 10 + Math.round((current/total)*90) );
      }

  toast({ title: 'Upload concluído.' });
  if(onUploaded) onUploaded();
      setAlbumName(''); setGenre(''); setCover(null); setFiles([]);
      onOpenChange(false);
    } catch (err: unknown) {
  if(import.meta.env.DEV){ console.warn('[UploadMusicModal] erro', err); }
      if(isAbortError(err)){
        setWasAborted(true);
        const albumId = (err as Partial<AbortLikeWithAlbum>).albumId;
        if(albumId){
          await supabase.from('albums').delete().eq('id', albumId);
        }
        toast({ title: 'Upload cancelado.' });
      } else {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        toast({ title: 'Erro no upload', description: msg, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
      setTimeout(()=> setProgress(0), 800);
      // cleanup controller para evitar reuso indevido
      abortRef.current = null;
    }
  };

  const cancelInFlight = () => {
    if(abortRef.current){
      abortRef.current.abort();
    }
  };

  const acceptAttr = [ ...ACCEPT.audio, ...ACCEPT.archives ].join(',');

  if(import.meta.env.DEV){
    // log mínimo de re-render debug
    try { console.debug('[UploadMusicModal] render', { open, files: files.length, genre }); } catch{}
  }
  return (
    <Dialog open={open} onOpenChange={(o)=>{ if(!loading) onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload de Músicas / Álbum</DialogTitle>
        </DialogHeader>
  <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nome do Álbum *</label>
            <Input value={albumName} onChange={e=>setAlbumName(e.target.value)} placeholder="Ex: Meu Primeiro Álbum" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Gênero Musical</label>
            <div className="relative">
              <select
                value={genre}
                onChange={e=> { const v = e.target.value; if(import.meta.env.DEV) console.debug('[UploadMusicModal] genre change', v); setGenre(v); }}
                className="w-full h-10 text-sm rounded-md border border-input bg-background px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Selecionar</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">▾</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Capa do Álbum</label>
            <Input type="file" accept="image/*" onChange={onSelectCover} />
            {cover && <p className="text-xs text-muted-foreground">{cover.name}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Arquivos de Áudio / ZIP / RAR *</label>
            <Input multiple type="file" accept={acceptAttr} onChange={onSelectFiles} />
            {files.length > 0 && <ul className="text-xs max-h-32 overflow-auto list-disc pl-4 space-y-0.5">{files.map(f=> <li key={f.name}>{f.name}</li>)}</ul>}
          </div>
          <p className="text-xs text-muted-foreground">Formatos suportados: MP3, WAV, WMA, ZIP, RAR (até {MAX_FILE_MB}MB cada).</p>
      {loading && (
            <div className="space-y-1">
              <Progress value={progress} />
        <p className="text-[10px] text-muted-foreground">{wasAborted ? 'Cancelado' : `Enviando... ${progress}%`}</p>
            </div>
          )}
        </div>
        <DialogFooter className="pt-4">
      {!loading && <Button variant="outline" onClick={()=>onOpenChange(false)}>Fechar</Button>}
      {!loading && <Button onClick={handleUpload} disabled={loading || wasAborted}>{loading ? 'Enviando...' : 'Enviar'}</Button>}
      {loading && <Button variant="destructive" onClick={cancelInFlight}>Cancelar Envio</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadMusicModal;

// --- util types / helpers ---
interface AbortLike { name: string }
interface AbortLikeWithAlbum extends AbortLike { albumId: string }
function isAbortError(err: unknown): err is AbortLike {
  return !!err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'AbortError';
}
