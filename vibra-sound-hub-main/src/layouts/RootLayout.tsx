import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/Header';
import MusicPlayer from '@/components/MusicPlayer';
import MiniPlayer from '@/components/MiniPlayer';

// Layout global com Header e Player fixos em todas as páginas
// Main recebe padding-top e padding-bottom para não ser encoberto
export default function RootLayout(){
  const { pathname } = useLocation();
  const showNav = false; // Navegação separada desativada (ícones movidos para Header)
  const hidePlayers = pathname.startsWith('/podcasts');
  // Garante que ao entrar em qualquer página o scroll inicial seja o topo
  useEffect(()=>{
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  },[pathname]);
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header fixo (já possui sticky) */}
      <Header />
  {/* Navegação removida */}
  <main className="flex-1 pb-40 sm:pb-36">
        {/* bottom padding para player; top suave */}
        <Outlet />
      </main>
  {!hidePlayers && <MusicPlayer />}
  {!hidePlayers && <MiniPlayer />}
    </div>
  );
}
