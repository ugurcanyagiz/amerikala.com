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


-- -----------------------------------------------------------------------------
-- 5) CORE /messages TABLES (create if missing) + RLS
-- -----------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  name text,
  is_group boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_conversation_participants_user
  on public.conversation_participants (user_id, conversation_id);

create index if not exists idx_messages_conversation_created
  on public.messages (conversation_id, created_at desc);

create index if not exists idx_messages_sender_created
  on public.messages (sender_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- conversations
drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant"
on public.conversations
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = conversations.id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "conversations_insert_authenticated" on public.conversations;
create policy "conversations_insert_authenticated"
on public.conversations
for insert
to authenticated
with check (true);

-- conversation_participants
drop policy if exists "conversation_participants_select_own_conversations" on public.conversation_participants;
create policy "conversation_participants_select_own_conversations"
on public.conversation_participants
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.conversation_participants cp2
    where cp2.conversation_id = conversation_participants.conversation_id
      and cp2.user_id = auth.uid()
  )
);

drop policy if exists "conversation_participants_insert_participant" on public.conversation_participants;
create policy "conversation_participants_insert_participant"
on public.conversation_participants
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.conversation_participants cp2
    where cp2.conversation_id = conversation_participants.conversation_id
      and cp2.user_id = auth.uid()
  )
);

-- messages
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "messages_insert_sender_participant" on public.messages;
create policy "messages_insert_sender_participant"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
  )
);
