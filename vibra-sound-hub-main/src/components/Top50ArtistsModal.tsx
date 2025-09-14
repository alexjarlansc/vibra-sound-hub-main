import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTrendingProfiles } from '@/hooks/useTrendingProfiles';
import { useNavigate } from 'react-router-dom';

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
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold">{idx+1}</div>
                <div>
                  <div className="font-medium">{p.username || p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.plays_count ? `${p.plays_count.toLocaleString()} plays` : ''}</div>
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
