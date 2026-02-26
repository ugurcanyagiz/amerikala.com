-- Listings validation + scalable amenities model
-- 1) Remove legacy minimum-character title/description checks if they exist
-- 2) Enforce non-empty trimmed strings for title/description
-- 3) Add normalized amenity taxonomy + listing join table for scalable querying

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'listings'
      AND pg_get_constraintdef(c.oid) ILIKE '%title%'
      AND pg_get_constraintdef(c.oid) ~* '(char_length|length)'
  LOOP
    EXECUTE format('alter table public.listings drop constraint if exists %I', r.conname);
  END LOOP;

  FOR r IN
    SELECT conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'listings'
      AND pg_get_constraintdef(c.oid) ILIKE '%description%'
      AND pg_get_constraintdef(c.oid) ~* '(char_length|length)'
  LOOP
    EXECUTE format('alter table public.listings drop constraint if exists %I', r.conname);
  END LOOP;
END
$$;

alter table public.listings
  drop constraint if exists listings_title_not_blank_check,
  drop constraint if exists listings_description_not_blank_check;

alter table public.listings
  add constraint listings_title_not_blank_check check (char_length(trim(title)) > 0),
  add constraint listings_description_not_blank_check check (char_length(trim(description)) > 0);

create table if not exists public.amenity_catalog (
  id uuid primary key default gen_random_uuid(),
  amenity_key text not null unique,
  label text not null,
  category text not null,
  icon text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint amenity_catalog_key_not_blank check (char_length(trim(amenity_key)) > 0),
  constraint amenity_catalog_label_not_blank check (char_length(trim(label)) > 0)
);

create table if not exists public.listing_amenities (
  listing_id uuid not null references public.listings(id) on delete cascade,
  amenity_id uuid not null references public.amenity_catalog(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listing_id, amenity_id)
);

create index if not exists idx_listing_amenities_amenity on public.listing_amenities (amenity_id, listing_id);
create index if not exists idx_listing_amenities_listing on public.listing_amenities (listing_id);

insert into public.amenity_catalog (amenity_key, label, category, icon, sort_order)
values
  ('ac', 'Klima', 'comfort', '❄️', 10),
  ('heating', 'Isıtma', 'comfort', '🔥', 20),
  ('washer', 'Çamaşır Makinesi', 'laundry', '🧺', 30),
  ('dryer', 'Kurutma Makinesi', 'laundry', '👕', 40),
  ('dishwasher', 'Bulaşık Makinesi', 'kitchen', '🍽️', 50),
  ('wifi', 'WiFi', 'utilities', '📶', 60),
  ('parking', 'Otopark', 'parking', '🅿️', 70),
  ('parking_street', 'Sokak Otoparkı', 'parking', '🛣️', 80),
  ('parking_garage', 'Garaj', 'parking', '🚗', 90),
  ('gym', 'Spor Salonu', 'building', '🏋️', 100),
  ('pool', 'Havuz', 'building', '🏊', 110),
  ('balcony', 'Balkon', 'features', '🌅', 120),
  ('garden', 'Bahçe', 'features', '🌳', 130),
  ('elevator', 'Asansör', 'building', '🛗', 140),
  ('doorman', 'Kapıcı', 'building', '🚪', 150),
  ('furnished', 'Eşyalı', 'features', '🛋️', 160),
  ('storage', 'Depo', 'features', '📦', 170),
  ('pet_friendly', 'Evcil Hayvan OK', 'pets', '🐾', 180),
  ('pets_cats_only', 'Sadece Kedi', 'pets', '🐱', 190),
  ('pets_dogs_only', 'Sadece Köpek', 'pets', '🐶', 200),
  ('laundry_in_unit', 'Daire İçi Çamaşır', 'laundry', '🧺', 210),
  ('laundry_in_building', 'Binada Çamaşır', 'laundry', '🏢', 220),
  ('laundry_nearby', 'Yakın Çamaşırhane', 'laundry', '🧼', 230),
  ('smoke_free', 'Sigara Yasak', 'rules', '🚭', 240),
  ('security', 'Güvenlik', 'building', '🔒', 250)
on conflict (amenity_key) do update
set label = excluded.label,
    category = excluded.category,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true;

insert into public.listing_amenities (listing_id, amenity_id)
select l.id, c.id
from public.listings l
cross join lateral jsonb_array_elements_text(coalesce(to_jsonb(l.amenities), '[]'::jsonb)) as amenity_key(value)
join public.amenity_catalog c on c.amenity_key = amenity_key.value
on conflict do nothing;
