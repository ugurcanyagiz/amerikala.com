-- Production notifications center foundation

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid null references auth.users(id) on delete set null,
  event_type text not null,
  title text not null,
  body text not null,
  action_url text null,
  subject_type text null,
  subject_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text null,
  seen_at timestamptz null,
  read_at timestamptz null,
  archived_at timestamptz null,
  check (length(event_type) > 0),
  check (length(title) > 0),
  check (length(body) > 0)
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_user_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_user_id, created_at desc)
  where read_at is null and archived_at is null;

create index if not exists notifications_actor_created_idx
  on public.notifications (actor_user_id, created_at desc);

create unique index if not exists notifications_recipient_dedupe_unique
  on public.notifications (recipient_user_id, dedupe_key)
  where dedupe_key is not null;

create table if not exists public.user_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  push_enabled boolean not null default true,
  mentions_enabled boolean not null default true,
  comments_enabled boolean not null default true,
  follows_enabled boolean not null default true,
  system_enabled boolean not null default true,
  muted_event_types text[] not null default '{}'::text[]
);

alter table public.notifications enable row level security;
alter table public.user_notification_preferences enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select to authenticated using (auth.uid() = recipient_user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update to authenticated using (auth.uid() = recipient_user_id) with check (auth.uid() = recipient_user_id);

drop policy if exists notifications_insert_service_role on public.notifications;
create policy notifications_insert_service_role on public.notifications for insert to service_role with check (true);

drop policy if exists notification_preferences_select_own on public.user_notification_preferences;
create policy notification_preferences_select_own on public.user_notification_preferences for select to authenticated using (auth.uid() = user_id);

drop policy if exists notification_preferences_insert_own on public.user_notification_preferences;
create policy notification_preferences_insert_own on public.user_notification_preferences for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists notification_preferences_update_own on public.user_notification_preferences;
create policy notification_preferences_update_own on public.user_notification_preferences for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_user_notification_preferences_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_user_notification_preferences_updated_at on public.user_notification_preferences;
create trigger trg_user_notification_preferences_updated_at
before update on public.user_notification_preferences
for each row execute function public.touch_user_notification_preferences_updated_at();

create or replace function public.enqueue_notification(
  p_recipient_user_id uuid,
  p_actor_user_id uuid,
  p_event_type text,
  p_title text,
  p_body text,
  p_action_url text default null,
  p_subject_type text default null,
  p_subject_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_dedupe_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
begin
  if p_recipient_user_id is null then
    return null;
  end if;

  if p_actor_user_id is not null and p_recipient_user_id = p_actor_user_id then
    return null;
  end if;

  insert into public.notifications (
    recipient_user_id,
    actor_user_id,
    event_type,
    title,
    body,
    action_url,
    subject_type,
    subject_id,
    metadata,
    dedupe_key,
    read_at,
    seen_at,
    archived_at,
    created_at
  ) values (
    p_recipient_user_id,
    p_actor_user_id,
    p_event_type,
    p_title,
    p_body,
    p_action_url,
    p_subject_type,
    p_subject_id,
    coalesce(p_metadata, '{}'::jsonb),
    p_dedupe_key,
    null,
    null,
    null,
    now()
  )
  on conflict (recipient_user_id, dedupe_key)
  where dedupe_key is not null
  do update
  set
    actor_user_id = excluded.actor_user_id,
    title = excluded.title,
    body = excluded.body,
    action_url = excluded.action_url,
    subject_type = excluded.subject_type,
    subject_id = excluded.subject_id,
    metadata = excluded.metadata,
    read_at = null,
    seen_at = null,
    archived_at = null,
    created_at = now()
  returning id into v_notification_id;

  return v_notification_id;
end;
$$;

create or replace function public.notify_on_like_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_owner uuid;
begin
  select p.user_id into v_post_owner from public.posts p where p.id = new.post_id;

  perform public.enqueue_notification(
    v_post_owner,
    new.user_id,
    'post.like',
    'Yeni beğeni',
    'Bir kullanıcı gönderinizi beğendi.',
    '/feed',
    'post',
    new.post_id,
    jsonb_build_object('post_id', new.post_id),
    concat('post.like:', new.post_id::text, ':', new.user_id::text)
  );

  return new;
end;
$$;

drop trigger if exists trg_notifications_like_insert on public.likes;
create trigger trg_notifications_like_insert
after insert on public.likes
for each row execute function public.notify_on_like_insert();

create or replace function public.notify_on_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_owner uuid;
  v_parent_owner uuid;
begin
  select p.user_id into v_post_owner from public.posts p where p.id = new.post_id;

  perform public.enqueue_notification(
    v_post_owner,
    new.user_id,
    case when new.parent_id is null then 'post.comment' else 'post.reply' end,
    case when new.parent_id is null then 'Yeni yorum' else 'Yeni yanıt' end,
    case when new.parent_id is null then 'Gönderinize yorum yapıldı.' else 'Yorumunuza yanıt verildi.' end,
    '/feed',
    'comment',
    new.id,
    jsonb_build_object('post_id', new.post_id, 'comment_id', new.id, 'parent_id', new.parent_id),
    concat('comment:', new.id::text)
  );

  if new.parent_id is not null then
    select c.user_id into v_parent_owner from public.comments c where c.id = new.parent_id;
    perform public.enqueue_notification(
      v_parent_owner,
      new.user_id,
      'post.reply',
      'Yeni yanıt',
      'Yorumunuza yanıt verildi.',
      '/feed',
      'comment',
      new.id,
      jsonb_build_object('post_id', new.post_id, 'comment_id', new.id, 'parent_id', new.parent_id),
      concat('comment.reply:', new.id::text)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notifications_comment_insert on public.comments;
create trigger trg_notifications_comment_insert
after insert on public.comments
for each row execute function public.notify_on_comment_insert();

create or replace function public.notify_on_follow_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enqueue_notification(
    new.following_id,
    new.follower_id,
    'social.follow',
    'Yeni takipçi',
    'Bir kullanıcı seni takip etmeye başladı.',
    '/profile',
    'profile',
    new.follower_id,
    jsonb_build_object('follower_id', new.follower_id),
    concat('follow:', new.follower_id::text, ':', new.following_id::text)
  );

  return new;
end;
$$;

drop trigger if exists trg_notifications_follow_insert on public.follows;
create trigger trg_notifications_follow_insert
after insert on public.follows
for each row execute function public.notify_on_follow_insert();

create or replace function public.notify_on_friend_request_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.enqueue_notification(
      new.receiver_id,
      new.requester_id,
      'social.friend_request',
      'Yeni arkadaşlık isteği',
      'Bir kullanıcı sana arkadaşlık isteği gönderdi.',
      '/notifications',
      'friend_request',
      new.id,
      jsonb_build_object('friend_request_id', new.id, 'status', new.status),
      concat('friend_request:', new.id::text)
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    perform public.enqueue_notification(
      new.requester_id,
      new.receiver_id,
      'social.friend_request.status',
      'Arkadaşlık isteği güncellendi',
      concat('Arkadaşlık isteği durumu: ', new.status),
      '/notifications',
      'friend_request',
      new.id,
      jsonb_build_object('friend_request_id', new.id, 'status', new.status),
      concat('friend_request_status:', new.id::text, ':', new.status)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notifications_friend_request_change on public.friend_requests;
create trigger trg_notifications_friend_request_change
after insert or update on public.friend_requests
for each row execute function public.notify_on_friend_request_change();

create or replace function public.notify_on_event_attendee_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organizer_id uuid;
begin
  select e.organizer_id into v_organizer_id from public.events e where e.id = coalesce(new.event_id, old.event_id);

  if tg_op = 'INSERT' then
    perform public.enqueue_notification(
      v_organizer_id,
      new.user_id,
      'event.rsvp',
      'Yeni RSVP',
      'Etkinliğine yeni bir katılım talebi geldi.',
      '/events/' || new.event_id::text,
      'event',
      new.event_id,
      jsonb_build_object('event_id', new.event_id, 'status', new.status),
      concat('event_rsvp:', new.event_id::text, ':', new.user_id::text)
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    perform public.enqueue_notification(
      new.user_id,
      v_organizer_id,
      'event.rsvp.status',
      'RSVP güncellendi',
      concat('Etkinlik katılım durumun güncellendi: ', new.status),
      '/events/' || new.event_id::text,
      'event',
      new.event_id,
      jsonb_build_object('event_id', new.event_id, 'status', new.status),
      concat('event_rsvp_status:', new.event_id::text, ':', new.user_id::text, ':', new.status)
    );
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_notifications_event_attendee_change on public.event_attendees;
create trigger trg_notifications_event_attendee_change
after insert or update on public.event_attendees
for each row execute function public.notify_on_event_attendee_change();

create or replace function public.notify_on_admin_audit_log_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.target_user_id is not null then
    perform public.enqueue_notification(
      new.target_user_id,
      new.actor_user_id,
      'system.admin_action',
      'Hesap bildirimi',
      'Hesabınla ilgili bir yönetici işlemi kaydedildi.',
      '/ayarlar',
      'admin_audit_log',
      null,
      jsonb_build_object('action', new.action, 'entity_type', new.entity_type, 'entity_id', new.entity_id),
      concat('admin_audit:', new.id::text)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notifications_admin_audit_log_insert on public.admin_audit_logs;
create trigger trg_notifications_admin_audit_log_insert
after insert on public.admin_audit_logs
for each row execute function public.notify_on_admin_audit_log_insert();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.notifications;
    exception when duplicate_object then
      null;
    end;
  end if;
end
$$;
