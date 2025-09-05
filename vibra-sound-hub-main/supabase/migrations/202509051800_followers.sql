-- Migration: followers table para sistema de seguir perfis
create table if not exists followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (follower_id, following_id)
);
-- Permitir apenas seguir outros perfis (não a si mesmo)
create policy "Permitir seguir outros" on followers for insert using (follower_id != following_id);
-- Permitir deletar apenas o próprio follow
create policy "Permitir deixar de seguir" on followers for delete using (auth.uid() = follower_id);
-- Permitir visualizar seguidores/seguindo
create policy "Permitir visualizar follows" on followers for select using (true);
-- Ativar RLS
alter table followers enable row level security;
