import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTrendingProfiles } from '@/hooks/useTrendingProfiles';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';

export default function Top50ArtistsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o:boolean)=>void }){
  const { data: profiles = [], loading } = useTrendingProfiles({ limit: 50 });
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Top 50 Artistas</h3>
          <div className="text-sm text-muted-foreground">{profiles.length} artistas</div>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}
          {profiles.map((p:any, idx:number)=> (
            <div key={p.id || idx} className="flex items-center justify-between gap-3 p-2 rounded hover:bg-muted/40 cursor-pointer" onClick={()=> navigate(`/perfil/${p.id}`)}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="rounded-full p-1 bg-green-500">
                    <img src={p.avatar_url || (import.meta.env.DEV ? '/logo-nomix.svg' : '/placeholder.svg')} alt={p.username || 'Artista'} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
                  </div>
                  {/* purple rank badge */}
                  <span className="absolute -top-2 -right-2 text-xs bg-violet-100 text-violet-700 rounded-full w-6 h-6 flex items-center justify-center font-semibold">{idx+1}</span>
                  <div className="absolute -bottom-1 -left-1 flex items-center gap-1">
                    {p.is_verified && (
                      <img src="/Verified-alt-purple.svg" alt="Verificado" title="Verificado" className="h-4 w-4 object-contain" />
                    )}
                    {p.role === 'admin' && (
                      <span className="bg-amber-400 rounded-full p-0.5 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 8l4 2 3-4 3 4 3-4 3 4 4-2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z" fill="#F59E0B"/></svg>
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <span>{p.username || p.name}</span>
                    {(p.is_verified || p.isVerified) && (
                      <img src="/Verified-alt-purple.svg" alt="Verificado" title="Verificado" className="h-4 w-4 object-contain" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.plays_count ? `${p.plays_count.toLocaleString()} plays` : '0 plays'}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Perfil</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={()=> onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
