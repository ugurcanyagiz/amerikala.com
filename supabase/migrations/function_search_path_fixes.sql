-- Function search_path hardening (Phase 0 + Phase 4 evidence driven)
--
-- Phase 0 evidence (Q7): SECURITY DEFINER public functions had proconfig = null.
-- Phase 4 evidence (4.1): the following public functions were missing SET search_path in definition.
--
-- Risk note:
-- - SECURITY DEFINER functions have highest priority because unbounded search_path can enable object shadowing.
-- - 4.1 output currently includes trigger/helper functions (not SECURITY DEFINER), patched for consistency.

-- Existing SECURITY DEFINER hardening
ALTER FUNCTION public.change_user_role(uuid, public.user_role)
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.handle_new_user()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.increment_listing_view_count(uuid)
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.increment_view_count(text, uuid)
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_event_attendee_count()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.update_group_member_count()
  SET search_path = public, pg_catalog;

-- Phase 4 patch set (body preserved, only SET search_path added)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_profile_full_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
begin
  new.full_name := nullif(trim(concat_ws(' ', new.first_name, new.last_name)), '');
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_listing_comment_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.generate_group_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Türkçe karakterleri dönüştür ve slug oluştur
  base_slug := lower(NEW.name);
  base_slug := replace(base_slug, 'ı', 'i');
  base_slug := replace(base_slug, 'ğ', 'g');
  base_slug := replace(base_slug, 'ü', 'u');
  base_slug := replace(base_slug, 'ş', 's');
  base_slug := replace(base_slug, 'ö', 'o');
  base_slug := replace(base_slug, 'ç', 'c');
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  final_slug := base_slug;

  -- Benzersiz slug oluştur
  WHILE EXISTS (
    SELECT 1
    FROM public.groups
    WHERE slug = final_slug
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ignore_duplicate_conversation_participant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $function$
begin
  if exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = new.conversation_id
      and cp.user_id = new.user_id
  ) then
    -- duplicate ise insert etme, hata da verme
    return null;
  end if;

  return new;
end;
$function$;

-- Rollback snippet (old pg_get_functiondef from 4.1 output)
-- NOTE: This reverts only the five Phase 4 CREATE OR REPLACE patches above.
-- CREATE OR REPLACE FUNCTION public.set_updated_at()
--  RETURNS trigger
--  LANGUAGE plpgsql
-- AS $function$
-- begin
--   new.updated_at = now();
--   return new;
-- end;
-- $function$;
--
-- CREATE OR REPLACE FUNCTION public.sync_profile_full_name()
--  RETURNS trigger
--  LANGUAGE plpgsql
-- AS $function$
-- begin
--   new.full_name := nullif(trim(concat_ws(' ', new.first_name, new.last_name)), '');
--   return new;
-- end;
-- $function$;
--
-- CREATE OR REPLACE FUNCTION public.set_listing_comment_updated_at()
--  RETURNS trigger
--  LANGUAGE plpgsql
-- AS $function$
-- begin
--   new.updated_at = now();
--   return new;
-- end;
-- $function$;
--
-- CREATE OR REPLACE FUNCTION public.generate_group_slug()
--  RETURNS trigger
--  LANGUAGE plpgsql
-- AS $function$
-- DECLARE
--   base_slug TEXT;
--   final_slug TEXT;
--   counter INTEGER := 0;
-- BEGIN
--   -- Türkçe karakterleri dönüştür ve slug oluştur
--   base_slug := lower(NEW.name);
--   base_slug := replace(base_slug, 'ı', 'i');
--   base_slug := replace(base_slug, 'ğ', 'g');
--   base_slug := replace(base_slug, 'ü', 'u');
--   base_slug := replace(base_slug, 'ş', 's');
--   base_slug := replace(base_slug, 'ö', 'o');
--   base_slug := replace(base_slug, 'ç', 'c');
--   base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
--   base_slug := trim(both '-' from base_slug);
--
--   final_slug := base_slug;
--
--   -- Benzersiz slug oluştur
--   WHILE EXISTS (SELECT 1 FROM public.groups WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
--     counter := counter + 1;
--     final_slug := base_slug || '-' || counter;
--   END LOOP;
--
--   NEW.slug := final_slug;
--   RETURN NEW;
-- END;
-- $function$;
--
-- CREATE OR REPLACE FUNCTION public.ignore_duplicate_conversation_participant()
--  RETURNS trigger
--  LANGUAGE plpgsql
-- AS $function$
-- begin
--   if exists (
--     select 1
--     from public.conversation_participants cp
--     where cp.conversation_id = new.conversation_id
--       and cp.user_id = new.user_id
--   ) then
--     -- duplicate ise insert etme, hata da verme
--     return null;
--   end if;
--
--   return new;
-- end;
-- $function$;
