-- Enable RLS (no-ops if already enabled)
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies (ignore errors using DO block)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='albums' AND policyname='Public read albums') THEN
    EXECUTE 'DROP POLICY "Public read albums" ON public.albums';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='albums' AND policyname='Users insert own albums') THEN
    EXECUTE 'DROP POLICY "Users insert own albums" ON public.albums';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tracks' AND policyname='Public read tracks') THEN
    EXECUTE 'DROP POLICY "Public read tracks" ON public.tracks';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tracks' AND policyname='Users insert own tracks') THEN
    EXECUTE 'DROP POLICY "Users insert own tracks" ON public.tracks';
  END IF;
END $$;

-- Read policies
CREATE POLICY "Public read albums" ON public.albums
FOR SELECT USING ( true );

CREATE POLICY "Public read tracks" ON public.tracks
FOR SELECT USING ( true );

-- Insert policies
CREATE POLICY "Users insert own albums" ON public.albums
FOR INSERT WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users insert own tracks" ON public.tracks
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND (
    album_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.albums a
      WHERE a.id = tracks.album_id
      AND a.user_id = auth.uid()
    )
  )
);

-- (Optional future) update policies kept out to restrict edits.
