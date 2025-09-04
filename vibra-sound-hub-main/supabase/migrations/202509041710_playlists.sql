-- Playlists base tables
CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text NULL,
  cover_url text NULL,
  user_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position int DEFAULT 0,
  UNIQUE(playlist_id, track_id)
);

-- RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Policies playlists (somente dono lê/escreve por enquanto)
CREATE POLICY "User read own playlists" ON public.playlists
FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "User insert playlist" ON public.playlists
FOR INSERT WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "User update playlist" ON public.playlists
FOR UPDATE USING ( auth.uid() = user_id ) WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "User delete playlist" ON public.playlists
FOR DELETE USING ( auth.uid() = user_id );

-- Policies playlist_tracks
CREATE POLICY "User read own playlist tracks" ON public.playlist_tracks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.playlists p
    WHERE p.id = playlist_tracks.playlist_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "User insert playlist tracks" ON public.playlist_tracks
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.playlists p
    WHERE p.id = playlist_tracks.playlist_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "User delete playlist tracks" ON public.playlist_tracks
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.playlists p
    WHERE p.id = playlist_tracks.playlist_id AND p.user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_playlists_user ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON public.playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track ON public.playlist_tracks(track_id);
