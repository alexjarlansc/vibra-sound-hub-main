-- Add featured_album_id to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'featured_album_id'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN featured_album_id uuid REFERENCES public.albums(id) ON DELETE SET NULL;
  END IF;
END$$;
