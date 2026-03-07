-- Enforce a single RBAC source of truth in public.profiles.role.
-- This migration is idempotent and supports text or enum-backed role columns.

UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL;

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

  ALTER TABLE public.profiles
    ALTER COLUMN role SET NOT NULL;

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
