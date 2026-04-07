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
