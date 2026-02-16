-- Meetup attendee approval workflow RLS updates
-- IMPORTANT:
-- PostgreSQL enum values must be committed before they can be referenced
-- in constraints/policies. Run this file top-to-bottom as two phases.

-- =========================================================
-- PHASE 1: Extend enum and COMMIT
-- =========================================================
begin;

alter type public.attendance_status add value if not exists 'pending';
alter type public.attendance_status add value if not exists 'rejected';

commit;

-- =========================================================
-- PHASE 2: Policies, constraints, indexes
-- =========================================================
begin;

alter table public.event_attendees enable row level security;

alter table public.event_attendees
  drop constraint if exists event_attendees_status_check;

alter table public.event_attendees
  add constraint event_attendees_status_check
  check (
    status in (
      'pending'::public.attendance_status,
      'going'::public.attendance_status,
      'interested'::public.attendance_status,
      'not_going'::public.attendance_status,
      'rejected'::public.attendance_status
    )
  );

create unique index if not exists event_attendees_event_user_uidx
  on public.event_attendees(event_id, user_id);

drop policy if exists "Anyone can view attendees" on public.event_attendees;
drop policy if exists "Users can attend events" on public.event_attendees;
drop policy if exists "Users can remove own attendance" on public.event_attendees;
drop policy if exists "Users can update own attendance" on public.event_attendees;

drop policy if exists "Attendees are viewable by everyone" on public.event_attendees;
drop policy if exists "Users can request to attend events" on public.event_attendees;
drop policy if exists "Users can update own attendance request" on public.event_attendees;
drop policy if exists "Users can remove own attendance request" on public.event_attendees;
drop policy if exists "Organizers can manage attendee requests" on public.event_attendees;

create policy "Attendees are viewable by everyone"
  on public.event_attendees
  for select
  to public
  using (true);

create policy "Users can request to attend events"
  on public.event_attendees
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'::public.attendance_status
  );

create policy "Users can update own attendance request"
  on public.event_attendees
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and status = any(array[
      'pending'::public.attendance_status,
      'not_going'::public.attendance_status
    ])
  );

create policy "Users can remove own attendance request"
  on public.event_attendees
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Organizers can manage attendee requests"
  on public.event_attendees
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_attendees.event_id
        and e.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.events e
      where e.id = event_attendees.event_id
        and e.organizer_id = auth.uid()
    )
    and status = any(array[
      'going'::public.attendance_status,
      'rejected'::public.attendance_status
    ])
  );

commit;
