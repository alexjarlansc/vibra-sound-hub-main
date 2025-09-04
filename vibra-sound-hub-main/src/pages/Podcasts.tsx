import React, { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Podcast, Play, Pause, Loader2 } from 'lucide-react';

interface PodcastEpisode { id: string; title: string; description: string; audio_url: string; podcast: string; published_at: string; duration?: number; }

// Mock inicial - substituir depois por Supabase (tabela podcasts_episodes)
const mockEpisodes: PodcastEpisode[] = [
  { id: 'ep1', title: 'Introdução ao Projeto', description: 'Panorama da plataforma e visão futura.', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', podcast: 'Nomix Talks', published_at: '2025-09-04' },
  { id: 'ep2', title: 'Tecnologias Utilizadas', description: 'Stack, decisões técnicas e escalabilidade.', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', podcast: 'Nomix Talks', published_at: '2025-09-04' },
  { id: 'ep3', title: 'Monetização e Futuro', description: 'Planos de monetização e features premium.', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', podcast: 'Nomix Talks', published_at: '2025-09-04' },
];

const Podcasts: React.FC = () => {
  const { current, play, toggle, playing } = usePlayer();
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ setTimeout(()=>{ setEpisodes(mockEpisodes); setLoading(false); }, 400); },[]);

  const isCurrent = (e: PodcastEpisode) => current?.id === e.id;

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
          <Podcast className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Podcasts</h1>
          <p className="text-sm text-muted-foreground">Episódios recentes e conteúdos em áudio.</p>
        </div>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Carregando episódios...</div>
      )}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {episodes.map(ep => (
          <div key={ep.id} className={`group relative rounded-xl border bg-gradient-to-br from-background/60 to-background/20 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition ${isCurrent(ep) ? 'border-primary/60 ring-2 ring-primary/30' : 'border-border/60'}`}> 
            <div className="flex items-start gap-4">
              <button
                onClick={()=> isCurrent(ep) ? toggle() : play({ id: ep.id, title: ep.title, artist: ep.podcast, url: ep.audio_url })}
                className={`mt-1 inline-flex items-center justify-center rounded-full w-12 h-12 shrink-0 transition relative overflow-hidden group ${isCurrent(ep)? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                aria-label={isCurrent(ep) ? (playing ? 'Pausar episódio' : 'Retomar episódio') : 'Reproduzir episódio'}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity" />
                {isCurrent(ep) ? (
                  playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </button>
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
