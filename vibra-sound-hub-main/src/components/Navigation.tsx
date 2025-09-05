import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ListMusic, Radio, X, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Navigation = () => {
  const { userId } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  // Checa se usuário é admin para exibir atalho
  useEffect(()=>{
    let canceled=false;
    (async()=>{
      if(!userId){ setIsAdmin(false); return; }
      try {
  const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  const role = (data as { role?: string } | null)?.role;
  if(!canceled){ setIsAdmin(!error && role === 'admin'); }
      } catch { if(!canceled) setIsAdmin(false); }
    })();
    return ()=>{ canceled=true; };
  },[userId]);
  const navigate = useNavigate();
  interface NavIconItem { key:string; label:string; icon: React.ReactNode; description?:string; onClick?: () => void; }
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string|null>(null);
  const navItems: NavIconItem[] = useMemo(()=>{
    const base: NavIconItem[] = [
      { key:'playlists', label:'Minhas listas de reprodução', icon:<ListMusic className="h-5 w-5"/>, description:'Gerencie e escute suas playlists', onClick:()=>navigate('/playlists') },
      { key:'podcasts', label:'Podcasts (ao vivo)', icon:(
          <span className="relative inline-flex">
            <Radio className="h-5 w-5"/>
            <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
          </span>
        ), description:'Transmissões e episódios em tempo real' },
    ];
    if(isAdmin){
      base.push({ key:'admin-verif', label:'Verificações', icon:<ShieldCheck className="h-5 w-5 text-[#4A0590]"/>, description:'Gerencie solicitações de selo', onClick:()=>navigate('/admin-verifications') });
    }
    return base;
  },[navigate, isAdmin]);

  return (
  <nav className="supports-[backdrop-filter]:bg-background/25 bg-background/60 backdrop-blur-md border-b border-white/10 shadow-[0_2px_14px_-6px_rgba(0,0,0,0.2)] relative">
    <div className="container mx-auto px-4 md:px-6 relative z-10">
      <div className="flex items-center justify-between h-14">
        {/* Ícones principais */}
        <div className="flex items-center gap-2 md:gap-3">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={()=>{ setActive(item.key); setOpen(true); item.onClick?.(); }}
              className={`relative group h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition ${active===item.key ? 'text-primary bg-primary/15 ring-2 ring-primary/40' : ''}`}
              aria-label={item.label}
            >
              {item.icon}
              <span className="sr-only">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Ações secundárias */}
        <div className="hidden lg:flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={()=>navigate('/recentes')}>Recentes</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={()=>navigate('/favoritos')}>Favoritos</Button>
          {userId && (
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90" onClick={()=>navigate('/meus-albuns')}>Meus Álbuns</Button>
          )}
        </div>
      </div>
    </div>

    {/* Painel deslizante */}
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="top" className="pt-6 pb-10 max-h-[70vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-3 text-sm tracking-wide">
            {active ? navItems.find(n=>n.key===active)?.label : 'Navegação'}
            <Button variant="ghost" size="icon" className="ml-auto" onClick={()=>setOpen(false)} aria-label="Fechar"><X className="h-4 w-4"/></Button>
          </SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {navItems.map(item => (
            <div key={item.key} className="p-4 rounded-lg border bg-card/60 backdrop-blur-sm flex flex-col gap-3 hover:border-primary/40 transition cursor-pointer" onClick={()=>{ setOpen(false); item.onClick?.(); }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <div className="font-medium text-sm">{item.label}</div>
              </div>
              {item.description && <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  </nav>
  );
};

export default Navigation;