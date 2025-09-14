-- Migration: create track_likes table and RLS policies
-- Run this in your Supabase SQL editor or via supabase CLI

create table if not exists public.track_likes (
  id uuid default gen_random_uuid() primary key,
  track_id uuid not null references public.tracks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.track_likes enable row level security;

-- Policy: allow authenticated users to insert their own likes
create policy "allow_insert_own" on public.track_likes
  for insert using (auth.role() = 'authenticated') with check (user_id = auth.uid());

-- Policy: allow authenticated users to delete their own likes
create policy "allow_delete_own" on public.track_likes
  for delete using (user_id = auth.uid());

-- Policy: allow public select (so the frontend can read likes counts)
create policy "allow_select_public" on public.track_likes
  for select using (true);

-- Index to speed counts
create index if not exists idx_track_likes_track_id on public.track_likes(track_id);
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
