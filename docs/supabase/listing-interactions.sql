-- Listing interaction layer for /emlak/ilan/[id]
-- Adds comments + favorite safety and permissions for authenticated users.

create extension if not exists pgcrypto;

create table if not exists public.listing_comments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_listing_comments_listing_created
  on public.listing_comments (listing_id, created_at desc);

create index if not exists idx_listing_comments_user
  on public.listing_comments (user_id, created_at desc);

alter table public.listing_comments enable row level security;

-- Public can read listing comments for approved listings.
drop policy if exists "listing_comments_select" on public.listing_comments;
create policy "listing_comments_select"
on public.listing_comments
for select
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.status = 'approved'
  )
);

-- Authenticated users can comment on approved listings.
drop policy if exists "listing_comments_insert" on public.listing_comments;
create policy "listing_comments_insert"
on public.listing_comments
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.status = 'approved'
  )
);

-- Users can delete/update only their own comments.
drop policy if exists "listing_comments_update_own" on public.listing_comments;
create policy "listing_comments_update_own"
on public.listing_comments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "listing_comments_delete_own" on public.listing_comments;
create policy "listing_comments_delete_own"
on public.listing_comments
for delete
to authenticated
using (auth.uid() = user_id);

-- Keep updated_at current.
create or replace function public.set_listing_comment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_listing_comments_updated_at on public.listing_comments;
create trigger trg_listing_comments_updated_at
before update on public.listing_comments
for each row execute function public.set_listing_comment_updated_at();

-- Ensure favorites are unique to prevent duplicates from repeated clicks.
create unique index if not exists listing_favorites_unique
  on public.listing_favorites (listing_id, user_id);
