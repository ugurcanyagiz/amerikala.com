-- Additional indexes for admin audit logs read patterns.

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user_id
  ON public.admin_audit_logs (target_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor_created_at
  ON public.admin_audit_logs (actor_user_id, created_at DESC);

-- Rollback:
-- DROP INDEX IF EXISTS public.idx_admin_audit_logs_actor_created_at;
-- DROP INDEX IF EXISTS public.idx_admin_audit_logs_target_user_id;
