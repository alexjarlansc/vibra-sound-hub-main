import React, { useEffect, useState, useCallback } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Podcast, Loader2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PodcastEpisode { id: string; title: string; description: string; audio_url: string; podcast: string; published_at: string; duration?: number; }

// Mock inicial - substituir depois por Supabase (tabela podcasts_episodes)
const mockEpisodes: PodcastEpisode[] = [
  { id: 'ep1', title: 'Introdução ao Projeto', description: 'Panorama da plataforma e visão futura.', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', podcast: 'Nomix Talks', published_at: '2025-09-04' },
  { id: 'ep2', title: 'Tecnologias Utilizadas', description: 'Stack, decisões técnicas e escalabilidade.', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', podcast: 'Nomix Talks', published_at: '2025-09-04' },
  { id: 'ep3', title: 'Monetização e Futuro', description: 'Planos de monetização e features premium.', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', podcast: 'Nomix Talks', published_at: '2025-09-04' },
];

const Podcasts: React.FC = () => {
  const { clear, play, current, playing, toggle } = usePlayer();
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ 
    // Carrega mock
    const t = setTimeout(()=>{ setEpisodes(mockEpisodes); setLoading(false); }, 400); 
    // Garante que nenhum áudio permaneça tocando nesta página
    clear();
    return ()=> clear();
  },[clear]);

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <Podcast className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Podcasts</h1>
            <p className="text-sm text-muted-foreground">Episódios recentes e conteúdos em áudio.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            className="h-12 px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg flex items-center gap-2"
            onClick={()=>{
              if(current && mockEpisodes.find(e=> e.id===current.id)) { toggle(); return; }
              const first = mockEpisodes[0];
              if(first) play({ id:first.id, title:first.title, artist:first.podcast, url:first.audio_url }, { replaceQueue:true });
            }}
            aria-label={playing? 'Pausar' : 'Tocar'}
          >
            {playing && current && mockEpisodes.some(e=> e.id===current.id) ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            <span>{playing && current && mockEpisodes.some(e=> e.id===current.id) ? 'Pausar' : 'Tocar'}</span>
          </Button>
        </div>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Carregando episódios...</div>
      )}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {episodes.map(ep => (
          <div key={ep.id} className="group relative rounded-xl border border-border/60 bg-gradient-to-br from-background/60 to-background/20 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition"> 
            <div className="flex items-start gap-4">
              <div className="mt-1 flex items-center justify-center rounded-xl w-12 h-12 shrink-0 bg-primary/10 text-primary text-sm font-semibold select-none">
                EP
              </div>
              <div className="flex-1">
                <h3 className="font-semibold leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">{ep.title}</h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-3">{ep.description}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                  <span>{new Date(ep.published_at).toLocaleDateString('pt-BR')}</span>
                  <span>{ep.podcast}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && !episodes.length && (
        <div className="mt-10 text-center text-sm text-muted-foreground">Nenhum episódio disponível.</div>
      )}
    </div>
  );
};

export default Podcasts;
