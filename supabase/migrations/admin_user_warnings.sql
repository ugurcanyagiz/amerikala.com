-- Admin user warnings system

CREATE TABLE IF NOT EXISTS public.user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  expires_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id_created_at
  ON public.user_warnings (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_warnings_created_by_admin_id
  ON public.user_warnings (created_by_admin_id);

ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.user_warnings TO authenticated;

DROP POLICY IF EXISTS "Admins can read warnings" ON public.user_warnings;
CREATE POLICY "Admins can read warnings"
ON public.user_warnings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'ultra_admin')
  )
);

-- Optional self-read policy (enabled): users can view only their own warnings.
DROP POLICY IF EXISTS "Users can read own warnings" ON public.user_warnings;
CREATE POLICY "Users can read own warnings"
ON public.user_warnings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can create warnings" ON public.user_warnings;
CREATE POLICY "Admins can create warnings"
ON public.user_warnings
FOR INSERT
TO authenticated
WITH CHECK (
  created_by_admin_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'ultra_admin')
  )
);

DROP POLICY IF EXISTS "Admins can revoke warnings" ON public.user_warnings;
CREATE POLICY "Admins can revoke warnings"
ON public.user_warnings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'ultra_admin')
  )
);

-- Rollback:
-- DROP POLICY IF EXISTS "Admins can revoke warnings" ON public.user_warnings;
-- DROP POLICY IF EXISTS "Admins can create warnings" ON public.user_warnings;
-- DROP POLICY IF EXISTS "Users can read own warnings" ON public.user_warnings;
-- DROP POLICY IF EXISTS "Admins can read warnings" ON public.user_warnings;
-- REVOKE SELECT, INSERT, DELETE ON public.user_warnings FROM authenticated;
-- DROP INDEX IF EXISTS public.idx_user_warnings_created_by_admin_id;
-- DROP INDEX IF EXISTS public.idx_user_warnings_user_id_created_at;
-- DROP TABLE IF EXISTS public.user_warnings;
