# AmerikaLa Design System

## Genel Bakış

Bu doküman, `app/globals.css` içinde tanımlı design token'ların ve `app/components/ui/*` altında kullanılan UI primitive'lerin **kanonik** kullanımını açıklar.

## 1) Token Sözlüğü (Canonical)

Aşağıdaki isimlendirme doğrudan `app/globals.css` ile birebir uyumludur.

### Core Semantic Tokens (Yeni sözlük)

- `--color-bg`: Warm Neutral ana zemin (page/app background).
- `--color-surface`: Solid surface (temel yüzey).
- `--color-ink`: Calm Navy birincil metin tonu.
- `--color-muted`: Soft Gray yardımcı metin tonu (`--color-ink-secondary` ile map).
- `--color-primary` / `--color-primary-hover`: birincil CTA ve hover.
- `--color-trust`: Calm Navy trust tonu (`--color-ink` ile map).
- `--color-border`: Soft Gray border tonu.
- `--shadow-soft`: Trust tabanlı yumuşak elevasyon gölgesi.

Kısa kullanım örnekleri:

- Page shell: `className="bg-[var(--color-bg)] text-[var(--color-ink)]"`
- Card surface: `className="bg-[var(--color-surface)] shadow-[var(--shadow-soft)]"`
- Primary CTA: `className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"`

### Page Tokens

- `--color-bg`: Uygulama/page ana zemin tonu
- `--color-surface`: Uygulama/page yüzeyi
- `--color-surface-overlay`: Overlay/backdrop tonu

### Surface Tokens

- `--color-surface-raised`: Kart, input gibi yükseltilmiş yüzeyler
- `--color-surface-sunken`: İkincil/düşük seviye arka plan yüzeyleri

### Text Tokens

- `--color-ink`: Birincil metin
- `--color-muted`: Yardımcı metin (`--color-ink-secondary`)
- `--color-ink-secondary`: İkincil metin
- `--color-ink-tertiary`: Yardımcı/placeholder metin
- `--color-ink-inverse`: Ters kontrast metin

### Border Tokens

- `--color-border`: Varsayılan border
- `--color-border-light`: Daha yumuşak border
- `--color-border-strong`: Hover/strong border

### Semantic Tokens

- `--color-success`, `--color-success-light`
- `--color-warning`, `--color-warning-light`
- `--color-error`, `--color-error-light`
- `--color-info`, `--color-info-light`

### Action Tokens

- `--color-primary`: Birincil aksiyon
- `--color-primary-hover`: Birincil aksiyon hover
- `--color-primary-light`: Aksiyonun açık tonu (selection/highlight)
- `--color-primary-subtle`: Çok düşük kontrast aksiyon zemini
- `--color-primary-50` ... `--color-primary-900`: Ton skalası
- `--color-trust`: Secondary/trust aksiyon tonu


### Tailwind Semantic Utility Helpers

`@layer utilities` altında semantic helper sınıflar:

- `.bg-primary` → `background-color: var(--color-primary)`
- `.bg-trust` → `background-color: var(--color-trust)`
- `.text-ink` → `color: var(--color-ink)`
- `.border-border` → `border-color: var(--color-border)`
- `.ring-primary` → `--tw-ring-color: var(--color-primary)`

### Mevcut Bileşenlerle Eşleştirme

- `Button`:
  - `variant="primary"` → `--color-primary` / `--color-primary-hover`
  - `variant="secondary"` veya trust odaklı aksiyonlar → `--color-trust`
- `Card`:
  - `variant="default"|"elevated"` → `--color-surface`, `--color-border`, `--shadow-soft`
- `Input` / `Select` / `Textarea`:
  - Surface: `--color-surface-raised`
  - Border: `--color-border` / hover `--color-border-strong`
  - Focus ring: `--color-primary` (`ring-primary` ile hizalı)

---

## 2) Canonical Foundations

Bu bölümdeki değerler, kodda tanımlı gerçek değerlerle birebir verilmiştir.

### Spacing Standard (8px Grid)

- `--space-1: 0.25rem` (4px)
- `--space-2: 0.5rem` (8px)
- `--space-3: 0.75rem` (12px)
- `--space-4: 1rem` (16px)
- `--space-5: 1.25rem` (20px)
- `--space-6: 1.5rem` (24px)
- `--space-8: 2rem` (32px)
- `--space-10: 2.5rem` (40px)
- `--space-12: 3rem` (48px)
- `--space-16: 4rem` (64px)
- `--space-20: 5rem` (80px)
- `--space-24: 6rem` (96px)
- `--space-32: 8rem` (128px)

### Radius Standard

- `--radius-none: 0`
- `--radius-sm: 4px`
- `--radius-md: 8px`
- `--radius-lg: 12px`
- `--radius-xl: 16px`
- `--radius-2xl: 20px`
- `--radius-full: 9999px`

### Shadow Standard

- `--shadow-xs: 0 1px 2px rgba(17, 17, 17, 0.05)`
- `--shadow-sm: 0 8px 18px rgba(17, 17, 17, 0.08)`
- `--shadow-md: 0 14px 28px rgba(17, 17, 17, 0.10)`
- `--shadow-lg: 0 18px 38px rgba(17, 17, 17, 0.12)`
- `--shadow-soft: 0 12px 32px rgba(var(--color-trust-rgb), 0.08)`
- `--shadow-xl: 0 24px 52px rgba(17, 17, 17, 0.14)`

### Container Width Standard

#### Utility containers

- `.container-narrow`
  - `max-width: 640px`
  - `padding-inline: var(--space-4)` (base), `var(--space-6)` (`sm+`), `var(--space-8)` (`lg+`)
