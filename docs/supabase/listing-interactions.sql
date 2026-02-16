-- Listing interaction hardening for /emlak/ilan/[id]
-- Fixes comment write/read and provides direct-message fallback permissions.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1) COMMENTS: table + FK alignment + indexes
-- -----------------------------------------------------------------------------
create table if not exists public.listing_comments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null,
  content text not null check (char_length(trim(content)) between 1 and 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- In many installs this FK was created to auth.users; app uses profiles for joins.
alter table public.listing_comments
  drop constraint if exists listing_comments_user_id_fkey;

alter table public.listing_comments
  add constraint listing_comments_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

create index if not exists idx_listing_comments_listing_created
  on public.listing_comments (listing_id, created_at desc);

create index if not exists idx_listing_comments_user
  on public.listing_comments (user_id, created_at desc);

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

-- -----------------------------------------------------------------------------
-- 2) COMMENTS RLS: allow approved listings OR listing owner access
-- -----------------------------------------------------------------------------
alter table public.listing_comments enable row level security;

drop policy if exists "listing_comments_select" on public.listing_comments;
create policy "listing_comments_select"
on public.listing_comments
for select
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_comments.listing_id
      and (l.status = 'approved' or l.user_id = auth.uid())
  )
);

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
    where l.id = listing_comments.listing_id
      and (l.status = 'approved' or l.user_id = auth.uid())
  )
);

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

-- -----------------------------------------------------------------------------
-- 3) FAVORITES uniqueness
-- -----------------------------------------------------------------------------
create unique index if not exists listing_favorites_unique
  on public.listing_favorites (listing_id, user_id);

-- -----------------------------------------------------------------------------
-- 4) DIRECT MESSAGE FALLBACK TABLE (listing_messages) RLS
-- -----------------------------------------------------------------------------
alter table public.listing_messages enable row level security;

drop policy if exists "listing_messages_select_participants" on public.listing_messages;
create policy "listing_messages_select_participants"
on public.listing_messages
for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "listing_messages_insert_sender" on public.listing_messages;
create policy "listing_messages_insert_sender"
on public.listing_messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and sender_id <> receiver_id
  and exists (
    select 1
    from public.listings l
    where l.id = listing_messages.listing_id
      and l.user_id = listing_messages.receiver_id
  )
);
