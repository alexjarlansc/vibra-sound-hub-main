-- Migration: Auto-follow admins when a new profile is created + backfill

-- 1) Trigger function: when a new profile is inserted, insert into followers a row for each admin
create or replace function public.fn_auto_follow_admins()
returns trigger as $$
begin
  -- Insert follow rows: new user follows all current admins except self
  insert into followers (follower_id, following_id)
  select NEW.id, p.id
  from profiles p
  where p.role = 'admin' and p.id != NEW.id
  on conflict (follower_id, following_id) do nothing;
  return NEW;
end;
$$ language plpgsql security definer;

-- 2) Create trigger on profiles
drop trigger if exists trg_auto_follow_admins on profiles;
create trigger trg_auto_follow_admins
after insert on profiles
for each row
execute function public.fn_auto_follow_admins();

-- 3) Backfill: make all existing non-admin users follow all admins
do $$
begin
  insert into followers (follower_id, following_id)
  select p.id as follower_id, a.id as following_id
  from profiles p cross join profiles a
  where a.role = 'admin' and p.role != 'admin' and p.id != a.id
  on conflict (follower_id, following_id) do nothing;
end;
$$;

-- Note: triggers will only work if RLS allows the operation from the server-side role (security definer),
-- ensure the function runs as a privileged role (security definer) and that the migrations are executed
-- by a role with permission to insert into followers. Client-side attempts to insert may still be blocked
-- by RLS unless policies permit auth.uid() to insert.
