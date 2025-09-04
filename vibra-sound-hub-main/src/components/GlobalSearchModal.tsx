import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Search, Music2, User, ListMusic, Disc3 } from 'lucide-react';

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (v:boolean)=>void;
  onNavigate: (path:string)=>void;
}

interface SearchResult {
  type: 'track' | 'playlist' | 'album' | 'profile';
  id: string;
  title: string;
  subtitle?: string;
}

// debounce helper
function useDebounce<T>(value:T, delay:number){
  const [debounced,setDebounced] = useState(value);
  useEffect(()=>{ const h = setTimeout(()=> setDebounced(value), delay); return ()=> clearTimeout(h); },[value,delay]);
  return debounced;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ open, onOpenChange, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const debounced = useDebounce(query, 280);

  const runSearch = useCallback(async ()=>{
    if(!debounced.trim()){ setResults([]); return; }
    setLoading(true);
    try {
      const q = debounced.trim();
      // Simple ilike queries with limits. Each may fail if table absent.
      const tasks: Promise<void>[] = [];
      const collected: SearchResult[] = [];
      // tracks
      tasks.push((async()=>{
        const { data, error } = await supabase.from('tracks').select('id, filename, album_id').ilike('filename', `%${q}%`).limit(5);
        if(!error && data){ data.forEach((t:any)=> collected.push({ type:'track', id:t.id, title:t.filename, subtitle:'Faixa' })); }
      })());
      // playlists
      tasks.push((async()=>{
        const { data, error } = await supabase.from('playlists').select('id, name').ilike('name', `%${q}%`).limit(5);
        if(!error && data){ data.forEach((p:any)=> collected.push({ type:'playlist', id:p.id, title:p.name, subtitle:'Playlist' })); }
      })());
      // albums
      tasks.push((async()=>{
        const { data, error } = await supabase.from('albums').select('id, title').ilike('title', `%${q}%`).limit(5);
        if(!error && data){ data.forEach((a:any)=> collected.push({ type:'album', id:a.id, title:a.title, subtitle:'Álbum' })); }
      })());
      // profiles (users) -> assume profile table 'profiles' with username / display_name
      tasks.push((async()=>{
        const { data, error } = await supabase.from('profiles').select('id, display_name, username').or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).limit(5);
        if(!error && data){ data.forEach((u:any)=> collected.push({ type:'profile', id:u.id, title:u.display_name||u.username, subtitle:'Perfil' })); }
      })());
      await Promise.all(tasks);
      // simple ranking: keep order inserted (grouped by type) but ensure deterministic.
      setResults(collected);
    } finally { setLoading(false); }
  },[debounced]);

  useEffect(()=>{ runSearch(); },[runSearch]);

  const iconFor = (t:SearchResult['type']) => {
    switch(t){
      case 'track': return <Music2 className="h-4 w-4" />;
      case 'playlist': return <ListMusic className="h-4 w-4" />;
      case 'album': return <Disc3 className="h-4 w-4" />;
      case 'profile': return <User className="h-4 w-4" />;
    }
  };

  const handleOpenChange = (v:boolean)=>{ if(!v){ setQuery(''); setResults([]); } onOpenChange(v); };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-2">
          <DialogTitle className="text-sm font-semibold tracking-wide flex items-center gap-2"><Search className="h-4 w-4"/> Busca Global</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input autoFocus placeholder="Músicas, playlists, álbuns, perfis..." value={query} onChange={e=>setQuery(e.target.value)} className="pl-9 h-10 rounded-md bg-muted/50" />
          </div>
          <ScrollArea className="max-h-80 pr-2">
            {loading && <div className="text-xs text-muted-foreground py-6 text-center">Buscando...</div>}
            {!loading && !results.length && debounced.trim() && (
              <div className="text-xs text-muted-foreground py-6 text-center">Nenhum resultado</div>
            )}
            <ul className="space-y-1">
              {results.map(r=> (
                <li key={r.type+':'+r.id}>
                  <button
                    onClick={()=>{ handleOpenChange(false); switch(r.type){ case 'track': onNavigate(`/track/${r.id}`); break; case 'album': onNavigate(`/album/${r.id}`); break; case 'playlist': onNavigate(`/playlists`); break; case 'profile': onNavigate(`/perfil/${r.id}`); break; }} }
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/60 text-left text-sm"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">{iconFor(r.type)}</span>
                    <span className="flex-1 truncate">
                      <span className="font-medium leading-tight block truncate">{r.title}</span>
                      {r.subtitle && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.subtitle}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {!debounced.trim() && (
              <div className="text-[11px] text-muted-foreground py-6 text-center">Digite para procurar em todas as categorias.</div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearchModal;