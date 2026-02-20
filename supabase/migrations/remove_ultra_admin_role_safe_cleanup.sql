-- Safe cleanup migration for removing legacy ultra_admin role without data loss.
-- Target role model: user | moderator | admin
--
-- Runtime discovery targets:
-- - public.profiles.role
-- - public.user_roles.role
-- - enum type public.user_role
-- - role check constraints

DO $cleanup$
DECLARE
  has_profiles_role boolean;
  has_user_roles_role boolean;
  has_user_role_enum boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) INTO has_profiles_role;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'role'
  ) INTO has_user_roles_role;

  SELECT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'user_role'
  ) INTO has_user_role_enum;

  -- 1) Data migration: convert legacy ultra_admin rows to admin.
  IF has_profiles_role THEN
    EXECUTE 'UPDATE public.profiles SET role = ''admin'' WHERE role::text = ''ultra_admin''';
    EXECUTE 'UPDATE public.profiles SET role = ''user'' WHERE role IS NULL';
  END IF;

  IF has_user_roles_role THEN
    EXECUTE 'UPDATE public.user_roles SET role = ''admin'' WHERE role::text = ''ultra_admin''';
  END IF;

  -- 2) Remove ultra_admin from allowed values via check constraints.
  -- Works for text and enum-backed columns (role::text).
  IF has_profiles_role THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'profiles_role_check'
        AND conrelid = 'public.profiles'::regclass
    ) THEN
      EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check';
    END IF;

    EXECUTE '
      ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role::text = ANY (ARRAY[''''user'''', ''''moderator'''', ''''admin'''']))
    ';
  END IF;

  IF has_user_roles_role THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'user_roles_role_check'
        AND conrelid = 'public.user_roles'::regclass
    ) THEN
      EXECUTE 'ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_role_check';
    END IF;

    EXECUTE '
      ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_role_check
      CHECK (role::text = ANY (ARRAY[''''user'''', ''''moderator'''', ''''admin'''']))
    ';
  END IF;

  -- 3) Enum note: PostgreSQL enum value removal is not directly supported.
  -- Safest approach without downtime/data loss is to keep enum as-is and enforce
  -- allowed runtime values via constraints + app validation.
  IF has_user_role_enum AND EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'user_role'
      AND e.enumlabel = 'ultra_admin'
  ) THEN
    RAISE NOTICE 'public.user_role includes enum label ultra_admin. It is blocked by CHECK constraints in this migration.';
    RAISE NOTICE 'For full enum cleanup, create a new 3-value enum, cast dependent columns, swap types, then drop old enum in a controlled migration.';
  END IF;
END
$cleanup$;

-- 4) RLS policy cleanup (idempotent, table-aware).
DO $policy$
BEGIN
  IF to_regclass('public.admin_audit_logs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read admin audit logs" ON public.admin_audit_logs';
    EXECUTE '
      CREATE POLICY "Admins can read admin audit logs"
      ON public.admin_audit_logs
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role::text = ''''admin''''
        )
      )
    ';
  END IF;

  IF to_regclass('public.user_warnings') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read warnings" ON public.user_warnings';
    EXECUTE '
      CREATE POLICY "Admins can read warnings"
      ON public.user_warnings
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role::text = ''''admin''''
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS "Admins can create warnings" ON public.user_warnings';
    EXECUTE '
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
            AND p.role::text = ''''admin''''
        )
      )
    ';

    EXECUTE 'DROP POLICY IF EXISTS "Admins can revoke warnings" ON public.user_warnings';
    EXECUTE '
      CREATE POLICY "Admins can revoke warnings"
      ON public.user_warnings
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role::text = ''''admin''''
        )
      )
    ';
  END IF;
END
$policy$;

-- Rollback notes (non-destructive):
-- 1) Restore ultra_admin values selectively (if business requires):
--    UPDATE public.profiles SET role = 'ultra_admin' WHERE role::text = 'admin' AND <condition>;
--    UPDATE public.user_roles SET role = 'ultra_admin' WHERE role::text = 'admin' AND <condition>;
-- 2) Relax constraints to allow ultra_admin again:
--    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
--    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
--      CHECK (role::text = ANY (ARRAY['user','moderator','admin','ultra_admin']));
--    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
--    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check
--      CHECK (role::text = ANY (ARRAY['user','moderator','admin','ultra_admin']));
-- 3) Recreate policy predicates to include ultra_admin only if role model is expanded again.
-- 4) Optional full enum cleanup/rollback requires a forward migration:
--    create new enum type, cast dependent columns, swap type names, drop old enum.
