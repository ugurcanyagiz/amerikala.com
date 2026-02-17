-- Message attachments storage setup
-- Run this once in Supabase SQL editor if `message-attachments` bucket/policies do not exist.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/zip',
    'text/plain'
  ]
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'message attachments upload own folder'
  ) then
    create policy "message attachments upload own folder"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'message-attachments'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'message attachments public read'
  ) then
    create policy "message attachments public read"
    on storage.objects
    for select
    to public
    using (bucket_id = 'message-attachments');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'message attachments manage own folder'
  ) then
    create policy "message attachments manage own folder"
    on storage.objects
    for all
    to authenticated
    using (
      bucket_id = 'message-attachments'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
      bucket_id = 'message-attachments'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  end if;
end $$;
