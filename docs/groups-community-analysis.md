# Groups → Community Upgrade Analysis

Bu analiz, mevcut `/groups` yapısını **dinamik community hub** modeline taşımak için hazırlanmıştır.

## 1) Hedeflenen model

- **Dışarıya kapalı, üyelere açık grup**: `visibility=private` + `requires_approval=true`
- **Opsiyonel başvuru sorusu**: grup kurucusu `application_question` girerse katılım talebinde cevap zorunlu yapılır.
- **Katılım akışı**: üye isteği `group_members` tablosuna doğrudan approved yazmak yerine önce `pending` + `group_join_requests` kaydı.
- **Grup içi feed**: `posts.group_id`
- **Grup etkinliği + toplu davet**: `events.group_id` ve `invite_all_group_members`

## 2) Neden bu tasarım?

- Supabase RLS ile satır bazlı erişim kontrolü; grup moderatörleri başvuruları yönetebilir.
- Postgres CHECK/INDEX/TRIGGER ile veri bütünlüğü ve performans sağlanır.
- Geriye dönük uyumluluk: mevcut `is_private` ve `requires_approval` alanları korunup `visibility` ile senkron tutulur.

## 3) Profesyonel kaynaklar

1. Supabase RLS rehberi: https://supabase.com/docs/guides/database/postgres/row-level-security
2. Supabase RBAC/claims yaklaşımı: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control
3. PostgreSQL ALTER TABLE: https://www.postgresql.org/docs/current/ddl-alter.html
4. PostgreSQL CREATE POLICY: https://www.postgresql.org/docs/current/sql-createpolicy.html

## 4) Uygulanan kurulumlar

- `docs/supabase/groups-community-upgrade.sql`
  - `groups.application_question`, `groups.visibility`
  - `group_join_requests` tablosu
  - `posts.group_id`, `events.group_id`, `events.invite_all_group_members`
  - RLS policy seti ve privacy sync trigger

## 5) Frontend entegrasyonu

- Grup oluştururken opsiyonel başvuru sorusu
- Grup detayında:
  - Üyelik durumu/pending görüntüsü
  - Başvuru sorusuna cevapla katılma
  - Grup feed paylaşımı
  - Grup etkinlikleri listesi
  - Moderatör için hızlı etkinlik oluşturma
- Private gruplarda üye olmayan kullanıcılar için içerik kilidi

## 6) Üretim önerisi

1. SQL dosyasını staging’de çalıştırın.
2. RLS policy’leri gerçek rollerle smoke-test edin.
3. Sonra production rollout + backfill/jobs (opsiyonel).
