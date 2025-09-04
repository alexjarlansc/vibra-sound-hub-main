import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import MusicPlayer from '@/components/MusicPlayer';
import MiniPlayer from '@/components/MiniPlayer';

// Layout global com Header e Player fixos em todas as páginas
// Main recebe padding-top e padding-bottom para não ser encoberto
export default function RootLayout(){
  const { pathname } = useLocation();
  const showNav = pathname === '/';
  // Garante que ao entrar em qualquer página o scroll inicial seja o topo
  useEffect(()=>{
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  },[pathname]);
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header fixo (já possui sticky) */}
      <Header />
      {/* Navigation também fica sticky logo abaixo do header */}
      {showNav && (
        <div className="sticky top-[112px] z-40">{/* altura efetiva do header ~112-120px */}
          <Navigation />
        </div>
      )}
  <main className={`flex-1 pb-40 sm:pb-36 ${showNav ? 'pt-4 sm:pt-6' : ''}`}>
        {/* bottom padding para player; top suave */}
        <Outlet />
      </main>
  <MusicPlayer />
  <MiniPlayer />
    </div>
  );
}
