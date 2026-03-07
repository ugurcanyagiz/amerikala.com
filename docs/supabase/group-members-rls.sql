-- Group Members RLS hardening aligned with app/groups/[slug]/page.tsx flows.
-- Run in Supabase SQL editor.
--
-- Covered client flows:
-- - handleRequestDecision: moderator/admin can approve pending user membership (pending -> approved/member)
-- - handleRoleChange: only group creator(admin) can assign moderator/member role
-- - handleRemoveMember: moderator/admin can remove non-creator members

begin;

alter table public.group_members enable row level security;

-- Helper condition pattern used below (inlined in each policy):
-- actor is group creator OR approved admin/moderator member.

-- 1) Keep self-only insert (join/apply) behavior.
drop policy if exists "group_members_insert_self" on public.group_members;
create policy "group_members_insert_self"
  on public.group_members
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and role = 'member'
    and status in ('pending', 'approved')
  );

-- 2) Extra insert permission for moderation approval flow (upsert for another user).
drop policy if exists "group_members_insert_moderation" on public.group_members;
create policy "group_members_insert_moderation"
  on public.group_members
  for insert
  to authenticated
  with check (
    auth.uid() <> user_id
    and status = 'approved'
    and role = 'member'
    and (
      exists (
        select 1
        from public.groups g
        where g.id = group_members.group_id
          and g.created_by = auth.uid()
      )
      or exists (
        select 1
        from public.group_members gm_actor
        where gm_actor.group_id = group_members.group_id
          and gm_actor.user_id = auth.uid()
          and gm_actor.status = 'approved'
          and gm_actor.role in ('admin', 'moderator')
      )
    )
  );

-- 3) Keep self-only update, explicitly preventing role/status escalation by self.
drop policy if exists "group_members_update_self" on public.group_members;
create policy "group_members_update_self"
  on public.group_members
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and role = 'member'
    and status in ('pending', 'approved')
  );

-- 4) Moderation update for other users with explicit WITH CHECK boundaries.
--    - moderator/admin: can approve pending user as approved/member
--    - group creator(admin): can also assign moderator/member role
--    - nobody can set role=admin via this policy
--    - group creator row cannot be modified here (prevents ownership privilege games)
drop policy if exists "group_members_update_moderation" on public.group_members;
create policy "group_members_update_moderation"
  on public.group_members
  for update
  to authenticated
  using (
    auth.uid() <> user_id
    and not exists (
      select 1
      from public.groups g_owner
      where g_owner.id = group_members.group_id
        and g_owner.created_by = group_members.user_id
    )
    and (
      exists (
        select 1
        from public.groups g
        where g.id = group_members.group_id
          and g.created_by = auth.uid()
      )
      or exists (
        select 1
        from public.group_members gm_actor
        where gm_actor.group_id = group_members.group_id
          and gm_actor.user_id = auth.uid()
          and gm_actor.status = 'approved'
          and gm_actor.role in ('admin', 'moderator')
      )
    )
  )
  with check (
    auth.uid() <> user_id
    and not exists (
      select 1
      from public.groups g_owner
      where g_owner.id = group_members.group_id
        and g_owner.created_by = group_members.user_id
    )
    and status = 'approved'
    and (
      -- handleRequestDecision (approve): moderator/admin + creator
      (
        role = 'member'
        and (
          exists (
            select 1
            from public.groups g
            where g.id = group_members.group_id
              and g.created_by = auth.uid()
          )
          or exists (
            select 1
            from public.group_members gm_actor
            where gm_actor.group_id = group_members.group_id
              and gm_actor.user_id = auth.uid()
              and gm_actor.status = 'approved'
              and gm_actor.role in ('admin', 'moderator')
          )
        )
      )
      or
      -- handleRoleChange: only creator(admin) can set moderator
      (
        role = 'moderator'
        and exists (
          select 1
          from public.groups g
          where g.id = group_members.group_id
            and g.created_by = auth.uid()
        )
      )
    )
  );

-- 5) Keep self-only delete (leave group / cancel own pending).
drop policy if exists "group_members_delete_self" on public.group_members;
create policy "group_members_delete_self"
  on public.group_members
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 6) Extra delete permission for moderation removal/rejection cleanup.
drop policy if exists "group_members_delete_moderation" on public.group_members;
create policy "group_members_delete_moderation"
  on public.group_members
  for delete
  to authenticated
  using (
    auth.uid() <> user_id
    and not exists (
      select 1
      from public.groups g_owner
      where g_owner.id = group_members.group_id
        and g_owner.created_by = group_members.user_id
    )
    and (
      exists (
        select 1
        from public.groups g
        where g.id = group_members.group_id
          and g.created_by = auth.uid()
      )
      or exists (
        select 1
        from public.group_members gm_actor
        where gm_actor.group_id = group_members.group_id
          and gm_actor.user_id = auth.uid()
          and gm_actor.status = 'approved'
          and gm_actor.role in ('admin', 'moderator')
      )
    )
  );

commit;
