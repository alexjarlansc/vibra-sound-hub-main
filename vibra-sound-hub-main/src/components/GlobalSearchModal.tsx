import React, { useEffect, useState, useCallback } from 'react';
import { usePlayer } from '@/context/PlayerContext';
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
  file_url?: string; // para tracks
  album_id?: string | null;
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
  const { play, addToQueue } = usePlayer();

  // Catálogo de gêneros (visual apenas / seta consulta ao clicar)
  const genres: { name: string; emoji: string; from: string; to: string; }[] = [
    { name: 'Forró', emoji: '🎹', from: 'from-orange-500', to: 'to-rose-500' },
    { name: 'Axé', emoji: '🪘', from: 'from-amber-700', to: 'to-amber-400' },
    { name: 'Arrocha', emoji: '🕺', from: 'from-rose-600', to: 'to-pink-600' },
    { name: 'Reggae', emoji: '🦁', from: 'from-yellow-400', to: 'to-green-500' },
    { name: 'Piseiro', emoji: '🎛️', from: 'from-fuchsia-700', to: 'to-pink-600' },
    { name: 'Brega', emoji: '🌷', from: 'from-red-700', to: 'to-rose-400' },
    { name: 'Arrochadeira', emoji: '🪩', from: 'from-purple-800', to: 'to-pink-500' },
    { name: 'Gospel', emoji: '🕊️', from: 'from-cyan-400', to: 'to-sky-500' },
    { name: 'Pagode', emoji: '💘', from: 'from-pink-500', to: 'to-fuchsia-600' },
    { name: 'Rap/Hip-Hop', emoji: '🎧', from: 'from-zinc-600', to: 'to-zinc-400' },
    { name: 'Sertanejo', emoji: '🤠', from: 'from-amber-500', to: 'to-orange-500' },
    { name: 'Pop', emoji: '🪅', from: 'from-indigo-500', to: 'to-slate-700' },
    { name: 'Swingueira', emoji: '🤣', from: 'from-stone-800', to: 'to-amber-400' },
    { name: 'MPB', emoji: '💚', from: 'from-emerald-700', to: 'to-teal-500' },
    { name: 'Brega Funk', emoji: '🔥', from: 'from-amber-600', to: 'to-orange-700' },
    { name: 'Rock', emoji: '🤘', from: 'from-red-700', to: 'to-black' },
    { name: 'Variados', emoji: '🎼', from: 'from-zinc-700', to: 'to-zinc-500' },
    { name: 'Eletrônica', emoji: '📡', from: 'from-slate-800', to: 'to-cyan-600' },
    { name: 'Samba', emoji: '🥁', from: 'from-red-800', to: 'to-rose-600' },
    { name: 'Podcast', emoji: '🎙️', from: 'from-indigo-800', to: 'to-blue-700' },
    { name: 'Funk', emoji: '👑', from: 'from-teal-700', to: 'to-fuchsia-600' },
    { name: 'Trap', emoji: '💎', from: 'from-violet-800', to: 'to-indigo-500' },
    { name: 'Frevo', emoji: '🏖️', from: 'from-orange-500', to: 'to-yellow-400' },
  ];

  const runSearch = useCallback(async ()=>{
    if(!debounced.trim()){ setResults([]); return; }
    setLoading(true);
    try {
      const q = debounced.trim();
      // Simple ilike queries with limits. Each may fail if table absent.
      const tasks: Promise<void>[] = [];
      const collected: SearchResult[] = [];
      // tracks por nome ou por gênero do álbum
      tasks.push((async()=>{
        // Primeiro tenta por filename
  const { data: t1, error: e1 } = await supabase.from('tracks').select('id, filename, album_id, file_url').ilike('filename', `%${q}%`).limit(5);
  if(!e1 && t1){ t1.forEach((t:any)=> collected.push({ type:'track', id:t.id, title:t.filename, subtitle:'Faixa', file_url: t.file_url, album_id: t.album_id })); }
        // Se termo parece gênero (palavra sem espaços grande) buscar álbuns desse gênero e listar algumas faixas deles
        if(q.length >=3){
          const { data: alb, error: eAlb } = await supabase.from('albums').select('id, name, genre').ilike('genre', `%${q}%`).limit(3) as any;
          if(!eAlb && alb && alb.length){
            const albumIds = alb.map(a=> a.id);
            const { data: tByGenre } = await supabase.from('tracks').select('id, filename, album_id, file_url').in('album_id', albumIds).limit(5);
            if(tByGenre){ tByGenre.forEach((t:any)=> collected.push({ type:'track', id:t.id, title:t.filename, subtitle:'Faixa por gênero', file_url: t.file_url, album_id: t.album_id })); }
            // também empurra pseudo resultados de álbum já que a query principal de álbum busca por title e não por genre
            alb.forEach((a:any)=> collected.push({ type:'album', id:a.id, title:a.name, subtitle:a.genre || 'Álbum' }));
          }
        }
      })());
      // playlists
      tasks.push((async()=>{
        const { data, error } = await supabase.from('playlists').select('id, name').ilike('name', `%${q}%`).limit(5);
        if(!error && data){ data.forEach((p:any)=> collected.push({ type:'playlist', id:p.id, title:p.name, subtitle:'Playlist' })); }
      })());
  // albums (por nome) - manter existente
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
          <ScrollArea className="h-80 pr-2">
            {loading && <div className="text-xs text-muted-foreground py-6 text-center">Buscando...</div>}
            {!loading && !results.length && debounced.trim() && (
              <div className="text-xs text-muted-foreground py-6 text-center">Nenhum resultado</div>
            )}
            <ul className="space-y-1">
              {results.map(r=> (
                <li key={r.type+':'+r.id}>
                  <button
                    onClick={()=>{ 
                      handleOpenChange(false);
                      if(r.type === 'track' && r.file_url){
                        play({ id: r.id, title: r.title, url: r.file_url, albumId: r.album_id || null });
                      } else if(r.type === 'album') { onNavigate(`/album/${r.id}`); }
                      else if(r.type === 'playlist') { onNavigate(`/playlists`); }
                      else if(r.type === 'profile') { onNavigate(`/perfil/${r.id}`); }
                    }}
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
            {!debounced.trim() && !results.length && (
              <div className="pt-2 pb-4 space-y-3">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-1">Gêneros populares</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {genres.map(g=> (
                    <button
                      key={g.name}
                      onClick={()=> setQuery(g.name)}
                      className={`group relative rounded-xl p-3 text-left text-white text-sm font-medium bg-gradient-to-br ${g.from} ${g.to} shadow-sm hover:shadow-md transition hover:scale-[1.015] focus:outline-none focus:ring-2 focus:ring-white/30`}
                      aria-label={`Pesquisar gênero ${g.name}`}
                    >
                      <span className="block pr-6 leading-snug drop-shadow-sm">{g.name}</span>
                      <span className="absolute right-2 bottom-2 text-lg opacity-80 group-hover:opacity-100 transition-transform group-hover:scale-110 select-none pointer-events-none">{g.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearchModal;