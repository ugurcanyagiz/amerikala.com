-- Minimal block system: profile-level block fields + RLS enforcement for content creation.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_reason text,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_by uuid REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION public.is_current_user_blocked()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.is_blocked
      FROM public.profiles p
      WHERE p.id = auth.uid()
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_blocked() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_blocked() TO authenticated;

-- Restrictive insert policies to prevent blocked users from creating content.
DROP POLICY IF EXISTS "blocked_users_cannot_insert_posts" ON public.posts;
CREATE POLICY "blocked_users_cannot_insert_posts"
ON public.posts
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_current_user_blocked());

DROP POLICY IF EXISTS "blocked_users_cannot_insert_listings" ON public.listings;
CREATE POLICY "blocked_users_cannot_insert_listings"
ON public.listings
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_current_user_blocked());

DROP POLICY IF EXISTS "blocked_users_cannot_insert_job_listings" ON public.job_listings;
CREATE POLICY "blocked_users_cannot_insert_job_listings"
ON public.job_listings
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_current_user_blocked());

DROP POLICY IF EXISTS "blocked_users_cannot_insert_marketplace_listings" ON public.marketplace_listings;
CREATE POLICY "blocked_users_cannot_insert_marketplace_listings"
ON public.marketplace_listings
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_current_user_blocked());

DROP POLICY IF EXISTS "blocked_users_cannot_insert_events" ON public.events;
CREATE POLICY "blocked_users_cannot_insert_events"
ON public.events
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_current_user_blocked());

-- Rollback:
-- DROP POLICY IF EXISTS "blocked_users_cannot_insert_events" ON public.events;
-- DROP POLICY IF EXISTS "blocked_users_cannot_insert_marketplace_listings" ON public.marketplace_listings;
-- DROP POLICY IF EXISTS "blocked_users_cannot_insert_job_listings" ON public.job_listings;
-- DROP POLICY IF EXISTS "blocked_users_cannot_insert_listings" ON public.listings;
-- DROP POLICY IF EXISTS "blocked_users_cannot_insert_posts" ON public.posts;
-- REVOKE EXECUTE ON FUNCTION public.is_current_user_blocked() FROM authenticated;
-- DROP FUNCTION IF EXISTS public.is_current_user_blocked();
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS blocked_by;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS blocked_at;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS blocked_reason;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_blocked;
