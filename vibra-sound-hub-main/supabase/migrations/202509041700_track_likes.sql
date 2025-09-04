-- Create track_likes table
CREATE TABLE IF NOT EXISTS public.track_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.track_likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read track_likes" ON public.track_likes
FOR SELECT USING ( true );

CREATE POLICY "Users like tracks" ON public.track_likes
FOR INSERT WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users unlike their track likes" ON public.track_likes
FOR DELETE USING ( auth.uid() = user_id );

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_track_likes_track ON public.track_likes(track_id);
CREATE INDEX IF NOT EXISTS idx_track_likes_user ON public.track_likes(user_id);
