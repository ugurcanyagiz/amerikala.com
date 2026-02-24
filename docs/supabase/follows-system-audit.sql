-- Follows system audit + repair checklist (run manually in Supabase SQL Editor)
-- Scope: table schema, RLS, policies, indexes, data types, and dependency checks.

-- ============================================================
-- A) MINIMAL CHECKLIST (run first)
-- ============================================================

-- A1) Which core tables exist (any schema)?
select
  t.table_schema,
  t.table_name,
  t.table_type
from information_schema.tables t
where t.table_schema not in ('pg_catalog', 'information_schema')
  and t.table_name in ('follows', 'user_blocks', 'profiles', 'friend_requests')
order by t.table_name, t.table_schema;

-- A2) Exact follows columns + data types
select
  c.table_schema,
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_name = 'follows'
  and c.table_schema not in ('pg_catalog', 'information_schema')
order by c.table_schema, c.table_name, c.ordinal_position;

-- A3) follows foreign keys + delete/update rules
select
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema as foreign_table_schema,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  rc.update_rule,
  rc.delete_rule,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.referential_constraints rc
  on tc.constraint_name = rc.constraint_name
 and tc.table_schema = rc.constraint_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = rc.unique_constraint_name
 and ccu.table_schema = rc.unique_constraint_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_name = 'follows'
  and tc.table_schema not in ('pg_catalog', 'information_schema')
order by tc.table_schema, tc.table_name, kcu.column_name;

-- ============================================================
-- B) VERIFY RLS + POLICIES + INDEXES (no guessing)
-- ============================================================

-- B1) Is RLS enabled on follows/profiles/user_blocks/friend_requests?
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname not in ('pg_catalog', 'information_schema')
  and c.relname in ('follows', 'profiles', 'user_blocks', 'friend_requests')
order by c.relname, n.nspname;

-- B2) Policies on follows/user_blocks/friend_requests/profiles
select
  p.schemaname,
  p.tablename,
  p.policyname,
  p.permissive,
  p.roles,
  p.cmd,
  p.qual,
  p.with_check
from pg_policies p
where p.schemaname not in ('pg_catalog', 'information_schema')
  and p.tablename in ('follows', 'profiles', 'user_blocks', 'friend_requests')
order by p.tablename, p.policyname;

-- B3) Indexes on follows/friend_requests
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname not in ('pg_catalog', 'information_schema')
  and tablename in ('follows', 'friend_requests')
order by tablename, indexname;

-- B4) Constraints on follows
select
  c.conname as constraint_name,
  c.contype as constraint_type,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'follows'
order by c.contype, c.conname;

-- ============================================================
-- C) SAFE REPAIR SQL (execute only if checks above show mismatch)
-- ============================================================

-- C1) Canonical follows table shape (public schema)
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- C2) Ensure expected indexes for common read patterns
create index if not exists idx_follows_following_created_at
  on public.follows (following_id, created_at desc);

create index if not exists idx_follows_follower_created_at
  on public.follows (follower_id, created_at desc);

-- C3) Enable RLS + canonical policies
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

-- Optional stricter profile existence validation (if needed):
-- alter table public.follows
--   add constraint follows_follower_id_fk foreign key (follower_id) references public.profiles(id) on delete cascade,
--   add constraint follows_following_id_fk foreign key (following_id) references public.profiles(id) on delete cascade;

-- C4) Optional user_blocks baseline (only if your app needs hard blocks)
-- create table if not exists public.user_blocks (
--   blocker_id uuid not null references public.profiles(id) on delete cascade,
--   blocked_id uuid not null references public.profiles(id) on delete cascade,
--   created_at timestamptz not null default now(),
--   primary key (blocker_id, blocked_id),
--   check (blocker_id <> blocked_id)
-- );
-- create index if not exists idx_user_blocks_blocked_created_at
--   on public.user_blocks (blocked_id, created_at desc);
-- alter table public.user_blocks enable row level security;
-- drop policy if exists "user_blocks_select_participants" on public.user_blocks;
-- create policy "user_blocks_select_participants" on public.user_blocks
-- for select to authenticated
-- using (auth.uid() = blocker_id or auth.uid() = blocked_id);
-- drop policy if exists "user_blocks_insert_own" on public.user_blocks;
-- create policy "user_blocks_insert_own" on public.user_blocks
-- for insert to authenticated
-- with check (auth.uid() = blocker_id and blocker_id <> blocked_id);
-- drop policy if exists "user_blocks_delete_own" on public.user_blocks;
-- create policy "user_blocks_delete_own" on public.user_blocks
-- for delete to authenticated
-- using (auth.uid() = blocker_id);
