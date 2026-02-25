# Revert Baseline Snapshot (Design System)

Bu dosya, `Refactor visual design system with unified brand palette` değişikliğinin geri alındığını belgelemek için oluşturuldu.

## Amaç

- `Create New PR` akışını tekrar tetiklemek için yeni bir değişiklik (yeni dosya) üretmek.
- Uygulamanın görsel bileşenlerinin eski token/sınıf düzenine döndüğünü referans olarak saklamak.

## Revert Referansı

- Revert commit: `654f3b5`
- Revert edilen commit: `fe2bc74`

## Eski Hal (Baseline) Notları

Aşağıdaki noktalar eski (refactor öncesi) görsel düzeni temsil eder:

- Buton varyantları `var(--color-primary)` ve mevcut tasarım tokenları ile çalışır.
- Navbar üst kapsayıcı genişliği `max-w-[1400px] px-4` düzenini kullanır.
- Sidebar ana yüzeyi `var(--color-surface-raised)` / `var(--color-border-light)` yaklaşımındadır.
- Homepage üst kapsayıcı ve hero alanı `HOME_THEME` + mevcut `var(--color-*)` tokenları ile stillenir.
- Refactor ile eklenen `tailwind.config.js` dosyası baseline’da bulunmaz.

## Etki Alanı

- Bu dosya yalnızca dokümantasyon amaçlıdır.
- Supabase / auth / API / business logic tarafında değişiklik içermez.
