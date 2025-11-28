-- Profile multi-handle redesign
-- 1) new profile_handle table with global unique handle and per-user primary flag
create extension if not exists "pgcrypto";

create table if not exists public.profile_handle (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profile(user_id) on delete cascade,
  handle text not null unique,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- allow composite FK (profile.user_id, primary_handle_id) -> (user_id, id)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profile_handle_user_id_id_key'
  ) then
    alter table public.profile_handle
      add constraint profile_handle_user_id_id_key unique (user_id, id);
  end if;
end
$$;

-- single primary handle per user
create unique index if not exists profile_handle_primary_user_idx
  on public.profile_handle(user_id)
  where is_primary;

-- 2) profile table now references primary_handle_id
alter table public.profile
  add column if not exists primary_handle_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profile_primary_handle_fk'
  ) then
    alter table public.profile
      add constraint profile_primary_handle_fk
      foreign key (user_id, primary_handle_id)
      references public.profile_handle(user_id, id)
      on delete set null;
  end if;
end
$$;

-- 3) migrate legacy profile.handle into profile_handle as primary
with inserted as (
  insert into public.profile_handle (user_id, handle, is_primary)
  select user_id, handle, true
  from public.profile
  where handle is not null
  on conflict (handle) do nothing
  returning user_id, id
)
update public.profile p
set primary_handle_id = i.id
from inserted i
where p.user_id = i.user_id;

-- 4) drop legacy handle column (now replaced by profile_handle rows)
alter table public.profile
  drop column if exists handle;
