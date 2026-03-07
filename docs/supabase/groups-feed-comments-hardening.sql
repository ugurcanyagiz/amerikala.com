-- Groups Feed + Comments Hardening (safe migration)
-- Purpose:
-- 1) Ensure group feed posts are persisted (`posts.group_id`)
-- 2) Enable group-scoped comments with performant indexes
-- 3) Add baseline RLS policies for group visibility rules

begin;

-- 1) Ensure posts table supports group feed
alter table public.posts
  add column if not exists group_id uuid references public.groups(id) on delete cascade;

create index if not exists idx_posts_group_created_at
  on public.posts(group_id, created_at desc);

create index if not exists idx_comments_post_created_at
  on public.comments(post_id, created_at asc);

-- 2) RLS enablement (idempotent)
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- 3) POSTS policies
-- Read global posts OR group posts if group is public OR requester is approved group member.
drop policy if exists "posts_select_global_or_group_scoped" on public.posts;
create policy "posts_select_global_or_group_scoped"
  on public.posts
  for select
  to authenticated
  using (
    group_id is null
    or exists (
      select 1
      from public.groups g
      where g.id = posts.group_id
        and g.is_private = false
    )
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = posts.group_id
        and gm.user_id = auth.uid()
        and gm.status = 'approved'
    )
  );

-- Create global posts for self OR group posts if approved member.
drop policy if exists "posts_insert_self_or_group_member" on public.posts;
create policy "posts_insert_self_or_group_member"
  on public.posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      group_id is null
      or exists (
        select 1
        from public.group_members gm
        where gm.group_id = posts.group_id
          and gm.user_id = auth.uid()
          and gm.status = 'approved'
      )
    )
  );

-- Owners can update/delete their own posts.
drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
  on public.posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
  on public.posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 4) COMMENTS policies
-- Comment read follows post visibility.
drop policy if exists "comments_select_via_post_visibility" on public.comments;
create policy "comments_select_via_post_visibility"
  on public.comments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = comments.post_id
        and (
          p.group_id is null
          or exists (
            select 1 from public.groups g
            where g.id = p.group_id and g.is_private = false
          )
          or exists (
            select 1 from public.group_members gm
            where gm.group_id = p.group_id
              and gm.user_id = auth.uid()
              and gm.status = 'approved'
          )
        )
    )
  );

-- Comment creation for self and only on visible/allowed posts.
drop policy if exists "comments_insert_self_on_allowed_post" on public.comments;
create policy "comments_insert_self_on_allowed_post"
  on public.comments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.posts p
      where p.id = comments.post_id
        and (
          p.group_id is null
          or exists (
            select 1 from public.group_members gm
            where gm.group_id = p.group_id
              and gm.user_id = auth.uid()
              and gm.status = 'approved'
          )
        )
    )
  );

-- Owners can update/delete their own comments.
drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own"
  on public.comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
  on public.comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

commit;
