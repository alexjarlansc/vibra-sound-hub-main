import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SettingsModalProps { open: boolean; onOpenChange: (v:boolean)=>void; }

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const { user, userEmail } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('stats');
  const [newEmail, setNewEmail] = useState(userEmail||'');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ plays:number; likes:number; downloads:number }|null>(null);
  const [verifRequested, setVerifRequested] = useState(false);
  const [verifLoading, setVerifLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [verifError, setVerifError] = useState<string|null>(null);

  // Carrega estatísticas básicas (placeholders até views reais)
  useEffect(()=>{
    if(!open) return; let canceled=false;
    (async()=>{
      try {
        const rpc = supabase as unknown as { rpc: (fn:string, params?:Record<string,unknown>)=>Promise<{ data:any; error:any }> };
        const { data, error } = await rpc.rpc('get_user_stats');
        if(error) throw error;
        if(!canceled && data){
          const { plays, likes, downloads } = data as { plays:number; likes:number; downloads:number };
          setStats({ plays:Number(plays)||0, likes:Number(likes)||0, downloads:Number(downloads)||0 });
        }
      } catch(e:any){ if(!canceled){ setStats({ plays:0, likes:0, downloads:0 }); } }
    })();
    return ()=>{ canceled=true; };
  },[open]);

  const handleUpdateEmail = useCallback(async ()=>{
    if(!newEmail || newEmail===userEmail) return;
    try { setLoading(true); const { error } = await supabase.auth.updateUser({ email: newEmail }); if(error) throw error; toast({ title:'Email atualizado. Confirme na caixa de entrada.' }); }
    catch(e:any){ toast({ title:'Erro ao atualizar email', description:e.message, variant:'destructive' }); }
    finally { setLoading(false); }
  },[newEmail, userEmail, toast]);

  const handleUpdatePassword = useCallback(async ()=>{
    if(!password) return; try { setLoading(true); const { error } = await supabase.auth.updateUser({ password }); if(error) throw error; toast({ title:'Senha atualizada.' }); setPassword(''); }
    catch(e:any){ toast({ title:'Erro ao atualizar senha', description:e.message, variant:'destructive' }); }
    finally { setLoading(false); }
  },[password, toast]);

  const handleDeleteAccount = useCallback(async ()=>{
    if(!confirm('Tem certeza que deseja desativar sua conta? Você poderá entrar em contato para reativar.')) return;
    try {
      setAccountLoading(true);
      const rpc = supabase as unknown as { rpc: (fn:string, params?:Record<string,unknown>)=>Promise<{ data:any; error:any }> };
      const { error } = await rpc.rpc('deactivate_account');
      if(error) throw error;
      toast({ title:'Conta desativada.' });
    } catch(e:any){ toast({ title:'Erro ao desativar conta', description:e.message, variant:'destructive' }); }
    finally { setAccountLoading(false); }
  },[toast]);

  const handleRequestVerification = useCallback(async ()=>{
    try {
      setVerifLoading(true); setVerifError(null);
      const rpc = supabase as unknown as { rpc: (fn:string, params?:Record<string,unknown>)=>Promise<{ data:any; error:any }> };
      const { data, error } = await rpc.rpc('request_verification', { p_reason: 'Solicitado via modal' });
      if(error) throw error;
      setVerifRequested(true);
      toast({ title:'Solicitação enviada.' });
    } catch(e:any){ setVerifError(e.message||'Erro'); toast({ title:'Erro verificação', description:e.message, variant:'destructive' }); }
    finally { setVerifLoading(false); }
  },[toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configurações da Conta</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="account">Conta</TabsTrigger>
            <TabsTrigger value="verify">Verificação</TabsTrigger>
          </TabsList>
          <TabsContent value="stats" className="space-y-4">
            {stats ? (
              <div className="grid grid-cols-3 gap-4">
                {([
                  { label:'Plays', value: stats.plays },
                  { label:'Likes', value: stats.likes },
                  { label:'Downloads', value: stats.downloads },
                ]).map(s=> (
                  <div key={s.label} className="p-4 rounded-md border bg-muted/30 flex flex-col items-center">
                    <span className="text-2xl font-semibold">{s.value}</span>
                    <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{s.label}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Carregando estatísticas...</p>}
          </TabsContent>
          <TabsContent value="security" className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="flex gap-2">
                <Input value={newEmail} onChange={e=> setNewEmail(e.target.value)} placeholder="novo-email@exemplo.com" />
                <Button disabled={loading || !newEmail || newEmail===userEmail} onClick={handleUpdateEmail}>Atualizar</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Nova Senha</label>
              <div className="flex gap-2">
                <Input type="password" value={password} onChange={e=> setPassword(e.target.value)} placeholder="••••••••" />
                <Button disabled={loading || !password} onClick={handleUpdatePassword}>Alterar</Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="account" className="space-y-4">
            <div className="p-4 rounded-md border bg-destructive/5">
              <h4 className="font-medium text-destructive mb-1">Desativar Conta</h4>
              <p className="text-xs text-muted-foreground mb-3">Sua conta será marcada como inativa. Entre em contato com suporte para reativar.</p>
              <Button variant="destructive" disabled={accountLoading} onClick={handleDeleteAccount}>{accountLoading ? 'Processando...' : 'Desativar Conta'}</Button>
            </div>
          </TabsContent>
          <TabsContent value="verify" className="space-y-4">
            <p className="text-sm text-muted-foreground">Solicite verificação para exibir selo em seu perfil.</p>
            {verifError && <p className="text-xs text-destructive">{verifError}</p>}
            <Button disabled={verifLoading || verifRequested} onClick={handleRequestVerification}>{verifRequested ? 'Solicitação Enviada' : (verifLoading ? 'Enviando...' : 'Solicitar Verificação')}</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;