import { useState } from 'react';
import { useTrendingProfiles } from '@/hooks/useTrendingProfiles';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const COLORS = ['bg-gradient-to-br from-purple-500 to-purple-700','bg-gradient-to-br from-pink-500 to-rose-600','bg-gradient-to-br from-indigo-500 to-indigo-700','bg-gradient-to-br from-emerald-500 to-emerald-600','bg-gradient-to-br from-orange-500 to-amber-600','bg-gradient-to-br from-blue-500 to-cyan-600'];

export default function TrendingProfilesSection(){
  const { data, loading } = useTrendingProfiles({ limit: 12 });
  const [openAll, setOpenAll] = useState(false);

  const list = data.map((p,i)=>({ ...p, color: COLORS[i%COLORS.length] }));

  const Grid = ({items}:{items: typeof list}) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
      {items.map((p,i)=>(
        <div key={p.id} className="flex flex-col items-center text-center space-y-3">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white font-semibold shadow-md ${p.color} relative overflow-hidden`}> 
            {p.avatar_url ? (
              <Avatar className="w-28 h-28">
                <AvatarImage src={p.avatar_url} alt={p.username} />
                <AvatarFallback>{p.username.slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
            ) : (
              <span className="text-lg tracking-wide">
                {p.username.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground truncate max-w-[8rem]">{p.username}</p>
            <p className="text-xs text-muted-foreground">Score {p.score}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mt-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Perfis em Alta</h2>
        </div>
        <Button onClick={()=> setOpenAll(true)} variant="ghost" className="text-primary hover:bg-primary/5" disabled={loading}>
          Ver Todos
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <Grid items={list} />

      <Dialog open={openAll} onOpenChange={setOpenAll}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Top Perfis</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <Grid items={list} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