- `.container-default`
  - `max-width: 1024px`
  - `padding-inline: var(--space-4)` (base), `var(--space-6)` (`sm+`), `var(--space-8)` (`lg+`)

#### App shell containers

- `.app-page-container`
  - `max-width: 80rem` (1280px)
  - `padding-block: 1.5rem` (base), `2rem` (`sm+`)
  - `padding-inline: 1rem` (base), `2rem` (`sm+`), `3rem` (`lg+`)
- `.ak-shell`
  - `width: min(100%, 1100px)`
  - `padding-inline: 1rem` (base), `1.5rem` (`sm+`)
- `.ak-shell-wide`
  - `width: min(100%, 1240px)`

---

## 3) Form Field Spec (Input / Select / Textarea)

Tüm metin tabanlı alanlar ortak bir alan standardı kullanır:

- Input/Select yükseklik: `h-11`
- Radius: `rounded-xl` (`--radius-xl`)
- Arka plan: `var(--color-surface-raised)`
- Border: `1px solid var(--color-border)`
- Hover border (Input/Select, Textarea non-error): `var(--color-border-strong)`
- Focus: `ring-2` + `var(--color-primary)/20`
- Error: `var(--color-error)` border + error ring
- Disabled: `cursor-not-allowed`, düşük kontrast metin + `var(--color-surface)`

Doğru örnek kullanım:

```tsx
import { Input, Select, Textarea } from '@/app/components/ui';

<Input label="Email" type="email" error={errors.email} hint="İş e-posta adresinizi girin" />
<Select
  label="Kategori"
  options={[
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ]}
  defaultValue="a"
/>
<Textarea label="Açıklama" rows={4} error={errors.description} />
```

> Not: `Select` bileşeninde `options` prop'u zorunludur.

---

## 4) Component API ve Örnekler (Signature ile uyumlu)

### Button

Supported props:

- `variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'`
- `size?: 'sm' | 'md' | 'lg' | 'icon'`
- `loading?: boolean`
- Native `button` props (örn. `type`, `disabled`, `onClick`)

```tsx
import { Button } from '@/app/components/ui';

<Button variant="primary" type="submit">Kaydet</Button>
<Button variant="secondary">Geri</Button>
<Button variant="outline">İptal</Button>
<Button variant="ghost" size="icon" aria-label="Kapat">×</Button>
<Button variant="destructive" loading>Siliyor...</Button>
```

### Card

Supported props:

- `variant?: 'default' | 'elevated' | 'interactive' | 'glass'`
- `padding?: 'none' | 'sm' | 'md' | 'lg'`
- Native `div` props
- Composition helpers: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
} from "@/app/components/ui";

<Card variant="elevated" padding="md">
  <CardHeader>
    <CardTitle>Başlık</CardTitle>
    <CardDescription>Kısa açıklama</CardDescription>
  </CardHeader>
  <CardContent>İçerik</CardContent>
  <CardFooter>
    <Button size="sm">Aksiyon</Button>
  </CardFooter>
</Card>;
```

---

## 5) Do / Don’t (Surface ve Renk Disiplini)

### ✅ Do

- App-level yüzeylerde (`page`, `layout`, `section`, `card`) yalnızca design token tabanlı renkler kullan:
  - `bg-[var(--color-surface)]`
  - `bg-[var(--color-surface-raised)]`
  - `bg-[var(--color-surface-sunken)]`
  - `border-[var(--color-border)]` vb.
- Metinlerde `--color-ink*` ailesini tercih et.
- Durumlar için `--color-success|warning|error|info` semantic tokenlarını kullan.

### ❌ Don’t

- App-level surface'lerde ad-hoc Tailwind palet sınıfları kullanma:
  - `bg-red-50`, `bg-zinc-100`, `border-stone-300`, `text-slate-700` vb.
- Aynı ekranda token + palette yaklaşımını karıştırma.
- “Geçici” amaçla hardcoded hex renk (`#...`) ekleyip bırakma.

---

## 6) Route-by-Route Migration Checklist

Mevcut sayfaları kademeli taşımak için her route'ta bu listeyi uygula:

1. **Route envanteri çıkar**
   - Sayfadaki tüm `bg-*`, `text-*`, `border-*`, `shadow-*`, `rounded-*` kullanımını listele.
2. **Surface dönüşümü yap**
   - `bg-*` palette class'larını `--color-surface*` tokenlarına taşı.
3. **Text dönüşümü yap**
   - Metin tonlarını `--color-ink`, `--color-ink-secondary`, `--color-ink-tertiary` ile normalize et.
4. **Border dönüşümü yap**
   - Border renklerini `--color-border`, `--color-border-light`, `--color-border-strong` ile eşle.
5. **Action/Semantic dönüşümü yap**
   - CTA/state renklerini `--color-primary*` ve semantic tokenlar ile değiştir.
6. **Primitive adoption**
   - Özel buton/field/card bloklarını mümkünse `Button`, `Input`, `Select`, `Textarea`, `Card` ile değiştir.
7. **Spacing/Radius/Shadow hizalaması**
   - Değerleri canonical ölçeklere çek (`--space-*`, `--radius-*`, `--shadow-*`).
8. **Container standardizasyonu**
   - Sayfa yapısını `.container-default`, `.app-page-container`, `.ak-shell` standardına hizala.
9. **Dark mode smoke test**
   - `.dark` altında kontrast ve yüzey ayrışmasını kontrol et.
10. **Regression kontrolü**
    - Etkileşim durumlarını test et: hover, focus-visible, disabled, error.

---

## 7) Import Pattern

```tsx
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Select,
  Textarea,
} from "@/app/components/ui";
```
