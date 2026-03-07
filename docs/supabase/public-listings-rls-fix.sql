-- Public listings/job/marketplace RLS hardening
-- Goal:
-- 1) anon/authenticated can SELECT approved rows for public pages.
-- 2) only owners (and admins) can write.
-- 3) anon cannot UPDATE/INSERT/DELETE.

begin;

-- Ensure base grants are aligned with RLS policies.
grant select on table public.listings to anon, authenticated;
grant select on table public.job_listings to anon, authenticated;
grant select on table public.marketplace_listings to anon, authenticated;

revoke insert, update, delete on table public.listings from anon;
revoke insert, update, delete on table public.job_listings from anon;
revoke insert, update, delete on table public.marketplace_listings from anon;

-- Authenticated users may still create/manage their own entries (RLS enforced).
grant insert, update, delete on table public.listings to authenticated;
grant insert, update, delete on table public.job_listings to authenticated;
grant insert, update, delete on table public.marketplace_listings to authenticated;

alter table public.listings enable row level security;
alter table public.job_listings enable row level security;
alter table public.marketplace_listings enable row level security;

-- =========================
-- listings
-- =========================
drop policy if exists "listings_public_read_approved" on public.listings;
create policy "listings_public_read_approved"
on public.listings
for select
to anon, authenticated
using (
  status = 'approved'
  and (expires_at is null or expires_at > now())
);

drop policy if exists "listings_owner_insert" on public.listings;
create policy "listings_owner_insert"
on public.listings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "listings_owner_update" on public.listings;
create policy "listings_owner_update"
on public.listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "listings_owner_delete" on public.listings;
create policy "listings_owner_delete"
on public.listings
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================
-- job_listings
-- =========================
drop policy if exists "job_listings_public_read_approved" on public.job_listings;
create policy "job_listings_public_read_approved"
on public.job_listings
for select
to anon, authenticated
using (
  status = 'approved'
  and (expires_at is null or expires_at > now())
);

drop policy if exists "job_listings_owner_insert" on public.job_listings;
create policy "job_listings_owner_insert"
on public.job_listings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "job_listings_owner_update" on public.job_listings;
create policy "job_listings_owner_update"
on public.job_listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "job_listings_owner_delete" on public.job_listings;
create policy "job_listings_owner_delete"
on public.job_listings
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================
-- marketplace_listings
-- =========================
drop policy if exists "marketplace_public_read_approved" on public.marketplace_listings;
create policy "marketplace_public_read_approved"
on public.marketplace_listings
for select
to anon, authenticated
using (
  status = 'approved'
  and (expires_at is null or expires_at > now())
);

drop policy if exists "marketplace_owner_insert" on public.marketplace_listings;
create policy "marketplace_owner_insert"
on public.marketplace_listings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "marketplace_owner_update" on public.marketplace_listings;
create policy "marketplace_owner_update"
on public.marketplace_listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "marketplace_owner_delete" on public.marketplace_listings;
create policy "marketplace_owner_delete"
on public.marketplace_listings
for delete
to authenticated
using (auth.uid() = user_id);

-- Optional admin override policies.
-- Requires public.profiles(id uuid, role text).
drop policy if exists "listings_admin_update" on public.listings;
create policy "listings_admin_update"
on public.listings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "job_listings_admin_update" on public.job_listings;
create policy "job_listings_admin_update"
on public.job_listings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "marketplace_admin_update" on public.marketplace_listings;
create policy "marketplace_admin_update"
on public.marketplace_listings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

commit;
