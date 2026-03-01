create extension if not exists pgcrypto;

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('emlak', 'is', 'alisveris')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index if not exists idx_favorites_user_id on public.favorites (user_id);
create index if not exists idx_favorites_target on public.favorites (target_type, target_id);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
on public.favorites
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites
for delete
to authenticated
using (user_id = auth.uid());
