# Emlak Olanaklar Data Model Review

## Mevcut Durum (Analiz)
- `public.listings` tablosunda `amenities text[]` alanı var ve form seçimi doğrudan bu diziye yazılıyor.
- Aynı tabloda `pet_policy`, `parking`, `laundry` alanları da bulunuyor; bu alanlar olanakların bir kısmını ayrı sütunlarda tekrar ediyor.
- Sonuç: filtreleme ve analitik için tek bir kaynak yok, ileride yeni olanak eklemek migration bağımlı hale geliyor.

## Önerilen Scalable Model
1. `amenity_catalog`
   - `amenity_key` (unique, slug), `label`, `category`, `icon`, `sort_order`, `is_active`.
   - UI ve API seçenekleri katalogdan beslenir.
2. `listing_amenities`
   - `(listing_id, amenity_id)` pivot yapısı.
   - Çoklu seçim ve performanslı filtreleme için indexlenir.
3. Geçiş stratejisi
   - İlk aşamada mevcut `listings.amenities` korunur, katalog+join tabloya backfill yapılır.
   - İkinci aşamada read tarafı `listing_amenities` üzerinden çalıştırılır.
   - Son aşamada gerekirse `listings.amenities` deprecate edilir.

## Üretilen SQL
- Uyumlu migration dosyası: `supabase/migrations/202602260002_listings_validation_and_amenities_refactor.sql`.
