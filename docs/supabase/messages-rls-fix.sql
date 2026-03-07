-- RLS patch for read-at updates on direct/group messages.
-- Your current policies allow SELECT + INSERT on public.messages,
-- but mark-as-read flow requires UPDATE as well.

-- Required helper function should exist already in your DB:
-- is_conversation_member(conversation_id uuid, user_id uuid) returns boolean

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'messages'
      AND policyname = 'messages_update_participants'
  ) THEN
    CREATE POLICY "messages_update_participants"
    ON public.messages
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (is_conversation_member(conversation_id, auth.uid()))
    WITH CHECK (is_conversation_member(conversation_id, auth.uid()));
  END IF;
END $$;
