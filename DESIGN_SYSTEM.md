# AmerikaLa Design System

## 🎨 Genel Bakış

Modern, futuristik ve profesyonel bir tasarım sistemi. Türk topluluğu için Amerika'da sosyal platform.

## Renk Paleti

### Primary Colors (Marka Renkleri)
- `--primary-500`: #ef4444 (Ana Kırmızı)
- `--primary-600`: #dc2626 (Koyu Kırmızı)
- `--primary-400`: #f87171 (Açık Kırmızı)

### Neutral Colors
- Light Mode: Beyaz arka plan (#ffffff)
- Dark Mode: Siyah arka plan (#0a0a0a)

### Semantic Colors
- Success: #10b981 (Yeşil)
- Warning: #f59e0b (Turuncu)
- Error: #ef4444 (Kırmızı)
- Info: #3b82f6 (Mavi)

## 🧩 Komponentler

### Button
```tsx
import { Button } from '@/app/components/ui';

<Button variant="primary" size="md">Kayıt Ol</Button>
<Button variant="outline">İptal</Button>
<Button variant="ghost">Daha Fazla</Button>
```

**Variants:**
- `default` - Standart stil
- `primary` - Gradient primary buton
- `secondary` - İkincil buton
- `outline` - Outline buton
- `ghost` - Şeffaf buton
- `destructive` - Silme işlemleri için

**Sizes:**
- `sm` - Küçük (h-8)
- `md` - Orta (h-10)
- `lg` - Büyük (h-12)
- `icon` - İkon butonu (h-10 w-10)

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui';

<Card variant="glass">
  <CardHeader>
    <CardTitle>Başlık</CardTitle>
    <CardDescription>Açıklama</CardDescription>
  </CardHeader>
  <CardContent>İçerik</CardContent>
</Card>
```

**Variants:**
- `default` - Standart card
- `glass` - Glassmorphism efekti
- `elevated` - Yükseltilmiş shadow

### Input
```tsx
import { Input } from '@/app/components/ui';

<Input 
  label="Email" 
  type="email" 
  placeholder="ornek@email.com"
  icon={<Mail />}
  error="Geçersiz email"
/>
```

### Textarea
```tsx
import { Textarea } from '@/app/components/ui';

<Textarea 
  label="Açıklama" 
  placeholder="Buraya yazın..."
  rows={4}
/>
```

### Select
```tsx
import { Select } from '@/app/components/ui';

<Select 
  label="Kategori"
  options={[
    { value: 'tech', label: 'Teknoloji' },
    { value: 'sport', label: 'Spor' }
  ]}
/>
```

### Badge
```tsx
import { Badge } from '@/app/components/ui';

<Badge variant="primary">Yeni</Badge>
<Badge variant="success">Aktif</Badge>
<Badge variant="warning">Beklemede</Badge>
```

### Avatar
```tsx
import { Avatar } from '@/app/components/ui';

<Avatar 
  src="/avatar.jpg" 
  fallback="JD"
  size="lg"
  status="online"
/>
```

**Status:**
- `online` - Yeşil
- `offline` - Gri
- `away` - Sarı
- `busy` - Kırmızı

### Modal
```tsx
import { Modal } from '@/app/components/ui';

<Modal 
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Başlık"
  description="Açıklama"
  size="md"
>
  İçerik
</Modal>
```

## 🎭 Utility Classes

### Glassmorphism
```tsx
<div className="glass">
  Glassmorphism efekti
</div>
```

### Gradient Backgrounds
```tsx
<div className="gradient-primary">Primary gradient</div>
<div className="gradient-mesh">Mesh gradient</div>
```

### Text Gradient
```tsx
<h1 className="text-gradient">Gradient Text</h1>
```

### Animations
```tsx
<div className="animate-fade-in">Fade in</div>
<div className="animate-slide-up">Slide up</div>
<div className="animate-scale-in">Scale in</div>
```

### Transitions
```tsx
<div className="transition-smooth">Smooth transition</div>
```

## 📐 Spacing & Sizing

### Border Radius
- `--radius-sm`: 0.375rem (6px)
- `--radius-md`: 0.5rem (8px)
- `--radius-lg`: 0.75rem (12px)
- `--radius-xl`: 1rem (16px)
- `--radius-2xl`: 1.5rem (24px)

### Shadows
- `--shadow-sm`: Küçük shadow
- `--shadow-md`: Orta shadow
- `--shadow-lg`: Büyük shadow
- `--shadow-xl`: Extra büyük shadow

## 🌓 Dark Mode

Dark mode otomatik olarak sistem tercihine göre aktif olur.
Manuel kontrol için:

```tsx
<html className="dark">
```

## ♿ Accessibility

- Tüm interaktif elementler keyboard navigasyonu destekler
- Focus states görünür
- ARIA labels kullanılır
- Color contrast WCAG 2.1 AA standardına uygun

## 📱 Responsive Design

Mobile-first yaklaşım:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 🚀 Best Practices

1. **Consistent Spacing**: Tailwind spacing scale kullan (4px increments)
2. **Color Tokens**: CSS variables kullan, hardcoded renkler kullanma
3. **Reusable Components**: UI component library'den yararlan
4. **Accessibility**: Her zaman semantic HTML ve ARIA kullan
5. **Performance**: Lazy loading ve code splitting uygula
6. **Animations**: Animasyonları dikkatli kullan, overdo yapma

## 📦 Import Pattern

```tsx
// Tüm UI komponentleri
import { 
  Button, 
  Card, 
  Input, 
  Badge, 
  Avatar,
  Modal 
} from '@/app/components/ui';
```

## 🔄 Updating Design System

Yeni komponent eklerken:
1. Component dosyasını `app/components/ui/` altında oluştur
2. `app/components/ui/index.ts`'e export ekle
3. Bu dokümantasyonu güncelle
4. TypeScript types tanımla
5. Accessibility test et

---

**Version:** 1.0.0  
**Last Updated:** 2025  
**Maintained by:** AmerikaLa Team
