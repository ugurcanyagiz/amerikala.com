"use client";

import { useState } from "react";
import {
  Zap,
  Search,
  MapPin,
  Users,
  Clock,
  Plus,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { Modal } from "../components/ui/Modal";
import { PageHero, ResponsiveCardGrid, StickyFilterBar } from "../components/ui/SectionPrimitives";

type Category = "all" | "coffee" | "food" | "sports" | "culture" | "networking";

export default function YakalaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = [
    { value: "all", label: "Tümü", icon: "⚡" },
    { value: "coffee", label: "Kahve", icon: "☕" },
    { value: "food", label: "Yemek", icon: "🍽️" },
    { value: "sports", label: "Spor", icon: "⚽" },
    { value: "culture", label: "Kültür", icon: "🎭" },
    { value: "networking", label: "Networking", icon: "💼" },
  ];

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-[var(--color-surface)] text-[var(--color-ink)]">
          <PageHero
            title={(
              <span className="flex items-center gap-3">
                <Zap className="h-9 w-9" /> Yakala
              </span>
            )}
            description="Anlık buluşmalar oluştur, yakınındaki insanlarla tanış"
            className="from-amber-500 to-orange-600"
            descriptionClassName="text-amber-100"
            actions={(
              <Button
                variant="secondary"
                size="lg"
                className="w-full gap-2 shadow-xl sm:w-auto"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="h-5 w-5" />
                Yakala Oluştur
              </Button>
            )}
            stats={(
              <ResponsiveCardGrid cols="compact">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold">{YAKALAS.length * 8}</div>
                  <div className="text-sm text-amber-100">Aktif Yakala</div>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold">45</div>
                  <div className="text-sm text-amber-100">Şehir</div>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold">1.2K</div>
                  <div className="text-sm text-amber-100">Bu Hafta</div>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold">15 dk</div>
                  <div className="text-sm text-amber-100">Ort. Yanıt</div>
                </div>
              </ResponsiveCardGrid>
            )}
          />

          <section className="relative z-10 mx-auto -mt-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <Card className="glass border border-[var(--color-border-light)] bg-[var(--color-surface-raised)]">
              <CardContent className="p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Nasıl Çalışır?
                </h2>
                <div className="grid gap-4 md:grid-cols-4">
                  {["Yakala Oluştur", "Konum Ekle", "Yakındakiler Görsün", "Buluşun!"].map((step, idx) => (
                    <div key={step} className="text-center">
                      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <span className="text-xl font-bold text-amber-600">{idx + 1}</span>
                      </div>
                      <p className="text-sm font-medium">{step}</p>
                      <p className="text-xs text-[var(--color-ink-tertiary)]">
                        {idx === 0 && "Ne yapmak istediğini yaz"}
                        {idx === 1 && "Nerede olduğunu belirt"}
                        {idx === 2 && "Çevrendeki insanlar görür"}
                        {idx === 3 && "Gerçek hayatta tanışın"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <StickyFilterBar className="mt-6">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1">
                <Input
                  placeholder="Aktivite ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search size={18} />}
                />
              </div>
              <Select
                options={[
                  { value: "all", label: "Tüm Şehirler" },
                  { value: "nyc", label: "New York" },
                  { value: "la", label: "Los Angeles" },
                  { value: "sf", label: "San Francisco" },
                ]}
              />
            </div>

            <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value as Category)}
                  className={`h-10 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-smooth flex items-center gap-2 ${
                    selectedCategory === cat.value
                      ? "bg-[var(--color-primary)] text-white shadow-lg"
                      : "border border-[var(--color-border-light)] bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)]"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </StickyFilterBar>

          <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-bold">Aktif Yakalalar</h2>
            </div>

            <ResponsiveCardGrid>
              {YAKALAS.map((yakala) => (
                <YakalaCard key={yakala.id} yakala={yakala} />
              ))}
            </ResponsiveCardGrid>
          </section>

          <Modal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Yakala Oluştur"
            description="Ne yapmak istediğini paylaş"
            size="md"
          >
            <div className="space-y-4">
              <Select label="Kategori" options={categories.slice(1).map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))} />
              <Input label="Başlık" placeholder="örn: Kahve içmeye var mı?" />
              <Textarea label="Açıklama" placeholder="Detayları yaz..." rows={3} />
              <Input label="Konum" placeholder="Buluşma yeri" icon={<MapPin size={18} />} />
              <Input label="Zaman" type="datetime-local" icon={<Clock size={18} />} />
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  İptal
                </Button>
                <Button variant="primary">Yakala Oluştur</Button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  );
}

function YakalaCard({ yakala }: { yakala: typeof YAKALAS[0] }) {
  const [interested, setInterested] = useState(false);

  return (
    <Card className="glass border border-[var(--color-border-light)] bg-[var(--color-surface-raised)] transition-smooth hover:shadow-lg">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={yakala.creator.avatar} fallback={yakala.creator.name} size="md" status="online" />
            <div>
              <p className="font-semibold">{yakala.creator.name}</p>
              <p className="text-xs text-[var(--color-ink-tertiary)]">{yakala.timeAgo}</p>
            </div>
          </div>
          <Badge variant="warning" size="sm">
            {yakala.category}
          </Badge>
        </div>

        <h3 className="mb-2 text-lg font-bold">{yakala.title}</h3>
        <p className="mb-4 text-sm text-[var(--color-ink-secondary)]">{yakala.description}</p>

        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-secondary)]">
            <MapPin size={16} className="text-amber-500" />
            <span>{yakala.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-secondary)]">
            <Clock size={16} className="text-amber-500" />
            <span>{yakala.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-secondary)]">
            <Users size={16} className="text-amber-500" />
            <span>{yakala.interested} kişi ilgileniyor</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={interested ? "secondary" : "primary"}
            size="sm"
            className="flex-1 gap-1"
            onClick={() => setInterested(!interested)}
          >
            <Heart size={16} className={interested ? "fill-current" : ""} />
            İlgileniyorum
          </Button>
          <Button variant="secondary" size="sm">
            <MessageCircle size={16} />
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const YAKALAS = [
  { id: 1, title: "Kahve içmeye var mı?", description: "Manhattan'da bir kafede oturup sohbet edelim. Türkçe konuşmak isteyen herkese açık!", category: "☕ Kahve", location: "Times Square, NYC", time: "Bugün 15:00", timeAgo: "10 dk önce", interested: 5, creator: { name: "Zeynep K.", avatar: "/avatars/zeynep.jpg" }},
  { id: 2, title: "Central Park Koşusu", description: "Sabah koşusuna eşlik edecek birini arıyorum. 5K civarı koşacağız.", category: "⚽ Spor", location: "Central Park, NYC", time: "Yarın 07:00", timeAgo: "30 dk önce", interested: 3, creator: { name: "Ahmet Y.", avatar: "/avatars/ahmet.jpg" }},
  { id: 3, title: "Brunch grubu", description: "Hafta sonu brunch yapmak isteyen var mı? Yeni bir mekan keşfedelim.", category: "🍽️ Yemek", location: "Brooklyn, NYC", time: "Cumartesi 11:00", timeAgo: "2 saat önce", interested: 8, creator: { name: "Elif D.", avatar: "/avatars/elif.jpg" }},
  { id: 4, title: "Tech Talk & Networking", description: "Tech'te çalışan Türkler, bir araya gelip tecrübe paylaşalım.", category: "💼 Networking", location: "WeWork, SF", time: "Bugün 18:00", timeAgo: "1 saat önce", interested: 12, creator: { name: "Can Ö.", avatar: "/avatars/can.jpg" }},
  { id: 5, title: "Türk Filmi Gecesi", description: "Evde Türk filmi izleyeceğiz. Katılmak isteyen mesaj atsın!", category: "🎭 Kültür", location: "Jersey City, NJ", time: "Cuma 20:00", timeAgo: "4 saat önce", interested: 6, creator: { name: "Ayşe K.", avatar: "/avatars/ayse.jpg" }},
  { id: 6, title: "Basketbol Maçı", description: "2v2 veya 3v3 basketbol oynayacak arkadaş arıyorum.", category: "⚽ Spor", location: "LA Fitness, LA", time: "Bugün 19:00", timeAgo: "45 dk önce", interested: 4, creator: { name: "Mehmet Ş.", avatar: "/avatars/mehmet.jpg" }},
];
