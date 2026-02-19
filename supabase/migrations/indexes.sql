-- Phase 2: Missing indexes (evidence-driven)
-- Source evidence:
-- 2.1 result set (missing FK indexes) provided by user.
-- Phase 0 lock/timeout observation: no blocking lock observed in active sample, so standard priority by FK utility.

-- A) migration-safe mode (transaction-friendly)
-- Create indexes with deterministic names: idx_<table>_<column>

CREATE INDEX IF NOT EXISTS idx_conversations_created_by
  ON public.conversations (created_by);

CREATE INDEX IF NOT EXISTS idx_events_approved_by
  ON public.events (approved_by);

CREATE INDEX IF NOT EXISTS idx_group_join_requests_reviewed_by
  ON public.group_join_requests (reviewed_by);

CREATE INDEX IF NOT EXISTS idx_groups_approved_by
  ON public.groups (approved_by);

CREATE INDEX IF NOT EXISTS idx_job_listings_approved_by
  ON public.job_listings (approved_by);

CREATE INDEX IF NOT EXISTS idx_likes_user_id
  ON public.likes (user_id);

CREATE INDEX IF NOT EXISTS idx_listings_approved_by
  ON public.listings (approved_by);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_approved_by
  ON public.marketplace_listings (approved_by);

-- B) manual-safe mode (for large tables, run OUTSIDE a transaction)
-- Use these statements manually in SQL editor with autocommit on.
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_created_by ON public.conversations (created_by);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_approved_by ON public.events (approved_by);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_join_requests_reviewed_by ON public.group_join_requests (reviewed_by);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_approved_by ON public.groups (approved_by);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_listings_approved_by ON public.job_listings (approved_by);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_user_id ON public.likes (user_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_approved_by ON public.listings (approved_by);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listings_approved_by ON public.marketplace_listings (approved_by);

-- Rollback (per-index)
-- DROP INDEX IF EXISTS public.idx_conversations_created_by;
-- DROP INDEX IF EXISTS public.idx_events_approved_by;
-- DROP INDEX IF EXISTS public.idx_group_join_requests_reviewed_by;
-- DROP INDEX IF EXISTS public.idx_groups_approved_by;
-- DROP INDEX IF EXISTS public.idx_job_listings_approved_by;
-- DROP INDEX IF EXISTS public.idx_likes_user_id;
-- DROP INDEX IF EXISTS public.idx_listings_approved_by;
-- DROP INDEX IF EXISTS public.idx_marketplace_listings_approved_by;
