import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

export interface PlayerTrack { id: string; title: string; artist?: string; url: string; albumId?: string | null; }

interface PlayerState {
  current?: PlayerTrack;
  queue: PlayerTrack[];
  playing: boolean;
  progress: number; // 0-1
  duration: number; // seconds
  volume: number; // 0-1
  buffered: number; // 0-1
  play: (track: PlayerTrack, opts?: { replaceQueue?: boolean }) => void;
  playQueue: (tracks: PlayerTrack[], startIndex?: number) => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  seek: (ratio: number) => void;
  setVolume: (v: number) => void;
  clear: () => void;
}

const PlayerContext = createContext<PlayerState | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [index, setIndex] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  // Ensure audio element
  if(!audioRef.current && typeof Audio !== 'undefined'){
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
  }

  const current = index >=0 ? queue[index] : undefined;

  // Core play function
  const play = useCallback((track: PlayerTrack, opts?: { replaceQueue?: boolean }) => {
    if(!audioRef.current) return;
    // Otimista: já marca como tocando para UI exibir Pause imediatamente
    setPlaying(true);
    if(opts?.replaceQueue){
      setQueue([track]);
      setIndex(0);
    } else {
      setQueue(q => {
        const existing = q.findIndex(t => t.id === track.id);
        if(existing !== -1){
          setIndex(existing);
          return q;
        }
        setIndex(q.length);
        return [...q, track];
      });
    }
  },[]);

  const playQueue = useCallback((tracks: PlayerTrack[], startIndex=0) => {
    if(!tracks.length) return;
    setQueue(tracks);
    setIndex(Math.min(startIndex, tracks.length-1));
  },[]);

  const pause = useCallback(()=>{ if(audioRef.current){ audioRef.current.pause(); setPlaying(false);} },[]);
  const resume = useCallback(()=>{ if(audioRef.current){ audioRef.current.play().catch(()=>{}); setPlaying(true);} },[]);
  const toggle = useCallback(()=>{ if(playing){ pause(); } else { resume(); } },[playing, pause, resume]);

  const next = useCallback(()=>{
    setIndex(i => {
      if(i < 0) return i;
      const nextI = i + 1;
      return nextI < queue.length ? nextI : i; // no loop for now
    });
  },[queue.length]);
  const prev = useCallback(()=>{
    setIndex(i => (i > 0 ? i - 1 : i));
  },[]);

  const seek = useCallback((ratio: number)=>{
    if(!audioRef.current || !duration) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration * ratio, duration));
  },[duration]);

  const setVolume = useCallback((v: number)=>{
    const value = Math.max(0, Math.min(v,1));
    setVolumeState(value);
    if(audioRef.current){ audioRef.current.volume = value; }
  },[]);

  const clear = useCallback(()=>{
    pause();
    setQueue([]); setIndex(-1); setProgress(0); setDuration(0); setBuffered(0);
  },[pause]);

  // Load track when index changes
  useEffect(()=>{
    if(!audioRef.current) return;
    const track = current;
    if(!track){ pause(); return; }
    audioRef.current.src = track.url;
    audioRef.current.load();
    audioRef.current.play().then(()=> setPlaying(true)).catch(()=> setPlaying(false));
  },[current, pause]);

  // Attach events
  useEffect(()=>{
    const audio = audioRef.current;
    if(!audio) return;
    const onTime = () => { if(audio.duration){ setProgress(audio.currentTime / audio.duration); setDuration(audio.duration); } };
    const onEnded = () => { next(); };
    const onProgress = () => {
      try {
        if(audio.buffered.length){
          const end = audio.buffered.end(audio.buffered.length-1);
            if(audio.duration){ setBuffered(end / audio.duration); }
        }
      } catch { /* ignore */ }
    };
    const onError = () => { next(); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('progress', onProgress);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('progress', onProgress);
      audio.removeEventListener('error', onError);
    };
  },[next]);

  // Sync volume
  useEffect(()=>{ if(audioRef.current) audioRef.current.volume = volume; },[volume]);

  const value: PlayerState = { current, queue, playing, progress, duration, volume, buffered, play, playQueue, toggle, pause, resume, next, prev, seek, setVolume, clear };
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export function usePlayer(){
  const ctx = useContext(PlayerContext);
  if(!ctx) throw new Error('usePlayer deve ser usado dentro de PlayerProvider');
  return ctx;
}
