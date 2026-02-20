-- Add support for ultra_admin in public.profiles.role.
-- Idempotent migration with support for both text+CHECK and enum-based role columns.

DO $$
DECLARE
  role_type text;
BEGIN
  SELECT data_type
  INTO role_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'role';

  IF role_type IS NULL THEN
    RAISE EXCEPTION 'public.profiles.role column was not found';
  END IF;

  IF role_type = 'USER-DEFINED' THEN
    -- Enum-based role column.
    EXECUTE 'ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS ''ultra_admin''';
  ELSE
    -- Text/varchar role column with check constraints.
    ALTER TABLE public.profiles
      ALTER COLUMN role TYPE text,
      ALTER COLUMN role SET DEFAULT 'user';

    UPDATE public.profiles
    SET role = 'user'
    WHERE role IS NULL;

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
      CHECK (role = ANY (ARRAY['user', 'moderator', 'admin', 'ultra_admin']));
  END IF;
END $$;

-- Rollback notes:
-- 1) Re-assign any ultra_admin rows before rollback:
--    UPDATE public.profiles SET role = 'admin' WHERE role = 'ultra_admin';
-- 2) For text role column:
--    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
--    ALTER TABLE public.profiles
--      ADD CONSTRAINT profiles_role_check
--      CHECK (role = ANY (ARRAY['user', 'moderator', 'admin']));
-- 3) For enum role column, enum value removal is not supported directly by Postgres.
--    Create a new enum without ultra_admin, cast the column, then drop old enum type.
