import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, ShieldAlert, Loader2, Search } from 'lucide-react';

interface VerificationRow { id:string; user_id:string; reason:string|null; status:string; created_at:string; decided_at:string|null; decided_by:string|null; profiles?: { username:string|null; email:string|null; is_verified:boolean; }; }

const AdminVerifications: React.FC = () => {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<VerificationRow[]>([]);
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState<VerificationRow|null>(null);
  const [acting, setActing] = useState<string|null>(null);

  const rpc = supabase as unknown as { rpc: (fn:string, params?:Record<string,unknown>)=>Promise<{ data:any; error:any }> };

  const load = useCallback(async ()=>{
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*, profiles: user_id ( username, email, is_verified )')
        .order('created_at', { ascending:false })
        .limit(200);
      if(error) throw error;
      setRows(data as VerificationRow[]);
    } catch(e:any){ toast({ title:'Erro ao carregar', description:e.message, variant:'destructive' }); }
    finally { setLoading(false); }
  },[toast]);

  useEffect(()=>{ load(); },[load]);

  const act = useCallback(async (row:VerificationRow, status:'approved'|'rejected')=>{
    if(acting) return; setActing(row.id);
    try {
      // Update direto (política exige admin)
      const { error } = await (supabase.from('verification_requests') as any)
        .update({ status, decided_at: new Date().toISOString(), decided_by: userId })
        .eq('id', row.id)
        .eq('status','pending');
      if(error) throw error;
      toast({ title: status==='approved' ? 'Aprovado' : 'Rejeitado' });
      await load();
    } catch(e:any){ toast({ title:'Erro ação', description:e.message, variant:'destructive' }); }
    finally { setActing(null); }
  },[acting, load, toast, userId]);

  const filtered = rows.filter(r=>{
    if(!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (r.profiles?.username||'').toLowerCase().includes(q) || (r.profiles?.email||'').toLowerCase().includes(q) || (r.reason||'').toLowerCase().includes(q);
  });

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">Aprovação de Verificação <Badge variant="secondary" className="text-xs">Admin</Badge></h1>
          <p className="text-sm text-muted-foreground">Gerencie solicitações de selo verificado.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Filtrar..." value={filter} onChange={e=> setFilter(e.target.value)} className="pl-8 w-60" />
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recarregar'}</Button>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left w-48">Usuário</th>
              <th className="px-3 py-2 text-left">Motivo</th>
              <th className="px-3 py-2 text-left w-28">Status</th>
              <th className="px-3 py-2 text-left w-40">Criado</th>
              <th className="px-3 py-2 text-right w-64">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground text-xs">Carregando...</td></tr>
            )}
            {!loading && filtered.length===0 && (
              <tr><td colSpan={5} className="px-3 py-10 text-center text-muted-foreground text-xs">Nenhuma solicitação.</td></tr>
            )}
            {!loading && filtered.map(r=>{
              const isPending = r.status==='pending';
              return (
                <tr key={r.id} className="border-t hover:bg-muted/40 cursor-pointer" onClick={()=> setDetail(r)}>
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[180px]">{r.profiles?.username || '—'}</span>
                      <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">{r.profiles?.email || '—'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 max-w-[420px]"><span className="line-clamp-2 text-xs text-muted-foreground">{r.reason || '—'}</span></td>
                  <td className="px-3 py-2">
                    <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${r.status==='approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : r.status==='rejected' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>{r.status}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-2 text-right">
                    {isPending ? (
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="outline" disabled={acting===r.id} onClick={(e)=>{ e.stopPropagation(); act(r,'approved'); }} className="h-8 px-3"><ShieldCheck className="h-4 w-4 mr-1"/>Aprovar</Button>
                        <Button size="sm" variant="destructive" disabled={acting===r.id} onClick={(e)=>{ e.stopPropagation(); act(r,'rejected'); }} className="h-8 px-3"><ShieldAlert className="h-4 w-4 mr-1"/>Rejeitar</Button>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!detail} onOpenChange={(o)=> !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitação</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Usuário</p>
                  <p className="font-medium">{detail.profiles?.username || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Email</p>
                  <p>{detail.profiles?.email || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Criado</p>
                  <p>{new Date(detail.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Status</p>
                  <p className="capitalize">{detail.status}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1">Motivo</p>
                <p className="text-xs whitespace-pre-wrap max-h-52 overflow-auto bg-muted/40 p-3 rounded-md border">{detail.reason || '—'}</p>
              </div>
              {detail.status==='pending' && (
                <div className="flex gap-3 pt-2">
                  <Button disabled={acting===detail.id} onClick={()=> act(detail,'approved')} className="flex-1"><ShieldCheck className="h-4 w-4 mr-1"/>Aprovar</Button>
                  <Button variant="destructive" disabled={acting===detail.id} onClick={()=> act(detail,'rejected')} className="flex-1"><ShieldAlert className="h-4 w-4 mr-1"/>Rejeitar</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerifications;
