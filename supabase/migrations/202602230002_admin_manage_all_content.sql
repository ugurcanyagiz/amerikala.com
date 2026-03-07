-- Allow admins to manage (update/delete) all content rows across core content tables.
-- Owner policies remain in place for normal users.

-- posts
DROP POLICY IF EXISTS "Admins can update all posts" ON public.posts;
CREATE POLICY "Admins can update all posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete all posts" ON public.posts;
CREATE POLICY "Admins can delete all posts"
ON public.posts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

-- comments
DROP POLICY IF EXISTS "Admins can update all comments" ON public.comments;
CREATE POLICY "Admins can update all comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete all comments" ON public.comments;
CREATE POLICY "Admins can delete all comments"
ON public.comments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

-- listings
DROP POLICY IF EXISTS "Admins can update all listings" ON public.listings;
CREATE POLICY "Admins can update all listings"
ON public.listings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete all listings" ON public.listings;
CREATE POLICY "Admins can delete all listings"
ON public.listings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

-- listing_comments
DROP POLICY IF EXISTS "Admins can update all listing comments" ON public.listing_comments;
CREATE POLICY "Admins can update all listing comments"
ON public.listing_comments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete all listing comments" ON public.listing_comments;
CREATE POLICY "Admins can delete all listing comments"
ON public.listing_comments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

-- job_listings
DROP POLICY IF EXISTS "Admins can update all job listings" ON public.job_listings;
CREATE POLICY "Admins can update all job listings"
ON public.job_listings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete all job listings" ON public.job_listings;
CREATE POLICY "Admins can delete all job listings"
ON public.job_listings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

-- marketplace_listings
DROP POLICY IF EXISTS "Admins can update all marketplace listings" ON public.marketplace_listings;
CREATE POLICY "Admins can update all marketplace listings"
ON public.marketplace_listings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete all marketplace listings" ON public.marketplace_listings;
CREATE POLICY "Admins can delete all marketplace listings"
ON public.marketplace_listings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);
