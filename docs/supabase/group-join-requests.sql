-- Group Join Requests table + RLS
-- Run in Supabase SQL editor.

begin;

create table if not exists public.group_join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  updated_at timestamptz not null default now(),
  constraint group_join_requests_group_id_user_id_key unique (group_id, user_id)
);

alter table public.group_join_requests
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists group_id uuid,
  add column if not exists user_id uuid,
  add column if not exists answer text,
  add column if not exists status text default 'pending',
  add column if not exists created_at timestamptz default now(),
  add column if not exists reviewed_by uuid,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists updated_at timestamptz default now();

alter table public.group_join_requests
  alter column id set default gen_random_uuid(),
  alter column group_id set not null,
  alter column user_id set not null,
  alter column status set default 'pending',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.group_join_requests
  drop constraint if exists group_join_requests_status_check;
alter table public.group_join_requests
  add constraint group_join_requests_status_check
  check (status in ('pending','approved','rejected'));

alter table public.group_join_requests
  drop constraint if exists group_join_requests_group_id_fkey;
alter table public.group_join_requests
  add constraint group_join_requests_group_id_fkey
  foreign key (group_id) references public.groups(id) on delete cascade;

alter table public.group_join_requests
  drop constraint if exists group_join_requests_user_id_fkey;
alter table public.group_join_requests
  add constraint group_join_requests_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.group_join_requests
  drop constraint if exists group_join_requests_reviewed_by_fkey;
alter table public.group_join_requests
  add constraint group_join_requests_reviewed_by_fkey
  foreign key (reviewed_by) references public.profiles(id) on delete set null;

create unique index if not exists group_join_requests_group_user_unique_idx
  on public.group_join_requests (group_id, user_id);

alter table public.group_join_requests
  drop constraint if exists group_join_requests_group_id_user_id_key;
alter table public.group_join_requests
  add constraint group_join_requests_group_id_user_id_key
  unique using index group_join_requests_group_user_unique_idx;

create index if not exists idx_group_join_requests_group_status_created
  on public.group_join_requests(group_id, status, created_at desc);

alter table public.group_join_requests enable row level security;

drop policy if exists "group_join_requests_insert_self" on public.group_join_requests;
create policy "group_join_requests_insert_self"
  on public.group_join_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

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
