-- Allow content owners to edit/delete their own records across listing/post/comment tables.

-- posts
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts"
ON public.posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- comments
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
ON public.comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- listings (emlak)
DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
CREATE POLICY "Users can update own listings"
ON public.listings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
CREATE POLICY "Users can delete own listings"
ON public.listings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- listing comments (emlak ilan yorumları)
DROP POLICY IF EXISTS "Users can update own listing comments" ON public.listing_comments;
CREATE POLICY "Users can update own listing comments"
ON public.listing_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own listing comments" ON public.listing_comments;
CREATE POLICY "Users can delete own listing comments"
ON public.listing_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- job listings
DROP POLICY IF EXISTS "Users can update own job listings" ON public.job_listings;
CREATE POLICY "Users can update own job listings"
ON public.job_listings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own job listings" ON public.job_listings;
CREATE POLICY "Users can delete own job listings"
ON public.job_listings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- marketplace listings
DROP POLICY IF EXISTS "Users can update own marketplace listings" ON public.marketplace_listings;
CREATE POLICY "Users can update own marketplace listings"
ON public.marketplace_listings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own marketplace listings" ON public.marketplace_listings;
CREATE POLICY "Users can delete own marketplace listings"
ON public.marketplace_listings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
