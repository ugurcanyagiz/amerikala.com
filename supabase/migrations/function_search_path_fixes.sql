-- SECURITY DEFINER search_path hardening derived from provided audit outputs (Q7).
-- Evidence:
-- - SECURITY DEFINER = true and proconfig = null for these public functions.

alter function public.change_user_role(uuid, public.user_role)
  set search_path = public, pg_temp;

alter function public.handle_new_user()
  set search_path = public, pg_temp;

alter function public.increment_listing_view_count(uuid)
  set search_path = public, pg_temp;

alter function public.increment_view_count(text, uuid)
  set search_path = public, pg_temp;

alter function public.update_event_attendee_count()
  set search_path = public, pg_temp;

alter function public.update_group_member_count()
  set search_path = public, pg_temp;
