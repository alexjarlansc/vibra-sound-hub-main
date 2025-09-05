import { Search, Upload, LogIn, User, Bell, Menu, ChevronRight, Heart, Settings, LogOut, FileMusic, PlusSquare, User2, ListMusic, ShieldCheck, Crown } from "lucide-react";
import { SelectFeaturedAlbumModal } from '@/components/SelectFeaturedAlbumModal';
import GlobalSearchModal from '@/components/GlobalSearchModal';
import { BRAND } from "@/config/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UploadMusicModal from "@/components/UploadMusicModal";
import React, { useState, useEffect } from "react";
import SettingsModal from '@/components/SettingsModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  // TODO: substituir por estado real de auth (supabase.auth.getUser())
  const { userId, userEmail, user, signInWithEmail, signOut } = useAuth();
  const { toast } = useToast();
  const [showLogin, setShowLogin] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [profileName, setProfileName] = useState<string|null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string|null>(user?.user_metadata?.avatar_url ?? null);
  useEffect(()=>{
    let canceled=false;
    (async()=>{
      if(!userId){ setIsAdmin(false); setIsVerified(false); return; }
      try {
        const { data, error } = await (await import('@/integrations/supabase/client')).supabase.from('profiles').select('role,is_verified').eq('id', userId).maybeSingle();
        if(!canceled){ setIsAdmin(!error && (data as any)?.role === 'admin'); setIsVerified(!error && Boolean((data as any)?.is_verified)); }
      } catch { if(!canceled){ setIsAdmin(false); setIsVerified(false); } }
    })();
    return ()=>{ canceled=true; };
  },[userId]);
  const [openSearch, setOpenSearch] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  // Deriva nome amigável do usuário
  // keeps profile name in sync with DB
  useEffect(() => {
    if (!userId) { setProfileName(null); return; }
    let canceled = false;
    (async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.from('profiles').select('username,avatar_url').eq('id', userId).maybeSingle();
        // debug: log response to help diagnose why profiles.username isn't used
        try { console.debug('[Header] profiles query', { userId, data, error }); } catch(e){}
        if (!canceled) {
          if (!error) {
            setProfileName((data as any)?.username ?? null);
            setAvatarUrl(((data as any)?.avatar_url) ?? (user?.user_metadata?.avatar_url ?? null));
          } else {
            setProfileName(null);
            setAvatarUrl(user?.user_metadata?.avatar_url ?? null);
          }
        }
      } catch (e) {
        try { console.warn('[Header] profiles fetch failed', e); } catch(e){}
      }
    })();

    const onUpdated = (e: any) => {
      if (e?.detail?.userId === userId) {
        (async () => {
          try {
            const { supabase } = await import('@/integrations/supabase/client');
            const { data, error } = await supabase.from('profiles').select('username,avatar_url').eq('id', userId).maybeSingle();
            try { console.debug('[Header] profile:updated event fetched', { userId, data, error }); } catch(e){}
            setProfileName((data as any)?.username ?? null);
            setAvatarUrl(((data as any)?.avatar_url) ?? (user?.user_metadata?.avatar_url ?? null));
          } catch (e) { try{ console.warn('[Header] profile:updated handler failed', e); }catch(e){} }
        })();
      }
    };

    window.addEventListener('profile:updated', onUpdated as EventListener);
    return () => { canceled = true; window.removeEventListener('profile:updated', onUpdated as EventListener); };
  }, [userId, user?.user_metadata?.avatar_url]);

  const displayName = (() => {
    if (!userId) return null;
    // 1) prefer username from profiles table
    if (profileName && typeof profileName === 'string' && profileName.trim()) {
      const raw = profileName.trim();
      const parts = raw.split(/\s+/).filter(Boolean);
      if (parts.length > 1) return parts.slice(0, 2).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    // 2) fallback to auth metadata
    const meta = user?.user_metadata || {};
    const raw = meta.full_name || meta.name || meta.user_name || meta.username || '';
    const cleaned = raw.trim().replace(/\s+/g, ' ');
    if (cleaned) {
      const parts = cleaned.split(' ').filter(Boolean);
      const first = parts[0];
      const last = parts.length > 1 ? parts[parts.length - 1] : '';
      const format = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
      return [format(first), format(last)].filter(Boolean).join(' ');
    }
    if (userEmail) {
      const base = userEmail.split('@')[0].replace(/[._-]+/g, ' ');
      const parts = base.split(' ').filter(Boolean);
      const first = parts[0];
      const last = parts.length > 1 ? parts[parts.length - 1] : '';
      const format = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
      return [format(first), format(last)].filter(Boolean).join(' ');
    }
    return 'Usuário';
  })();
  return (
  <header className="sticky top-0 z-50 supports-[backdrop-filter]:bg-background/25 bg-background/60 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-xl border-b border-white/10 shadow-[0_2px_18px_-6px_rgba(0,0,0,0.25)] relative before:absolute before:inset-0 before:pointer-events-none before:bg-gradient-to-br before:from-white/5 before:via-white/2 before:to-transparent after:absolute after:inset-0 after:pointer-events-none after:bg-[radial-gradient(circle_at_80%_-10%,rgba(255,255,255,0.18),transparent_60%)]">
  <div className="container mx-auto pr-6 pl-2 sm:pl-4 relative z-10">
  <div className="flex items-center justify-between h-24 sm:h-28">
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center -ml-1 sm:-ml-2">
              <button
                type="button"
                aria-label="Ir para início"
                onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none hover:shadow-none bg-transparent p-0 m-0"
              >
                <img
                  src={BRAND.logo.icon}
                  alt={BRAND.name}
                  className="select-none transition-transform duration-300 hover:scale-110 w-[110px] h-[110px] sm:w-[128px] sm:h-[128px]"
                  draggable={false}
                  style={{ objectFit: 'contain' }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.outerHTML = `<div class='w-[128px] h-[128px] flex items-center justify-center text-white font-bold text-4xl bg-gradient-primary'>${BRAND.fallbackInitial}</div>`;
                  }}
                />
              </button>
              {/* Texto oculto apenas para acessibilidade */}
              <h1 className="sr-only">{BRAND.name}</h1>
            </div>
          </div>

          {/* Centro vazio (ícones movidos para a direita) */}
          <div className="flex-1" />

          {/* Action Buttons + Ícones (Playlists / Podcasts ao vivo) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Ícones: Busca / Playlists / Podcasts ao vivo */}
            <button
              aria-label="Buscar"
              onClick={()=> setOpenSearch(true)}
              className="hidden md:flex h-10 w-10 rounded-full items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={()=>navigate('/playlists')}
              aria-label="Minhas listas de reprodução"
              className="hidden md:flex h-10 w-10 rounded-full items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
            >
              <ListMusic className="h-5 w-5" />
            </button>
            <Button variant="ghost" size="sm" className="hidden lg:flex hover:bg-muted/50" onClick={()=>{
              if(!userId){
                toast({ title: 'Faça login para enviar.' });
                setShowLogin(true);
                return;
              }
              setOpenUpload(true);
            }}>
              <Upload className="h-4 w-4 mr-2" />
              Fazer Upload
            </Button>
            {userId && (
              <Button variant="ghost" size="sm" className="hidden md:flex p-2">
                <Bell className="h-5 w-5" />
              </Button>
            )}
            {!userId ? (
              <Button
                className="relative group px-7 h-10 rounded-full font-medium text-sm text-white overflow-hidden focus-visible:ring-2 focus-visible:ring-primary/40 transition-all bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_4px_22px_-2px_rgba(99,102,241,0.45)]"
                onClick={()=> setShowLogin(true)}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.18),transparent_60%)]" />
                <span className="relative flex items-center">
                  <LogIn className="h-4 w-4 mr-2 drop-shadow" />
                  <span className="tracking-wide">Entrar</span>
                </span>
              </Button>
            ) : null}
            <div className="hidden md:flex items-center space-x-2 pr-2 cursor-pointer select-none" onClick={()=> userId ? setOpenUserMenu(true) : setShowLogin(true)}>
              <Avatar className="h-10 w-10 ring-1 ring-border" aria-label={profileName ?? displayName}>
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={profileName ?? displayName} />
                ) : (
                  user?.user_metadata?.avatar_url ? (
                    <AvatarImage src={user.user_metadata.avatar_url} alt={profileName ?? displayName} />
                  ) : (
                    <AvatarFallback className="flex items-center justify-center">
                      { (profileName ?? displayName) ? (
                        <span className="text-[12px] font-medium">{String((profileName ?? displayName)).trim().split(/\s+/).map(s=>s[0]?.toUpperCase()).slice(0,2).join('')}</span>
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      ) }
                    </AvatarFallback>
                  )
                )}
              </Avatar>
              <div className="text-xs leading-tight max-w-[180px] truncate">
                {userId ? (
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">Olá, {profileName ?? displayName}</p>
                    <div className="flex items-center gap-1">
                      {isVerified && (
                        <img src="/Verified-alt-purple.svg" alt="Verificado" className="h-6 w-6" />
                      )}
                      {isAdmin && <Crown className="h-4 w-4 text-amber-500" />}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={()=> setShowLogin(true)}
                    className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors underline decoration-dotted underline-offset-2"
                  >
                    Entrar
                  </button>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden p-2 h-9 w-9" aria-label="Menu" onClick={()=> setOpenUserMenu(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      <UploadMusicModal open={openUpload} onOpenChange={setOpenUpload} userId={userId} />
          <LoginDialog open={showLogin} onOpenChange={setShowLogin} onSubmitEmail={async (email)=>{
            try { await signInWithEmail(email); toast({ title: 'Link de login enviado (verifique seu email).' }); }
            catch(err: unknown){
              const msg = err instanceof Error ? err.message : 'Erro inesperado';
              toast({ title: 'Erro login', description: msg, variant: 'destructive'});
            }
          }} onSignedUp={setProfileName} />
      {/* Sheet menu do usuário */}
      <Sheet open={openUserMenu} onOpenChange={setOpenUserMenu}>
        <SheetContent side="right" className="p-0 flex flex-col">
          <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
            <SheetHeader className="items-start text-left">
              <SheetTitle className="flex items-center gap-3 text-base font-semibold">
                <img src="/favicon.ico" alt="Premium" className="w-10 h-10 rounded-md shadow-sm" />
                <span>Seja um <span className="text-primary">Nomix Premium</span></span>
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-1">Aproveite áudio em alta qualidade e downloads ilimitados.</p>
              <Button size="sm" className="mt-3 rounded-full px-5 text-xs font-medium" variant="default">Conhecer Planos</Button>
            </SheetHeader>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="px-2 space-y-1 text-sm">
              <li>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted/50 transition-colors text-left" onClick={()=>{ navigate('/perfil'); setOpenUserMenu(false); }}>
                  <User2 className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">Meu Perfil</span>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
              </li>
              <li>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted/50 transition-colors text-left" onClick={()=>{ setOpenUpload(true); setOpenUserMenu(false); }}>
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">Upload de CDs/Músicas</span>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
              </li>
              <li>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted/50 transition-colors text-left" onClick={()=>{ navigate('/playlists'); setOpenUserMenu(false); }}>
                  <PlusSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">Minhas Playlists</span>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
              </li>
              <li>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted/50 transition-colors text-left" onClick={()=>{ navigate('/meus-albuns'); setOpenUserMenu(false); }}>
                  <FileMusic className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">Meus CDs/Músicas</span>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
              </li>
              <li>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted/50 transition-colors text-left" onClick={()=>{ navigate('/favoritos'); setOpenUserMenu(false); }}>
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">Meus Favoritos</span>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
              </li>
              <li>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted/50 transition-colors text-left" onClick={()=>{ setOpenSettings(true); }}>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">Configurações</span>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
              </li>
            </ul>
          </nav>
          <div className="border-t p-4">
            {isAdmin && (
              <Button variant="ghost" size="sm" className="w-full justify-start gap-3 mb-2" onClick={()=>{ navigate('/admin-verifications'); setOpenUserMenu(false); }}>
                <ShieldCheck className="w-4 h-4" />
                <span>Verificações</span>
              </Button>
            )}
            {isAdmin && (
              <Button variant="ghost" size="sm" className="w-full justify-start gap-3 mb-2" onClick={()=>{ setShowFeaturedModal(true); setOpenUserMenu(false); }}>
                <FileMusic className="w-4 h-4" />
                <span>Selecionar álbum em destaque</span>
              </Button>
            )}
            
            <Button variant="ghost" size="sm" className="w-full justify-start gap-3" onClick={()=>{ signOut(); setOpenUserMenu(false); }}>
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </Button>
            <SelectFeaturedAlbumModal open={showFeaturedModal} onClose={()=>setShowFeaturedModal(false)} userId={userId} />
          </div>
        </SheetContent>
      </Sheet>
  <GlobalSearchModal open={openSearch} onOpenChange={setOpenSearch} onNavigate={navigate} />
  <SettingsModal open={openSettings} onOpenChange={setOpenSettings} />
  </header>
  );
};

