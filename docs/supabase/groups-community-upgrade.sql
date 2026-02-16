-- Groups Community Upgrade (Supabase/Postgres)
-- References:
-- https://supabase.com/docs/guides/database/postgres/row-level-security
-- https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control
-- https://www.postgresql.org/docs/current/ddl-alter.html

begin;

-- 1) Enrich groups with application flow
alter table public.groups
  add column if not exists application_question text,
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'private'));

update public.groups
set visibility = case when is_private then 'private' else 'public' end
where visibility is null;

-- Keep old fields synced for backwards compatibility.
create or replace function public.sync_group_privacy_flags()
returns trigger
language plpgsql
as $$
begin
  if new.visibility = 'private' then
    new.is_private := true;
    new.requires_approval := true;
  else
    new.is_private := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_group_privacy_flags on public.groups;
create trigger trg_sync_group_privacy_flags
before insert or update on public.groups
for each row execute function public.sync_group_privacy_flags();

-- 2) Group join application table (supports optional answer + moderation)
create table if not exists public.group_join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_id, user_id)
);

create index if not exists idx_group_join_requests_group_status
  on public.group_join_requests(group_id, status, created_at desc);

-- 3) Attach feed + events to groups
alter table public.posts
  add column if not exists group_id uuid references public.groups(id) on delete cascade;
create index if not exists idx_posts_group_created
  on public.posts(group_id, created_at desc);

alter table public.events
  add column if not exists group_id uuid references public.groups(id) on delete set null,
  add column if not exists invite_all_group_members boolean not null default false;
create index if not exists idx_events_group_date
  on public.events(group_id, event_date asc, start_time asc);

-- 4) RLS policies (enable if not already enabled)
alter table public.group_join_requests enable row level security;

-- Applicant can create request for themselves.
drop policy if exists "group_join_requests_insert_self" on public.group_join_requests;
create policy "group_join_requests_insert_self"
  on public.group_join_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Applicant can read own request; group admins/moderators can read all requests in their group.
drop policy if exists "group_join_requests_select_scoped" on public.group_join_requests;
create policy "group_join_requests_select_scoped"
  on public.group_join_requests
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_join_requests.group_id
        and gm.user_id = auth.uid()
        and gm.status = 'approved'
        and gm.role in ('admin','moderator')
    )
  );

-- Only group admins/moderators can review requests.
drop policy if exists "group_join_requests_update_moderation" on public.group_join_requests;
create policy "group_join_requests_update_moderation"
  on public.group_join_requests
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_join_requests.group_id
        and gm.user_id = auth.uid()
        and gm.status = 'approved'
        and gm.role in ('admin','moderator')
    )
  )
  with check (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_join_requests.group_id
        and gm.user_id = auth.uid()
        and gm.status = 'approved'
        and gm.role in ('admin','moderator')
    )
  );

commit;
