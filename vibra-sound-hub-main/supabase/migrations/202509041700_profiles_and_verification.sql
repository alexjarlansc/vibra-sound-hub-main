-- Criação de estrutura de perfis, solicitações de verificação e funções auxiliares
-- Idempotente: usa IF NOT EXISTS onde aplicável

-- 1. Tabela profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  email text,
  avatar_url text,
  role text default 'user',
  is_verified boolean default false,
  deactivated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Atualizador de updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

create or replace trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

-- 3. Função para inserir profile no signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, split_part(new.email,'@',1))
  on conflict (id) do nothing;
  return new;
end;$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4. RLS + Políticas profiles
alter table public.profiles enable row level security;
-- leitura pública (ajuste se quiser restringir)
create policy if not exists profiles_select_all on public.profiles for select using ( true );
-- update somente dono
create policy if not exists profiles_update_own on public.profiles for update using ( auth.uid() = id );
-- delete apenas admin
create policy if not exists profiles_delete_admin on public.profiles for delete using ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') );

-- 5. Tabela verification_requests
create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  created_at timestamptz default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id)
);

alter table public.verification_requests enable row level security;
create policy if not exists vr_select_own_or_admin on public.verification_requests
for select using (
  auth.uid() = user_id
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy if not exists vr_insert_own on public.verification_requests
for insert with check ( auth.uid() = user_id );
create policy if not exists vr_update_admin on public.verification_requests
for update using ( exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') );

-- 6. Trigger aplicação verificação
create or replace function public.apply_verification()
returns trigger language plpgsql as $$
begin
  if NEW.status = 'approved' and OLD.status <> 'approved' then
    update public.profiles set is_verified = true where id = NEW.user_id;
  elsif NEW.status = 'rejected' and OLD.status = 'approved' then
    update public.profiles set is_verified = false where id = NEW.user_id;
  end if;
  return NEW;
end;$$;

drop trigger if exists trg_vr_after_update on public.verification_requests;
create trigger trg_vr_after_update
after update on public.verification_requests
for each row execute function public.apply_verification();

-- 7. RPC: solicitar verificação
create or replace function public.request_verification(p_reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  existing_id uuid;
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;
  select id into existing_id from verification_requests where user_id = auth.uid() and status in ('pending','approved') order by created_at desc limit 1;
  if existing_id is not null then
    return existing_id; -- já existe
  end if;
  insert into verification_requests(user_id, reason) values (auth.uid(), p_reason) returning id into new_id;
  return new_id;
end;$$;

-- 8. RPC: desativar conta (soft delete)
create or replace function public.deactivate_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;
  update public.profiles set deactivated_at = now(), is_verified = false where id = auth.uid();
end;$$;

-- 9. (Opcional) views de estatísticas simples (cria se não existir) - placeholders
-- Ajuste para suas tabelas reais de plays/downloads/likes.
create or replace function public.get_user_stats()
returns table(plays bigint, likes bigint, downloads bigint) language sql security definer set search_path = public as $$
  select 0::bigint as plays, 0::bigint as likes, 0::bigint as downloads;
$$;

-- 10. Índices auxiliares
create index if not exists idx_profiles_username on public.profiles (lower(username));
create index if not exists idx_verification_requests_user on public.verification_requests (user_id, status);
