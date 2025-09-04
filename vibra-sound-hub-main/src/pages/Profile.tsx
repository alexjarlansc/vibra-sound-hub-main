import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemo, useState, useEffect } from 'react';
import ProfileAvatar from '@/components/ProfileAvatar';
import PageShell from '@/components/PageShell';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Crown } from 'lucide-react';

// Placeholder para dados; depois integrar com Supabase
interface Stats { plays: number; uploads: number; downloads: number; followers: number; following: number; }

const Profile = () => {
  const { user, userEmail } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.user_metadata?.avatar_url);
  const [profileInfo, setProfileInfo] = useState<{ role?: string; is_verified?: boolean }|null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  // sincroniza quando metadata mudar (ex: após update em outra aba/componente)
  if(user?.user_metadata?.avatar_url !== avatarUrl){
    // evita loop se set for igual
    if(user?.user_metadata?.avatar_url !== avatarUrl){
      setAvatarUrl(user?.user_metadata?.avatar_url);
    }
  }
  const displayName = useMemo(()=>{
    const meta = user?.user_metadata || {}; // supabase padrão
    const raw = meta.full_name || meta.name || meta.user_name || userEmail || 'Usuário';
    const parts = raw.split(/\s+/).filter(Boolean);
    if(parts.length>1){ return parts.slice(0,3).map(p=> p.charAt(0).toUpperCase()+p.slice(1)).join(' ');} 
    return raw.charAt(0).toUpperCase()+raw.slice(1);
  },[user, userEmail]);

  const stats: Stats = { plays: 0, uploads: 0, downloads: 0, followers: 0, following: 0 };

  // Carrega role/is_verified
  useEffect(()=>{
    if(!user?.id) return;
    let canceled = false;
    (async()=>{
      try {
        setProfileLoading(true);
        const { data, error } = await supabase.from('profiles').select('role,is_verified').eq('id', user.id).maybeSingle();
        if(!canceled){
          if(!error) setProfileInfo(data as any);
        }
      } finally { if(!canceled) setProfileLoading(false); }
    })();
    return ()=>{ canceled = true; };
  },[user?.id]);

  return (
    <div className="min-h-screen">
      <PageShell>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
          <ProfileAvatar url={avatarUrl} fallback={displayName.charAt(0)} onChange={setAvatarUrl} />
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3 flex-wrap">
                  <span>{displayName}</span>
                  {profileInfo?.role === 'admin' && (
                    <Badge variant="secondary" className="flex items-center gap-1 text-[11px] py-1">
                      <Crown className="h-3.5 w-3.5 text-amber-500" /> Admin
                    </Badge>
                  )}
                  {profileInfo?.is_verified && (
                    <Badge className="flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-600 text-[11px] py-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verificado
                    </Badge>
                  )}
                  {profileLoading && !profileInfo && (
                    <span className="text-xs text-muted-foreground animate-pulse">Carregando...</span>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Divulgador</p>
              </div>
              {/* Botão de verificação removido conforme solicitação */}
            </div>
            {/* Abas */}
            <Tabs defaultValue="cds" className="mt-6">
              <TabsList className="h-10 bg-background/60 backdrop-blur-sm border rounded-full p-1">
                <TabsTrigger value="cds" className="px-5 rounded-full">CDs/Singles</TabsTrigger>
                <TabsTrigger value="playlists" className="px-5 rounded-full">Playlist</TabsTrigger>
                <TabsTrigger value="videos" className="px-5 rounded-full">Vídeos</TabsTrigger>
              </TabsList>
              <TabsContent value="cds" className="mt-6">
                <div className="text-sm text-muted-foreground">Nenhum CD ou single enviado ainda.</div>
              </TabsContent>
              <TabsContent value="playlists" className="mt-6">
                <div className="text-sm text-muted-foreground">Nenhuma playlist criada ainda.</div>
              </TabsContent>
              <TabsContent value="videos" className="mt-6">
                <div className="text-sm text-muted-foreground">Nenhum vídeo enviado ainda.</div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-6 lg:col-span-2">
            {/* Lista itens (placeholder) */}
            <div className="panel p-6 mt-8 lg:mt-12">
              <h2 className="font-semibold mb-4">Uploads Recentes</h2>
              <p className="text-sm text-muted-foreground">Nada para mostrar ainda.</p>
            </div>
          </div>
          <aside className="space-y-6 -mt-20 lg:-mt-40">
            <div className="panel pt-0 pb-6 px-6">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-4">Estatísticas</h2>
              <div className="grid grid-cols-2 gap-6 text-center text-sm">
                <div>
                  <p className="text-2xl font-bold">{stats.plays}</p>
                  <p className="text-muted-foreground">Plays</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.uploads}</p>
                  <p className="text-muted-foreground">Uploads</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.downloads}</p>
                  <p className="text-muted-foreground">Downloads</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.followers}</p>
                  <p className="text-muted-foreground">Seguidores</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.following}</p>
                  <p className="text-muted-foreground">Seguindo</p>
                </div>
              </div>
              <div className="mt-6 border-t pt-4 text-xs text-muted-foreground">
                Sobre • Preencha sua bio em breve.
              </div>
            </div>
          </aside>
        </div>
      </PageShell>
      <div className="h-20" />
    </div>
  );
};

export default Profile;
