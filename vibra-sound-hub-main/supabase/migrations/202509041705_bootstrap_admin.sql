-- Função para promover o primeiro usuário autenticado a admin caso não exista nenhum.
create or replace function public.bootstrap_admin()
returns text
language plpgsql
security definer
set search_path = public as $$
declare
  admin_exists boolean;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;
  select exists(select 1 from public.profiles where role = 'admin') into admin_exists;
  if admin_exists then
    return 'admin_already_exists';
  end if;
  update public.profiles set role = 'admin' where id = auth.uid();
  return 'promoted';
end;$$;
