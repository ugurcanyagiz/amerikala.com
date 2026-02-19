-- Minimal index additions derived from provided audit outputs.
-- Evidence:
-- - FK exists on public.group_join_requests.user_id (Q3: constraint group_join_requests_user_id_fkey)
-- - Existing indexes are group_id-leading; no user_id-leading index was present in provided index list (Q2)
-- - Policies query by auth.uid() = user_id (Q5: group_join_requests_insert_self / group_join_requests_select_scoped)

create index if not exists idx_group_join_requests_user_id
  on public.group_join_requests using btree (user_id);
