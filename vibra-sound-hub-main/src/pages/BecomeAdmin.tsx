import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const BecomeAdmin: React.FC = () => {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [alreadyAdmin, setAlreadyAdmin] = useState(false);
  const [existsAdmin, setExistsAdmin] = useState<boolean|null>(null);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(()=>{
    let canceled = false;
    (async()=>{
      try {
        if(!userId){ setError('É preciso estar logado.'); return; }
        const { data: me } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
        if(canceled) return;
        if((me as any)?.role === 'admin'){ setAlreadyAdmin(true); setExistsAdmin(true); return; }
        const { data: admins } = await supabase.from('profiles').select('id').eq('role','admin').limit(1);
        if(canceled) return;
        setExistsAdmin(!!admins && admins.length>0);
      } catch(e:any){ if(!canceled) setError(e.message); }
      finally { if(!canceled) setChecking(false); }
    })();
    return ()=>{ canceled = true; };
  },[userId]);

  const promote = async()=>{
    setPromoting(true); setError(null);
    try {
      const { data, error } = await (supabase.rpc('bootstrap_admin') as any);
      if(error) throw error;
      if(data === 'promoted'){
        toast({ title:'Você agora é admin.' });
        setAlreadyAdmin(true);
      } else if(data === 'admin_already_exists'){
        toast({ title:'Já existe admin', description:'Apenas um bootstrap permitido.' });
        setExistsAdmin(true);
      } else {
        toast({ title:'Retorno inesperado', description:String(data), variant:'destructive' });
      }
    } catch(e:any){ setError(e.message); }
    finally { setPromoting(false); }
  };

  return (
    <div className="max-w-lg mx-auto py-20 px-6 text-center">
      <h1 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2"><Shield className="h-6 w-6"/>Bootstrap Admin</h1>
      {checking && <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin"/>Verificando...</div>}
      {!checking && error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {!checking && !error && alreadyAdmin && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Você já é admin.</p>
      )}
      {!checking && !error && !alreadyAdmin && existsAdmin === true && (
        <p className="text-sm text-muted-foreground">Já existe um administrador configurado. Solicite acesso a ele.</p>
      )}
      {!checking && !error && !alreadyAdmin && existsAdmin === false && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Nenhum admin encontrado. Você pode promover sua conta atual a admin.</p>
          <Button disabled={promoting} onClick={promote}>{promoting ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Tornar-me Admin'}</Button>
        </div>
      )}
    </div>
  );
};

export default BecomeAdmin;
