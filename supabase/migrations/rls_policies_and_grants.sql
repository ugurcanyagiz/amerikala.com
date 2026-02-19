-- Minimal grant hardening derived from provided audit outputs.
-- Evidence:
-- - public tables have TRUNCATE and TRIGGER privileges granted to anon/authenticated in Q6 outputs.
-- - These privileges are not required for client-side CRUD and increase blast radius.

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
