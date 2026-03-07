-- Phase 1: Auth/RLS correctness hardening (minimal + reversible).
-- Evidence from provided outputs:
-- - 1.1: all public tables have RLS enabled.
-- - 1.2: policies exist for every public table, but one policy named
--   "Service role can insert profiles" is currently attached to roles {public} with WITH CHECK true.
-- - 1.3: anon has broad DELETE/INSERT/UPDATE grants on all public tables.

-- 1) Remove high-risk anon write grants on all public tables.
--    Keep SELECT/REFERENCES unchanged in this phase to avoid read-path regressions.
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT DISTINCT table_schema, table_name, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee = 'anon'
      AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
  LOOP
    EXECUTE format(
      'REVOKE %s ON TABLE %I.%I FROM anon;',
      rec.privilege_type,
      rec.table_schema,
      rec.table_name
    );
  END LOOP;
END
$$;

-- 2) Keep prior hardening for non-API privileges if still present.
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT DISTINCT table_schema, table_name, grantee, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee IN ('anon', 'authenticated')
      AND privilege_type IN ('TRUNCATE', 'TRIGGER')
  LOOP
    EXECUTE format(
      'REVOKE %s ON TABLE %I.%I FROM %I;',
      rec.privilege_type,
      rec.table_schema,
      rec.table_name,
      rec.grantee
    );
  END LOOP;
END
$$;

-- 3) Tighten profiles insert policy to intended service-only role.
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
ON public.profiles
AS PERMISSIVE
FOR INSERT
TO service_role
WITH CHECK (true);
