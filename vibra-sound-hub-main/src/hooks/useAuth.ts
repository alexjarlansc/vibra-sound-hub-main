import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async r => {
      if (mounted) {
        const u = r.data.user;
        setUser(u ?? null);
        setUserId(u?.id ?? null);
        setUserEmail(u?.email ?? null);
        setLoading(false);
        // Se já houver full_name nos metadados ao inicializar, tenta sincronizar imediatamente
        try {
          if (u?.id && u.user_metadata && (u.user_metadata as any).full_name) {
            const full = String((u.user_metadata as any).full_name).trim();
            if (full) {
              const { error } = await (supabase.from('profiles') as any).upsert([{ id: u.id, username: full }], { onConflict: 'id' });
              if (error) {
                // expor o erro no console para diagnóstico (p.ex. RLS)
                // não interrompe a inicialização
                // eslint-disable-next-line no-console
                console.warn('[useAuth] upsert profiles failed on init:', error.message || error);
              } else {
                try { window.dispatchEvent(new CustomEvent('profile:updated', { detail: { userId: u.id } })); } catch(e){}
              }
            }
          }
        } catch(e) { /* não bloqueia a inicialização */ }
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setUserId(u?.id ?? null);
      setUserEmail(u?.email ?? null);
      // sincroniza full_name->profiles.username quando entrar
      (async()=>{
        try {
          if(u?.id && u.user_metadata && (u.user_metadata as any).full_name){
            const full = String((u.user_metadata as any).full_name).trim();
            if(full){
              // upsert para garantir username preenchido
              const { error } = await (supabase.from('profiles') as any).upsert([{ id: u.id, username: full }], { onConflict: 'id' });
              if (error) {
                // eslint-disable-next-line no-console
                console.warn('[useAuth] upsert profiles failed on auth change:', error.message || error);
              } else {
                try { window.dispatchEvent(new CustomEvent('profile:updated', { detail: { userId: u.id } })); } catch(e){}
              }
            }
          }
        } catch(e){ /* não bloqueia a autenticação */ }
      })();
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  // Força a sincronização do username em profiles a partir dos metadados do auth (full_name) ou do email
  const syncProfileFromAuth = async () => {
    try {
      const r = await supabase.auth.getUser();
      const u = r.data.user;
      if(!u?.id) return { ok:false, message: 'usuário não autenticado' };
      const metaName = (u.user_metadata as any)?.full_name ? String((u.user_metadata as any).full_name).trim() : null;
      const fallback = u.email ? String(u.email).split('@')[0] : null;
      const username = metaName || fallback || null;
      if(!username) return { ok:false, message: 'nome não disponível nos metadados nem no email' };
      const { error } = await (supabase.from('profiles') as any).upsert([{ id: u.id, username }], { onConflict: 'id' });
      if(error) return { ok:false, message: error.message };
      try { window.dispatchEvent(new CustomEvent('profile:updated', { detail: { userId: u.id } })); } catch(e){}
      return { ok:true };
    } catch(e:any){ return { ok:false, message: e?.message || String(e) }; }
  };

  return { userId, userEmail, user, loading, signInWithEmail, signOut, syncProfileFromAuth };
}
