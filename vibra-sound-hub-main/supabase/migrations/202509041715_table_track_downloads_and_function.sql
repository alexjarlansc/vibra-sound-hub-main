-- Tabela de downloads de faixas
create table if not exists public.track_downloads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null
);

create index if not exists track_downloads_track_id_idx on public.track_downloads(track_id);
create index if not exists track_downloads_user_id_idx on public.track_downloads(user_id);

alter table public.track_downloads enable row level security;

create policy if not exists "allow_insert_track_download" on public.track_downloads
  for insert to authenticated
  with check (true);

create policy if not exists "allow_select_track_downloads" on public.track_downloads
  for select to authenticated, anon using (true);

-- Função RPC para registrar download de track
create or replace function public.register_track_download(p_track uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  select auth.uid() into v_user; -- pode ser null (anônimo)
  insert into track_downloads(track_id, user_id) values (p_track, v_user);
exception when undefined_table then
  raise notice 'track_downloads ausente';
end;
$$;

revoke all on function public.register_track_download(uuid) from public;
grant execute on function public.register_track_download(uuid) to authenticated, anon;
