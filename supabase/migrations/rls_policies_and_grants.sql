-- Phase 1: Auth/RLS correctness hardening (minimal + reversible).
-- Evidence from provided outputs:
-- - 1.1: all public tables have RLS enabled.
-- - 1.2: policies exist for every public table, but one policy named
--   "Service role can insert profiles" is currently attached to roles {public} with WITH CHECK true.
-- - 1.3: anon has broad DELETE/INSERT/UPDATE grants on all public tables.
--
-- Decision rules:
-- - IF anon has DML on public tables THEN revoke INSERT/UPDATE/DELETE.
-- - IF anon/authenticated has TRUNCATE or TRIGGER THEN revoke those non-API privileges.
-- - IF profiles service policy is not service_role-scoped THEN recreate it to TO service_role.

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

-- Rollback notes:
-- - Grants: restore only if explicitly required by your API contract, for example:
--     GRANT INSERT, UPDATE, DELETE ON public.<table> TO anon;
--     GRANT TRUNCATE, TRIGGER ON public.<table> TO anon|authenticated;
--   (No universal safe rollback grant exists; restore table-by-table.)
-- - Policy rollback (previous broad scope) if needed:
--     DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
--     CREATE POLICY "Service role can insert profiles"
--       ON public.profiles AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
-- - PostgREST schema cache refresh (if role/policy changes are not reflected immediately):
--     NOTIFY pgrst, 'reload schema';
