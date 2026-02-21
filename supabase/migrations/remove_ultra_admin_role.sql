-- Remove legacy 4th role and enforce a 3-role model.
-- Target roles: user, moderator, admin.

-- 1) Data migration: normalize legacy rows.
UPDATE public.profiles
SET role = 'admin'
WHERE role::text = 'ultra_admin';

UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL;

-- 2) Schema migration: keep existing column type (enum/text) and enforce allowed role values.
-- NOTE: we intentionally do NOT ALTER COLUMN TYPE here, because policies in other tables
-- can depend on public.profiles.role and Postgres blocks type changes in that case.
DO $$
DECLARE
  role_udt text;
BEGIN
  SELECT c.udt_name
  INTO role_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'profiles'
    AND c.column_name = 'role';

  IF role_udt = 'user_role' THEN
    ALTER TABLE public.profiles
      ALTER COLUMN role SET DEFAULT 'user'::public.user_role;
  ELSE
    ALTER TABLE public.profiles
      ALTER COLUMN role SET DEFAULT 'user';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role::text = ANY (ARRAY['user', 'moderator', 'admin']));
END $$;

-- 3) RLS policies: admin-only checks should not reference a removed role.
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
      AND p.role::text = 'admin'
  )
);

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
      AND p.role::text = 'admin'
  )
);

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
      AND p.role::text = 'admin'
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
      AND p.role::text = 'admin'
  )
);

-- Rollback notes:
-- 1) Restore data model by re-adding a 4th role value (if needed) through a forward migration.
-- 2) If the role model is expanded again, update/drop profiles_role_check accordingly.
-- 3) Recreate prior RLS predicates only if the legacy role model is restored.
