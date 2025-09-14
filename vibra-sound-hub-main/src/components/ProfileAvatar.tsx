import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Loader2, X, Upload as UploadIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  url?: string | null;
  fallback: string;
  size?: number;
  onChange?: (url: string) => void;
  editable?: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ url, fallback, size = 144, onChange, editable = true }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const { userId } = useAuth();
  const BUCKET = 'avatars';

  const handleSelect = () => { if(editable && !uploading) inputRef.current?.click(); };

  const uploadFile = useCallback(async (file: File) => {
    try {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const folder = userId ? `${userId}` : 'public';
      const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;
      // bucket deve existir com política pública de leitura
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: false });
      if(upErr) throw upErr;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      const { error: updErr } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if(updErr) throw updErr;
      // Also persist avatar_url to the profiles table so queries that read from profiles (views/hooks) see it
      try{
        if(userId){
          const { error: pErr } = await supabase.from('profiles').update({ avatar_url: publicUrl } as any).eq('id', userId);
          if(pErr) console.warn('[ProfileAvatar] failed to update profiles.avatar_url', pErr);
        }
      }catch(pe){ console.warn('[ProfileAvatar] profiles update exception', pe); }
      if(import.meta.env.DEV){ try{ console.debug('[ProfileAvatar] uploaded avatar publicUrl', publicUrl); }catch(e){} }
      // re-fetch user para persistir em futuras páginas
      await supabase.auth.getUser();
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { url: publicUrl }}));
      toast({ title: 'Avatar atualizado.' });
      onChange?.(publicUrl);
    } catch(err: unknown){
      let msg = err instanceof Error ? err.message : 'Erro upload';
      if(msg.toLowerCase().includes('bucket not found')){
        msg = `Bucket "${BUCKET}" não encontrado. Crie no Supabase Storage com acesso público de leitura. Opcional: policies de insert (auth.uid() != null).`;
      }
      toast({ title: 'Falha no avatar', description: msg, variant: 'destructive' });
    } finally { setUploading(false); }
  },[onChange, toast, userId]);

  const validateAndUpload = useCallback((file: File) => {
    if(file.size > 3 * 1024 * 1024){
      toast({ title: 'Arquivo muito grande', description: 'Máx 3MB', variant: 'destructive' });
      return;
    }
    uploadFile(file);
  },[toast, uploadFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    validateAndUpload(file);
    e.target.value = '';
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if(!editable || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if(file && file.type.startsWith('image/')) {
      validateAndUpload(file);
    } else if(file){
      toast({ title: 'Formato inválido', description: 'Envie uma imagem.', variant: 'destructive' });
    }
  },[editable, uploading, validateAndUpload, toast]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if(!editable || uploading) return;
    setDragActive(true);
  },[editable, uploading]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if(!editable || uploading) return;
    setDragActive(false);
  },[editable, uploading]);

  const resetAvatar = async () => {
    if(uploading) return;
    try {
      setUploading(true);
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } });
      if(error) throw error;
      // also clear from profiles table
      try{
        if(userId){
          const { error: pErr } = await supabase.from('profiles').update({ avatar_url: null } as any).eq('id', userId);
          if(pErr) console.warn('[ProfileAvatar] failed to clear profiles.avatar_url', pErr);
        }
      }catch(pe){ console.warn('[ProfileAvatar] profiles clear exception', pe); }
      await supabase.auth.getUser();
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { url: null }}));
      toast({ title: 'Avatar removido.' });
      onChange?.('');
    } catch(err: unknown){
      const msg = err instanceof Error ? err.message : 'Erro ao remover';
      toast({ title: 'Falha', description: msg, variant: 'destructive' });
    } finally { setUploading(false); }
  };

  return (
    <div
      className={cn('relative group rounded-full ring-4 ring-background overflow-hidden shadow-lg transition-shadow', uploading && 'animate-pulse', dragActive && 'ring-primary shadow-primary/40 shadow-lg')}
      style={{ width: size, height: size }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {url ? (
        <img src={url} alt={fallback ?? 'Avatar'} className="object-cover w-full h-full" draggable={false} />
      ) : (
        <div className={cn('w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/40 to-primary/10 text-primary font-bold select-none', fallback && fallback.length > 2 ? 'text-2xl px-3 text-center' : 'text-5xl') }>
          {fallback}
        </div>
      )}
      {editable && (
        <>
          <button
            type="button"
            onClick={handleSelect}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/45 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all text-white text-xs font-medium px-2 text-center"
            aria-label="Alterar avatar"
          >
            {uploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
            <span>{dragActive ? 'Solte para enviar' : 'Clique ou arraste'}</span>
          </button>
          {/* Botões externos */}
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
            <button
              disabled={uploading}
              onClick={handleSelect}
              title="Upload"
              className="w-8 h-8 rounded-full border bg-background/85 backdrop-blur-sm flex items-center justify-center shadow hover:bg-background disabled:opacity-50"
            >
              <UploadIcon className="w-4 h-4" />
            </button>
            {url && (
              <button
                disabled={uploading}
                onClick={resetAvatar}
                title="Remover"
                className="w-8 h-8 rounded-full border bg-background/85 backdrop-blur-sm flex items-center justify-center shadow hover:bg-red-50/30 hover:text-red-600 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
};

export default ProfileAvatar;
