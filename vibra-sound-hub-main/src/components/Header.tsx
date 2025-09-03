import { Search, Upload, LogIn, User, Bell, Menu } from "lucide-react";
import { BRAND } from "@/config/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UploadMusicModal from "@/components/UploadMusicModal";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  // TODO: substituir por estado real de auth (supabase.auth.getUser())
  const { userId, userEmail, user, signInWithEmail, signOut } = useAuth();
  const { toast } = useToast();
  const [showLogin, setShowLogin] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  return (
  <header className="bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto pr-6 pl-2 sm:pl-4">
  <div className="flex items-center justify-between h-28">
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center -ml-1 sm:-ml-2">
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
              {/* Texto oculto apenas para acessibilidade */}
              <h1 className="sr-only">{BRAND.name}</h1>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Busque por artistas, álbuns, playlists..."
                className="pl-12 pr-4 h-12 bg-muted/50 border-none rounded-full focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-background"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
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
            ) : (
              <Button variant="outline" className="px-6 h-10 rounded-full" onClick={()=>signOut()}>Sair</Button>
            )}
            <div className="hidden md:flex items-center space-x-2 pr-2">
              <Avatar className="h-10 w-10 ring-1 ring-border">
                {user?.user_metadata?.avatar_url && (
                  <AvatarImage src={user.user_metadata.avatar_url} />
                )}
                <AvatarFallback className="flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="text-xs leading-tight max-w-[140px] truncate">
                {userId ? (
                  <>
                    <p className="font-medium truncate">{userEmail}</p>
                    <button onClick={()=>signOut()} className="text-primary/70 hover:text-primary text-[10px]">Sair</button>
                  </>
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
            <Button variant="ghost" size="sm" className="md:hidden p-2">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      <UploadMusicModal open={openUpload} onOpenChange={setOpenUpload} userId={userId} />
      <LoginDialog open={showLogin} onOpenChange={setShowLogin} onSubmitEmail={async (email)=>{
        try { await signInWithEmail(email); toast({ title: 'Link de login enviado (verifique seu email).' }); }
        catch(e: any){ toast({ title: 'Erro login', description: e.message, variant: 'destructive'}); }
      }} />
    </header>
  );
};

export default Header;

// Componente simples de login por e-mail magic link
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
interface LoginDialogProps { open: boolean; onOpenChange: (v:boolean)=>void; onSubmitEmail: (email:string)=>Promise<void>; }
const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange, onSubmitEmail }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <Dialog open={open} onOpenChange={o=> !loading && onOpenChange(o)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Entrar</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Digite seu e-mail. Enviaremos um link de acesso.</p>
          <input className="w-full border rounded-md px-3 py-2 text-sm bg-background" placeholder="voce@exemplo.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <DialogFooter className="pt-4">
          <Button variant="outline" disabled={loading} onClick={()=>onOpenChange(false)}>Cancelar</Button>
          <Button disabled={loading || !email} onClick={async ()=>{ try { setLoading(true); await onSubmitEmail(email); } finally { setLoading(false);} }}> {loading ? 'Enviando...' : 'Enviar Link'} </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};