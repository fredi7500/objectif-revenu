create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  trial_start_date timestamptz not null default timezone('utc', now()),
  is_premium boolean not null default false
);

alter table public.users enable row level security;

create policy "users can read own row"
on public.users
for select
to authenticated
using (auth.uid() = id);

create policy "users can insert own row"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

create policy "users can update own row"
on public.users
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
  insert into public.users (id, email, trial_start_date, is_premium)
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

insert into public.users (id, email, created_at, trial_start_date, is_premium)
select
  au.id,
  coalesce(au.email, ''),
  coalesce(au.created_at, timezone('utc', now())),
  coalesce(au.created_at, timezone('utc', now())),
  false
from auth.users au
on conflict (id) do nothing;
