-- Tabela para registrar downloads de álbuns
create table if not exists public.album_downloads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  album_id uuid not null references public.albums(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null
);

-- Index para consultas por álbum
create index if not exists album_downloads_album_id_idx on public.album_downloads(album_id);
create index if not exists album_downloads_user_id_idx on public.album_downloads(user_id);

-- RLS
alter table public.album_downloads enable row level security;

-- Permitir inserir linha para qualquer usuário autenticado (ou anônimo via função definer)
create policy if not exists "allow_insert_own_download" on public.album_downloads
  for insert to authenticated
  with check (true);

-- Leitura agregada (se quiser permitir):
create policy if not exists "allow_select_downloads" on public.album_downloads
  for select to authenticated, anon using (true);
