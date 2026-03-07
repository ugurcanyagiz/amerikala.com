# Admin RBAC + Supabase Manual Setup Guide

This guide is for environments where the code already enforces admin-only route matching in `proxy.ts` and server-side admin checks in API handlers.

> Important: These are **manual steps** for the project owner to run in Supabase. They were **not executed** by the agent.

## Intended behavior

- Public pages and static assets are always public (`/`, `/logo.png`, `/favicon.ico`, `/_next/static/*`, etc.).
- Proxy/middleware auth logic runs only for:
  - `/admin/:path*`
  - `/api/admin/:path*`
- `/admin/*`
  - unauthenticated: redirect to `/login?redirect=<path>`
  - authenticated non-admin: 403
  - admin: allowed
- `/api/admin/*`
  - unauthenticated: 401 JSON
  - authenticated non-admin: 403 JSON
  - admin: allowed

## Suggested SQL migration #1 (single source of truth for role)

Suggested file name:
- `/supabase/migrations/202602210010_profiles_role_source_of_truth.sql`

```sql
-- Enforce role source of truth in public.profiles.role
-- Supports text or enum-backed role columns.

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
```

## Suggested SQL migration #2 (RLS baseline + helper functions)

Suggested file name:
- `/supabase/migrations/202602210011_profiles_role_rls_baseline.sql`

```sql
-- Safe default RLS baseline for role-aware checks.
-- If table/policies already exist, this remains idempotent-ish via DROP/CREATE pattern.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- helper: return current user's role from profiles
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role::text
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1
$$;

-- helper: admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'admin', false)
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Profiles policies: users can read all profiles (common social app baseline), update only themselves,
-- admins can update anyone.
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles readable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
```

## Optional SQL migration #3 (admin-only table policy template)

Suggested file name:
- `/supabase/migrations/202602210012_admin_table_policy_template.sql`

```sql
-- Example template for any admin table: public.admin_audit_logs
-- Keep/adjust if table already has stricter policies.

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read admin audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can read admin audit logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can insert admin audit logs" ON public.admin_audit_logs;
CREATE POLICY "Service role can insert admin audit logs"
ON public.admin_audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);
```

## Supabase dashboard manual checklist

1. **Auth → URL Configuration**
   - Set Site URL to production domain.
   - Add Redirect URLs for:
     - `https://<your-domain>/auth/callback`
     - `https://<your-preview-domain>/auth/callback` (if using previews).
2. **Authentication providers**
   - Ensure providers in use are enabled and correctly configured.
3. **Database → SQL Editor**
   - Run migration #1, then #2, then optional #3.
4. **Database → Table Editor → profiles**
   - Confirm `role` values are only `user/moderator/admin`.
   - Confirm no NULL roles remain.
5. **Project Settings → API**
   - Copy project URL + anon key.
6. **Vercel → Project Settings → Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
7. Redeploy after env/migration changes.

## Verification (curl + browser)

```bash
# Public assets/pages
curl -i https://<domain>/
curl -i https://<domain>/logo.png
curl -i https://<domain>/favicon.ico

# Admin routes unauthenticated
curl -i https://<domain>/admin
curl -i https://<domain>/api/admin/session

# Admin routes authenticated as non-admin (use browser/cookie session)
# Expected: /admin => 403, /api/admin/* => 403 JSON

# Admin routes authenticated as admin
# Expected: /admin => 200 page, /api/admin/session => 200 JSON
```

Browser checks:
1. Open `/` logged out → page loads.
2. Open `/logo.png` logged out → image loads (200).
3. Open `/admin` logged out → redirected to `/login?...`.
4. Log in as non-admin user → `/admin` shows 403, admin links hidden.
5. Log in as admin user → `/admin` loads, `/api/admin/session` returns ok.

## Rollback notes

- Revert app code by resetting to previous commit where proxy/auth behavior was known good.
- Revert DB constraints/policies by dropping new policies/functions and restoring prior migration state.
- If needed, temporarily relax policies by allowing only self-read/write while debugging.
