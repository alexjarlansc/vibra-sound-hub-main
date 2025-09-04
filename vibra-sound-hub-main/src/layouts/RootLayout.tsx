import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import MusicPlayer from '@/components/MusicPlayer';

// Layout global com Header e Player fixos em todas as páginas
// Main recebe padding-top e padding-bottom para não ser encoberto
export default function RootLayout(){
  const { pathname } = useLocation();
  const showNav = pathname === '/';
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
      <main className={`flex-1 pb-36 ${showNav ? 'pt-6' : ''}`}>
        {/* bottom padding para player; top suave */}
        <Outlet />
      </main>
      <MusicPlayer />
    </div>
  );
}
