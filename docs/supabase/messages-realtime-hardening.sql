-- Optional hardening for messages performance/realtime stability.
-- Schema shared by user is compatible with current queries.
-- This script only adds indexes (safe/idempotent) to reduce load when conversation volume grows.

create index if not exists idx_messages_conversation_created_at
  on public.messages (conversation_id, created_at desc);

create index if not exists idx_messages_conversation_read_at
  on public.messages (conversation_id, read_at)
  where read_at is null;

create index if not exists idx_conversation_participants_user
  on public.conversation_participants (user_id, conversation_id);
