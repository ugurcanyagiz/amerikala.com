-- Meetup cover image upload setup (Supabase Storage)
-- Run in SQL editor as project owner.
-- IMPORTANT:
-- If your project uses a different bucket name, set
-- NEXT_PUBLIC_SUPABASE_EVENT_COVERS_BUCKET in your .env file
-- and use that same name in this script.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-covers',
  'event-covers',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Event covers are publicly viewable" on storage.objects;
drop policy if exists "Authenticated users can upload event covers" on storage.objects;
drop policy if exists "Users can update own event covers" on storage.objects;
drop policy if exists "Users can delete own event covers" on storage.objects;

create policy "Event covers are publicly viewable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'event-covers');

create policy "Authenticated users can upload event covers"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'event-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own event covers"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'event-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'event-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own event covers"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'event-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

commit;