export default Header;

// Componente simples de login por e-mail magic link
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
interface LoginDialogProps { open: boolean; onOpenChange: (v:boolean)=>void; onSubmitEmail: (email:string)=>Promise<void>; onSignedUp?: (name:string)=>void }
const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange, onSignedUp }) => {
  // Tabs agora apenas para senha e cadastro
  const [tab, setTab] = useState<'password'|'signup'>('password');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const signInOAuth = async (provider: 'google'|'facebook'|'apple') => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({ provider, options:{ redirectTo: window.location.origin } });
      if(error) throw error;
    } catch(err: unknown){
      const msg = err instanceof Error ? err.message : 'Erro inesperado';
      toast({ title: 'Erro OAuth', description: msg, variant: 'destructive'});
    } finally { setLoading(false); }
  };

  const signInPassword = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if(error) throw error;
      onOpenChange(false);
    } catch(err: unknown){
      const msg = err instanceof Error ? err.message : 'Erro login';
      toast({ title: 'Erro login', description: msg, variant: 'destructive'});
    } finally { setLoading(false); }
  };

  const signUp = async () => {
    try {
      setLoading(true);
      // validação: nome completo obrigatório (nome e sobrenome)
      if(!fullName || fullName.trim().split(/\s+/).length < 2){
        toast({ title: 'Informe nome e sobrenome.', variant: 'destructive' });
        setLoading(false); return;
      }
      // envia user_metadata.full_name para supabase auth
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName.trim() } } });
      if(error) throw error;
  // optimistic UI: notify parent to display the signed-up name immediately while we await user id/upsert
  try { onSignedUp?.(fullName.trim()); } catch(e) {}
      // signUp may not create an active session; try to obtain the user id from the response or poll getUser()
      (async ()=>{
        try{
          let userId = data?.user?.id ?? null;
          // poll a few times in case the auth record is created asynchronously
          const maxAttempts = 6;
          let attempt = 0;
          while(!userId && attempt < maxAttempts){
            attempt += 1;
            await new Promise(r => setTimeout(r, 800));
            try { const r = await supabase.auth.getUser(); userId = r.data.user?.id ?? null; } catch(e){}
          }
          if(userId){
            const { error: upserr } = await (supabase.from('profiles') as any).upsert([{ id: userId, username: fullName.trim(), email }], { onConflict: 'id' });
            if(upserr){ console.warn('[Header] upsert profiles after signup failed:', upserr.message || upserr); }
            else { try { window.dispatchEvent(new CustomEvent('profile:updated', { detail: { userId } })); } catch(e){} }
          }
        }catch(e){ /* não bloqueia */ }
      })();
      toast({ title: 'Verifique seu e-mail para confirmar.' });
      // Após cadastro, direciona para aba de login por senha
      setTab('password');
    } catch(err: unknown){
      const msg = err instanceof Error ? err.message : 'Erro cadastro';
      toast({ title: 'Erro cadastro', description: msg, variant: 'destructive'});
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={o=> !loading && onOpenChange(o)}>
  <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4 text-lg">Entrar
            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Beta</span>
          </DialogTitle>
        </DialogHeader>
  <div className="space-y-5 relative pt-3">

          {/* Logo idêntica ao cabeçalho */}
          <div className="flex flex-col items-center mt-0.5 mb-1.5 select-none">
            <img
              src={BRAND.logo.icon}
              alt={BRAND.name}
              draggable={false}
              className="select-none transition-transform duration-300 hover:scale-110 w-[140px] h-[140px] sm:w-[170px] sm:h-[170px]"
              style={{ objectFit: 'contain' }}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.outerHTML = `<div class='w-[128px] h-[128px] flex items-center justify-center text-white font-bold text-4xl bg-gradient-primary rounded-xl'>${BRAND.fallbackInitial}</div>`;
              }}
            />
          </div>

          {/* Tabs compactadas abaixo da logo */}
          <div className="flex justify-center -mt-0.5 mb-2">
            <div className="flex items-center gap-1 bg-background/60 backdrop-blur-sm px-1.5 py-1 rounded-full border border-border/40 shadow-sm">
              <button
                onClick={()=>setTab('password')}
                className={`px-2.5 h-7 rounded-full text-[10px] font-medium transition-colors tracking-wide ${tab==='password'
                  ?'bg-primary text-primary-foreground shadow'
                  :'text-foreground/65 hover:text-foreground hover:bg-muted/60'}`}
              >Entrar</button>
              <button
                onClick={()=>setTab('signup')}
                className={`px-2.5 h-7 rounded-full text-[10px] font-medium transition-colors tracking-wide ${tab==='signup'
                  ?'bg-primary text-primary-foreground shadow'
                  :'text-foreground/65 hover:text-foreground hover:bg-muted/60'}`}
              >Criar Conta</button>
            </div>
          </div>

          {tab==='password' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Entre com e-mail e senha.</p>
              <input className="w-full border rounded-md px-3 py-2 text-sm bg-background" placeholder="voce@exemplo.com" value={email} onChange={e=>setEmail(e.target.value)} />
              <input type="password" className="w-full border rounded-md px-3 py-2 text-sm bg-background" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />
              <Button disabled={loading || !email || password.length<6} className="w-full" onClick={signInPassword}>{loading? 'Entrando...':'Entrar'}</Button>
              <button onClick={()=>setTab('signup')} className="text-xs text-primary hover:underline">Precisa criar conta?</button>
            </div>
          )}

          {tab==='signup' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Crie uma conta para continuar.</p>
              <input className="w-full border rounded-md px-3 py-2 text-sm bg-background" placeholder="Nome completo (obrigatório)" value={fullName} onChange={e=>setFullName(e.target.value)} />
              <input className="w-full border rounded-md px-3 py-2 text-sm bg-background" placeholder="voce@exemplo.com" value={email} onChange={e=>setEmail(e.target.value)} />
              <input type="password" className="w-full border rounded-md px-3 py-2 text-sm bg-background" placeholder="Senha (mín 6)" value={password} onChange={e=>setPassword(e.target.value)} />
              <Button disabled={loading || !email || password.length<6 || !fullName || fullName.trim().split(/\s+/).length<2} className="w-full" onClick={signUp}>{loading? 'Criando...':'Cadastrar'}</Button>
              <button onClick={()=>setTab('password')} className="text-xs text-primary hover:underline">Já tem conta? Entrar</button>
            </div>
          )}

          <div className="relative">
            <div className="flex items-center gap-4 my-4 text-xs text-muted-foreground">
              <span className="flex-1 h-px bg-border" />
              <span>ou</span>
              <span className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" disabled={loading} onClick={()=>signInOAuth('google')} className="h-10 text-xs flex items-center gap-1.5">
                <span className="inline-flex w-4 h-4 aspect-square items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="w-full h-full">
                    <path fill="#EA4335" d="M12 11.99v3.9h5.45c-.24 1.4-.98 2.58-2.09 3.37l3.38 2.62c1.97-1.82 3.11-4.5 3.11-7.73 0-.74-.07-1.45-.2-2.13H12Z" />
                    <path fill="#34A853" d="M5.27 14.62a5.93 5.93 0 0 1-.32-1.9c0-.66.12-1.3.32-1.9L1.72 8.16A10.02 10.02 0 0 0 1 12.72c0 1.62.39 3.15 1.08 4.5l3.19-2.6Z" />
                    <path fill="#FBBC05" d="M12 5.36c1.64 0 3.11.56 4.27 1.64l3.18-3.18A10.4 10.4 0 0 0 12 2C7.7 2 3.99 4.46 2.08 8.16l3.19 2.66C6 7.94 8.73 5.36 12 5.36Z" />
                    <path fill="#4285F4" d="M12 22c2.73 0 5.02-.9 6.69-2.44l-3.33-2.6c-.9.63-2.07 1-3.36 1-3.27 0-6-2.58-6.73-6.02l-3.19 2.6C3.99 19.54 7.7 22 12 22Z" />
                  </svg>
                </span>
                <span>Google</span>
              </Button>
              <Button variant="outline" disabled={loading} onClick={()=>signInOAuth('facebook')} className="h-10 text-xs flex items-center gap-1.5">
                <span className="inline-flex w-4 h-4 aspect-square items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="w-full h-full"><path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.436H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.492 0-1.956.93-1.956 1.887v2.255h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z"/></svg>
                </span>
                <span>Facebook</span>
              </Button>
              <Button variant="outline" disabled={loading} onClick={()=>signInOAuth('apple')} className="h-10 text-xs flex items-center gap-1.5">
                <span className="inline-flex w-4 h-4 aspect-square items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="w-full h-full fill-current"><path d="M16.365 1.43c0 1.14-.417 2.072-1.25 2.793-.9.848-1.982 1.34-3.162 1.264-.016-1.108.432-2.068 1.28-2.81.416-.368.94-.672 1.57-.896.63-.24 1.23-.376 1.78-.448.016.032.016.064.016.096.016.032.016.064.016.096.016.064.016.128.016.192 0 .064.016.128.016.192.016.064.016.128.016.192 0 .064 0 .112.016.16v.08Zm5.053 16.46c-.46 1.054-1.01 2.01-1.667 2.857-.88 1.14-1.598 1.922-2.14 2.34-.78.704-1.62 1.07-2.524 1.086-.64 0-1.41-.176-2.31-.543-.9-.352-1.73-.527-2.51-.527-.812 0-1.66.175-2.557.527-.897.367-1.635.56-2.214.576-.873.032-1.73-.336-2.572-1.12-.544-.464-1.278-1.28-2.202-2.432-.944-1.186-1.726-2.568-2.363-4.162C.46 14.84.142 13.336.142 11.88c0-1.744.38-3.247 1.156-4.51.608-1.004 1.42-1.808 2.412-2.384A6.325 6.325 0 0 1 6.555 4c.656 0 1.516.2 2.572.64 1.04.432 1.71.64 1.99.64.224 0 .944-.24 2.14-.72 1.147-.432 2.118-.608 2.91-.56 2.15.176 3.77 1.022 4.84 2.56-1.916 1.167-2.87 2.81-2.854 4.928.016 1.648.608 3.023 1.778 4.11.528.496 1.12.88 1.778 1.152-.144.4-.304.8-.48 1.2Z"/></svg>
                </span>
                <span>Apple</span>
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button variant="ghost" disabled={loading} onClick={()=>onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};