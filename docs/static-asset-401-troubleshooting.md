# Static Asset 401 Troubleshooting (`/logo.png`)

## Current code-level auth scope

`proxy.ts` is scoped only to:

- `/admin/:path*`
- `/api/admin/:path*`

This means static assets such as `/logo.png`, `/favicon.ico`, `/_next/static/*`, `/_next/image/*`, `/images/*`, `/robots.txt`, and `/sitemap.xml` do **not** pass through admin auth logic.

## If `/logo.png` is still returning 401 on Vercel

Most likely cause is **Vercel Deployment Protection** on Preview/Production, not Next.js route proxy matching.

Check in Vercel:

1. Project → **Settings** → **Deployment Protection**
2. Disable/relax protection for the environment being tested, or
3. Allow anonymous/public access where required.

After changing settings, redeploy and re-test:

```bash
curl -i https://<your-domain>/logo.png
curl -i https://<your-domain>/favicon.ico
curl -i https://<your-domain>/_next/static/<some-chunk>.js
```

Expected: public assets should return `200` (or `304`), not `401`.
