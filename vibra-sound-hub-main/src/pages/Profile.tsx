import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFollow } from '@/hooks/useFollow';
import ProfileAvatar from '@/components/ProfileAvatar';
import PageShell from '@/components/PageShell';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Crown } from 'lucide-react';

// Placeholder para dados; depois integrar com Supabase
interface Stats { plays: number; uploads: number; downloads: number; followers: number; following: number; }

const Profile = () => {
  const { user, userEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const viewedProfileId = searchParams.get('id') ?? user?.id;
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.user_metadata?.avatar_url);
  const [profileInfo, setProfileInfo] = useState<{ role?: string; is_verified?: boolean; username?: string; email?: string }|null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  // sincroniza quando metadata mudar (ex: após update em outra aba/componente)
  if(user?.user_metadata?.avatar_url !== avatarUrl){
    // evita loop se set for igual
    if(user?.user_metadata?.avatar_url !== avatarUrl){
      setAvatarUrl(user?.user_metadata?.avatar_url);
    }
  }
  const displayName = useMemo(()=>{
    let raw = '';
    // 1) prefer profiles.username
    if(profileInfo?.username && typeof profileInfo.username === 'string' && profileInfo.username.trim()) raw = profileInfo.username.trim();
    // 2) email from profile row
    if(!raw && profileInfo?.email) raw = String(profileInfo.email).split('@')[0];
    // 3) auth metadata
    if(!raw && user?.user_metadata) raw = user.user_metadata.full_name || user.user_metadata.name || user.user_metadata.user_name || '';
    // 4) auth email
    if(!raw && user?.email) raw = user.email.split('@')[0];
    // 5) fallback hook-provided email
    if(!raw && userEmail) raw = String(userEmail).split('@')[0];
    if(!raw) raw = 'Usuário';
    const parts = raw.split(/\s+/).filter(Boolean);
    if(parts.length>1) return parts.slice(0,3).map(p=> p.charAt(0).toUpperCase()+p.slice(1)).join(' ');
    return raw.charAt(0).toUpperCase()+raw.slice(1);
  },[profileInfo?.username, profileInfo?.email, user?.user_metadata, user?.email, userEmail]);

  const stats: Stats = { plays: 0, uploads: 0, downloads: 0, followers: 0, following: 0 };

  // Follow hook: usado para visualização de perfis públicos
  const { isFollowing, followers, following, loading: followLoading, follow, unfollow } = useFollow(viewedProfileId ?? '', user?.id ?? null);

  // Carrega role/is_verified
  useEffect(()=>{
    if(!viewedProfileId) return;
    let canceled = false;
    (async()=>{
      try {
        setProfileLoading(true);
        const { data, error } = await supabase.from('profiles').select('role,is_verified,username,email,avatar_url').eq('id', viewedProfileId).maybeSingle();
        if(!canceled){
          if(!error) {
            setProfileInfo(data as any);
            setAvatarUrl(((data as any)?.avatar_url) ?? user?.user_metadata?.avatar_url);
            try { window.dispatchEvent(new CustomEvent('profile:updated', { detail: { userId: viewedProfileId } })); } catch(e){}
          }
        }
      } finally { if(!canceled) setProfileLoading(false); }
    })();
    return ()=>{ canceled = true; };
  },[viewedProfileId, user?.user_metadata?.avatar_url]);

  return (
    <div className="min-h-screen">
      <PageShell>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
          <ProfileAvatar url={avatarUrl} fallback={displayName} onChange={setAvatarUrl} />
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3 flex-wrap">
                  <span>{displayName}</span>
                  <div className="flex items-center gap-2">
                    {profileInfo?.is_verified && (
                      <img src="/Verified-alt-purple.svg" alt="Verificado" title="Verificado" aria-label="Verificado" className="h-4 w-4 object-contain" />
                    )}
                    {profileInfo?.role === 'admin' && (
                      <span title="Administrador" aria-label="Administrador" className="inline-flex">
                        <Crown className="h-4 w-4 text-amber-500" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  {profileLoading && !profileInfo && (
                    <span className="text-xs text-muted-foreground animate-pulse">Carregando...</span>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Divulgador</p>
                {viewedProfileId && user?.id && viewedProfileId !== user.id && (
                  <div className="mt-3">
                    <button
                      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${isFollowing ? 'bg-foreground text-background' : 'bg-primary text-white'}`}
                      onClick={async()=>{ if(isFollowing) await unfollow(); else await follow(); }}
                      disabled={followLoading}
                      title={isFollowing ? 'Deixar de seguir' : 'Seguir'}
                      aria-pressed={isFollowing}
                    >
                      {followLoading ? 'Carregando...' : (isFollowing ? 'Seguindo' : 'Seguir')}
                    </button>
                  </div>
                )}
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
                  <p className="text-2xl font-bold">{typeof followers === 'number' ? followers : stats.followers}</p>
                  <p className="text-muted-foreground">Seguidores</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{typeof following === 'number' ? following : stats.following}</p>
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
