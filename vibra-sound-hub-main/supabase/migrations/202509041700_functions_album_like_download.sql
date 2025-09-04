-- Funções RPC para likes e downloads de álbuns
-- toggle_album_like: insere ou remove like do usuário logado
create or replace function public.toggle_album_like(p_album uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_like record;
  v_user uuid;
begin
  -- Obtém usuário autenticado
  select auth.uid() into v_user;
  if v_user is null then
    raise exception 'Usuário não autenticado';
  end if;

  select * into v_like from album_likes where user_id = v_user and album_id = p_album limit 1;
  if found then
    delete from album_likes where id = v_like.id;
  else
    insert into album_likes(album_id, user_id) values (p_album, v_user);
  end if;
end;
$$;

revoke all on function public.toggle_album_like(uuid) from public;
grant execute on function public.toggle_album_like(uuid) to authenticated, anon;

-- register_album_download: registra download (ou incrementa tabela agregadora no futuro)
create or replace function public.register_album_download(p_album uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  select auth.uid() into v_user; -- pode ser null (permitir downloads anônimos se quiser)
  insert into album_downloads(album_id, user_id) values (p_album, v_user);
exception when undefined_table then
  -- fallback: se tabela album_downloads não existir ignora silenciosamente
  raise notice 'Tabela album_downloads ausente, ignorando registro';
end;
$$;

revoke all on function public.register_album_download(uuid) from public;
grant execute on function public.register_album_download(uuid) to authenticated, anon;
