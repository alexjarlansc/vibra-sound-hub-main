import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense, lazy } from 'react';
import { PlayerProvider } from '@/context/PlayerContext';
const Index = lazy(()=> import('./pages/Index'));
const NotFound = lazy(()=> import('./pages/NotFound'));
const MyAlbums = lazy(()=> import('./pages/MyAlbums'));
const TopMusics = lazy(()=> import('./pages/TopMusics'));
const Profile = lazy(()=> import('./pages/Profile'));
const Favorites = lazy(()=> import('./pages/Favorites'));
const Playlists = lazy(()=> import('./pages/Playlists'));
const AdminVerifications = lazy(()=> import('./pages/AdminVerifications'));
const BecomeAdmin = lazy(()=> import('./pages/BecomeAdmin'));
import RootLayout from "@/layouts/RootLayout";
import ErrorBoundary from '@/components/ErrorBoundary';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PlayerProvider>
          <ErrorBoundary>
        <Routes>
          <Route element={<RootLayout />}> {/* Rotas que compartilham header/player */}
            <Route path="/" element={<Suspense fallback={<div className='p-10 text-center text-sm text-muted-foreground'>Carregando...</div>}><Index /></Suspense>} />
            <Route path="/meus-albuns" element={<Suspense fallback={<div className='p-10 text-center text-sm text-muted-foreground'>Carregando...</div>}><MyAlbums /></Suspense>} />
            <Route path="/top-musicas" element={<Suspense fallback={<div className='p-10 text-center text-sm text-muted-foreground'>Carregando...</div>}><TopMusics /></Suspense>} />
            <Route path="/perfil" element={<Suspense fallback={<div className='p-10 text-center text-sm text-muted-foreground'>Carregando...</div>}><Profile /></Suspense>} />
            <Route path="/favoritos" element={<Suspense fallback={<div className='p-10 text-center text-sm text-muted-foreground'>Carregando...</div>}><Favorites /></Suspense>} />
            <Route path="/playlists" element={<Suspense fallback={<div className='p-10 text-center text-sm text-muted-foreground'>Carregando...</div>}><Playlists /></Suspense>} />
            <Route path="/admin/verification" element={<Suspense fallback={<div className='p-10 text-center text-sm text-muted-foreground'>Carregando...</div>}><AdminVerifications /></Suspense>} />
            <Route path="/become-admin" element={<Suspense fallback={<div className='p-10 text-center text-sm text-muted-foreground'>Carregando...</div>}><BecomeAdmin /></Suspense>} />
          </Route>
          <Route path="*" element={<Suspense fallback={<div className='p-10 text-center text-sm text-muted-foreground'>Carregando...</div>}><NotFound /></Suspense>} />
  </Routes>
          </ErrorBoundary>
        </PlayerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
