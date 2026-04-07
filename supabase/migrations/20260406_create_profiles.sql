create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  trial_start_date timestamptz not null default timezone('utc', now()),
  is_premium boolean not null default false
);

alter table public.profiles enable row level security;

drop policy if exists "profiles can read own row" on public.profiles;
create policy "profiles can read own row"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles can insert own row" on public.profiles;
create policy "profiles can insert own row"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles can update own row" on public.profiles;
create policy "profiles can update own row"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, trial_start_date, is_premium)
  values (new.id, coalesce(new.email, ''), timezone('utc', now()), false)
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

do $$
begin
  if to_regclass('public.users') is not null then
    insert into public.profiles (id, email, created_at, trial_start_date, is_premium)
    select
      u.id,
      coalesce(u.email, ''),
      coalesce(u.created_at, timezone('utc', now())),
      coalesce(u.trial_start_date, timezone('utc', now())),
      coalesce(u.is_premium, false)
    from public.users u
    on conflict (id) do nothing;
  end if;
end;
$$;

insert into public.profiles (id, email, created_at, trial_start_date, is_premium)
select
  au.id,
  coalesce(au.email, ''),
  coalesce(au.created_at, timezone('utc', now())),
  coalesce(au.created_at, timezone('utc', now())),
  false
from auth.users au
on conflict (id) do nothing;
