-- Social profile actions setup
-- Enables: friend request flow, follow graph, and direct messages for profile cards.

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1) FOLLOW GRAPH (canonical schema used by app)
-- ----------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists idx_follows_following
  on public.follows (following_id, created_at desc);

alter table public.follows enable row level security;

drop policy if exists "follows_select_authenticated" on public.follows;
create policy "follows_select_authenticated"
on public.follows
for select
to authenticated
using (true);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own"
on public.follows
for insert
to authenticated
with check (auth.uid() = follower_id and follower_id <> following_id);

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own"
on public.follows
for delete
to authenticated
using (auth.uid() = follower_id);

-- ----------------------------------------------------------------------------
-- 2) FRIEND REQUESTS (pending/accepted/rejected)
-- ----------------------------------------------------------------------------
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_id, receiver_id),
  check (requester_id <> receiver_id)
);

create index if not exists idx_friend_requests_receiver_status
  on public.friend_requests (receiver_id, status, created_at desc);

alter table public.friend_requests enable row level security;

drop policy if exists "friend_requests_select_participants" on public.friend_requests;
create policy "friend_requests_select_participants"
on public.friend_requests
for select
to authenticated
using (auth.uid() = requester_id or auth.uid() = receiver_id);

drop policy if exists "friend_requests_insert_requester" on public.friend_requests;
create policy "friend_requests_insert_requester"
on public.friend_requests
for insert
to authenticated
with check (
  auth.uid() = requester_id
  and requester_id <> receiver_id
  and status = 'pending'
);

drop policy if exists "friend_requests_update_participants" on public.friend_requests;
create policy "friend_requests_update_participants"
on public.friend_requests
for update
to authenticated
using (auth.uid() = requester_id or auth.uid() = receiver_id)
with check (
  auth.uid() = requester_id or auth.uid() = receiver_id
);

drop policy if exists "friend_requests_delete_requester" on public.friend_requests;
create policy "friend_requests_delete_requester"
on public.friend_requests
for delete
to authenticated
using (auth.uid() = requester_id);

-- ----------------------------------------------------------------------------
-- 3) MESSAGE TABLES + RPC helper (safe direct conversation creation)
-- ----------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
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

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_conversation_member(_conversation_id uuid, _user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = _conversation_id
      and cp.user_id = _user_id
  );
$$;

revoke all on function public.is_conversation_member(uuid, uuid) from public;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;

drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant"
on public.conversations
for select
to authenticated
using (public.is_conversation_member(id, auth.uid()));

drop policy if exists "conversations_insert_authenticated" on public.conversations;
create policy "conversations_insert_authenticated"
on public.conversations
for insert
to authenticated
with check (true);

drop policy if exists "conversation_participants_select_own_or_member" on public.conversation_participants;
create policy "conversation_participants_select_own_or_member"
on public.conversation_participants
for select
to authenticated
using (user_id = auth.uid() or public.is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "conversation_participants_insert_self_or_creator" on public.conversation_participants;
create policy "conversation_participants_insert_self_or_creator"
on public.conversation_participants
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.conversations c
    where c.id = conversation_participants.conversation_id
      and c.created_by = auth.uid()
  )
);

drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
on public.messages
for select
to authenticated
using (public.is_conversation_member(messages.conversation_id, auth.uid()));

drop policy if exists "messages_insert_sender_participant" on public.messages;
create policy "messages_insert_sender_participant"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_conversation_member(messages.conversation_id, auth.uid())
);

create or replace function public.create_direct_conversation(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_conversation uuid;
  new_conversation uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;

  if target_user_id = current_user_id then
    raise exception 'Cannot create direct conversation with self';
  end if;

  select cp1.conversation_id
  into existing_conversation
  from public.conversation_participants cp1
  join public.conversation_participants cp2
    on cp1.conversation_id = cp2.conversation_id
  where cp1.user_id = current_user_id
    and cp2.user_id = target_user_id
  limit 1;

  if existing_conversation is not null then
    return existing_conversation;
  end if;

  insert into public.conversations (is_group, created_by)
  values (false, current_user_id)
  returning id into new_conversation;

  insert into public.conversation_participants (conversation_id, user_id)
  values
    (new_conversation, current_user_id),
    (new_conversation, target_user_id)
  on conflict (conversation_id, user_id) do nothing;

  return new_conversation;
end;
$$;

revoke all on function public.create_direct_conversation(uuid) from public;
grant execute on function public.create_direct_conversation(uuid) to authenticated;
