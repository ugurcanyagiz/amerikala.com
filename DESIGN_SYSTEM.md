# AmerikaLa Design System

## Genel Bakış
Bu doküman `app/components/ui` altındaki mevcut primitive bileşenlerin canlı davranışını açıklar.

## Form Field Spec (Input / Select / Textarea)
Tüm metin tabanlı alanlar ortak bir alan standardı kullanır:

- Yükseklik: `h-11` (Input ve Select)
- Radius: `rounded-xl`
- Arka plan: `var(--color-surface-raised)`
- Border: `1px solid var(--color-border)`
- Hover border: `var(--color-border-strong)`
- Focus: `ring-2` + `var(--color-primary)/20`
- Error: `var(--color-error)` border + error ring
- Disabled: `cursor-not-allowed`, düşük kontrast metin ve `var(--color-surface)` arka plan

Örnek:

```tsx
import { Input, Select, Textarea } from '@/app/components/ui';

<Input label="Email" type="email" error={errors.email} />
<Select label="Kategori" options={[{ value: 'a', label: 'A' }]} />
<Textarea label="Açıklama" rows={4} />
```

## Button

```tsx
import { Button } from '@/app/components/ui';

<Button variant="primary">Kaydet</Button>
<Button variant="secondary">Geri</Button>
<Button variant="outline">İptal</Button>
<Button variant="ghost" size="icon">…</Button>
```

### Variants
- `primary`
- `secondary`
- `outline`
- `ghost`
- `destructive`

### Sizes
- `sm` (`h-9`)
- `md` (`h-10`)
- `lg` (`h-12`)
- `icon` (`h-10 w-10`)

### Interaction
- Radius: `var(--radius-xl)`
- Hover elevation: küçükten orta shadow seviyesine çıkar
- Focus-visible ring desteklenir

## Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui';

<Card variant="elevated">
  <CardHeader>
    <CardTitle>Başlık</CardTitle>
  </CardHeader>
  <CardContent>İçerik</CardContent>
</Card>
```

### Variants
- `default`: border + `shadow-sm`
- `elevated`: border-light + `shadow-md`
- `interactive`: hover’da yükselme (`-translate-y-0.5`, `shadow-md`)
- `glass`: yarı saydam raised yüzey + blur

### Tokens
- Radius: `var(--radius-2xl)`
- Shadow: `--shadow-sm`, `--shadow-md`

## Import Pattern

```tsx
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  Textarea,
} from '@/app/components/ui';
```
