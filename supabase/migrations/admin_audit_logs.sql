-- Admin audit logs table and RLS policies.

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  target_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip inet NULL,
  user_agent text NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
  ON public.admin_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor_user_id
  ON public.admin_audit_logs (actor_user_id);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_audit_logs FROM anon;
REVOKE ALL ON public.admin_audit_logs FROM authenticated;

GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT INSERT ON public.admin_audit_logs TO service_role;

DROP POLICY IF EXISTS "Admins can read admin audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can read admin audit logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Service role can insert admin audit logs" ON public.admin_audit_logs;
CREATE POLICY "Service role can insert admin audit logs"
ON public.admin_audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Rollback
-- DROP POLICY IF EXISTS "Service role can insert admin audit logs" ON public.admin_audit_logs;
-- DROP POLICY IF EXISTS "Admins can read admin audit logs" ON public.admin_audit_logs;
-- REVOKE SELECT ON public.admin_audit_logs FROM authenticated;
-- REVOKE INSERT ON public.admin_audit_logs FROM service_role;
-- DROP INDEX IF EXISTS public.idx_admin_audit_logs_actor_user_id;
-- DROP INDEX IF EXISTS public.idx_admin_audit_logs_created_at;
-- DROP TABLE IF EXISTS public.admin_audit_logs;
