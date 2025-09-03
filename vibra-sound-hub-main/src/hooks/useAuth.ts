import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(r => {
      if (mounted) {
        const u = r.data.user;
        setUser(u ?? null);
        setUserId(u?.id ?? null);
        setUserEmail(u?.email ?? null);
        setLoading(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setUserId(u?.id ?? null);
      setUserEmail(u?.email ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return { userId, userEmail, user, loading, signInWithEmail, signOut };
}
