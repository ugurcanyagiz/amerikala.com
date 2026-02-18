-- Group events relation fix
-- Ensures `events.group_id` exists and group visibility is respected in RLS.

begin;

alter table public.events
  add column if not exists group_id uuid;

-- Normalize null/legacy values if needed before FK creation.
alter table public.events
  drop constraint if exists events_group_id_fkey;

alter table public.events
  add constraint events_group_id_fkey
  foreign key (group_id)
  references public.groups(id)
  on delete set null;

create index if not exists idx_events_group_date
  on public.events (group_id, event_date asc, start_time asc);

-- Group-aware visibility:
-- - non-group events remain visible as before
-- - public-group events are visible
-- - private-group events are visible only to approved group members
alter table public.events enable row level security;

drop policy if exists "Events are viewable with group visibility" on public.events;
create policy "Events are viewable with group visibility"
  on public.events
  for select
  to public
  using (
    group_id is null
    or exists (
      select 1
      from public.groups g
      where g.id = events.group_id
        and g.is_private = false
    )
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = events.group_id
        and gm.user_id = auth.uid()
        and gm.status = 'approved'
    )
  );

-- Group event creation:
-- users can create a grouped event only for groups they have approved membership in.
drop policy if exists "Authenticated users can create events with optional group scope" on public.events;
create policy "Authenticated users can create events with optional group scope"
  on public.events
  for insert
  to authenticated
  with check (
    auth.uid() = organizer_id
    and (
      group_id is null
      or exists (
        select 1
        from public.group_members gm
        where gm.group_id = events.group_id
          and gm.user_id = auth.uid()
          and gm.status = 'approved'
      )
    )
  );

commit;
