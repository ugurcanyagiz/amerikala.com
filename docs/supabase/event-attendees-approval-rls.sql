-- Meetup attendee approval workflow RLS updates
-- Run in Supabase SQL editor.

-- 1) Ensure status values support approval lifecycle.
alter table public.event_attendees
  drop constraint if exists event_attendees_status_check;

alter table public.event_attendees
  add constraint event_attendees_status_check
  check (status in ('pending', 'going', 'interested', 'not_going', 'rejected'));

-- 2) New attendee requests start as pending and only for the authenticated user.
drop policy if exists "Users can attend events" on public.event_attendees;
create policy "Users can request to attend events"
  on public.event_attendees
  for insert
  to public
  with check (
    auth.uid() = user_id
    and status = 'pending'
  );

-- 3) Users can update their own request state only to cancel/retry.
drop policy if exists "Users can update own attendance" on public.event_attendees;
create policy "Users can update own attendance request"
  on public.event_attendees
  for update
  to public
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and status = any(array['pending'::text, 'not_going'::text])
  );

-- 4) Organizers can approve/reject attendee requests for their own event.
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
    and status = any(array['going'::text, 'rejected'::text])
  );

-- 5) Optional: avoid duplicate rows and rely on status transitions.
create unique index if not exists event_attendees_event_user_uidx
  on public.event_attendees(event_id, user_id);
