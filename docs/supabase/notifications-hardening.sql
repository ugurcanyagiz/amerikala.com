-- Notifications stability helpers
-- Purpose: reduce latency/spikes on NotificationContext aggregation queries.
-- Safe, idempotent indexes only.

create index if not exists idx_posts_user_id_created_at
  on public.posts (user_id, created_at desc);

create index if not exists idx_likes_post_user_created
  on public.likes (post_id, user_id, created_at desc);

create index if not exists idx_comments_post_user_created
  on public.comments (post_id, user_id, created_at desc);

create index if not exists idx_events_organizer_created
  on public.events (organizer_id, created_at desc);

create index if not exists idx_event_attendees_event_user_status_created
  on public.event_attendees (event_id, user_id, status, created_at desc);

-- Optional validation query to ensure `messages` read update policy exists (for navbar/messages badge sync)
-- select policyname from pg_policies where schemaname='public' and tablename='messages';
