"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Zap, Search, MapPin, Calendar, Users, Clock, Plus, Star, 
  TrendingUp, Heart, MessageCircle, Share2, ChevronRight, Sparkles
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

        <main className="flex-1">
          {/* HERO */}
          <section className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 text-white">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('/pattern.svg')]" />
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                    <Zap className="h-10 w-10" />
                    Yakala
                  </h1>
                  <p className="text-amber-100 text-lg">
                    Anlık buluşmalar oluştur, yakınındaki insanlarla tanış
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="gap-2 shadow-xl"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                  Yakala Oluştur
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">{YAKALAS.length * 8}</div>
                  <div className="text-sm text-amber-100">Aktif Yakala</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">45</div>
                  <div className="text-sm text-amber-100">Şehir</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">1.2K</div>
                  <div className="text-sm text-amber-100">Bu Hafta</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">15 dk</div>
                  <div className="text-sm text-amber-100">Ort. Yanıt</div>
                </div>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
            <Card className="glass">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Nasıl Çalışır?
                </h2>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl font-bold text-amber-600">1</span>
                    </div>
                    <p className="text-sm font-medium">Yakala Oluştur</p>
                    <p className="text-xs text-neutral-500">Ne yapmak istediğini yaz</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl font-bold text-amber-600">2</span>
                    </div>
                    <p className="text-sm font-medium">Konum Ekle</p>
                    <p className="text-xs text-neutral-500">Nerede olduğunu belirt</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl font-bold text-amber-600">3</span>
                    </div>
                    <p className="text-sm font-medium">Yakındakiler Görsün</p>
                    <p className="text-xs text-neutral-500">Çevrendeki insanlar görür</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl font-bold text-amber-600">4</span>
                    </div>
                    <p className="text-sm font-medium">Buluşun!</p>
                    <p className="text-xs text-neutral-500">Gerçek hayatta tanışın</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* FILTERS */}
          <section className="sticky top-16 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 shadow-sm mt-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input placeholder="Aktivite ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} icon={<Search size={18} />} />
                </div>
                <Select options={[
                  { value: "all", label: "Tüm Şehirler" },
                  { value: "nyc", label: "New York" },
                  { value: "la", label: "Los Angeles" },
                  { value: "sf", label: "San Francisco" },
                ]} />
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value as Category)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-smooth whitespace-nowrap ${
                      selectedCategory === cat.value
                        ? "bg-amber-500 text-white shadow-lg"
                        : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* YAKALAS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-bold">Aktif Yakalalar</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {YAKALAS.map((yakala) => (
                <YakalaCard key={yakala.id} yakala={yakala} />
              ))}
            </div>
          </section>

          {/* CREATE MODAL */}
          <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yakala Oluştur" description="Ne yapmak istediğini paylaş" size="md">
            <div className="space-y-4">
              <Select label="Kategori" options={categories.slice(1).map(c => ({ value: c.value, label: `${c.icon} ${c.label}` }))} />
              <Input label="Başlık" placeholder="örn: Kahve içmeye var mı?" />
              <Textarea label="Açıklama" placeholder="Detayları yaz..." rows={3} />
              <Input label="Konum" placeholder="Buluşma yeri" icon={<MapPin size={18} />} />
              <Input label="Zaman" type="datetime-local" icon={<Clock size={18} />} />
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
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
    <Card className="glass hover:shadow-lg transition-smooth">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar src={yakala.creator.avatar} fallback={yakala.creator.name} size="md" status="online" />
            <div>
              <p className="font-semibold">{yakala.creator.name}</p>
              <p className="text-xs text-neutral-500">{yakala.timeAgo}</p>
            </div>
          </div>
          <Badge variant="warning" size="sm">{yakala.category}</Badge>
        </div>

        <h3 className="font-bold text-lg mb-2">{yakala.title}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{yakala.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <MapPin size={16} className="text-amber-500" />
            <span>{yakala.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <Clock size={16} className="text-amber-500" />
            <span>{yakala.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <Users size={16} className="text-amber-500" />
            <span>{yakala.interested} kişi ilgileniyor</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant={interested ? "outline" : "primary"} 
            size="sm" 
            className="flex-1 gap-1"
            onClick={() => setInterested(!interested)}
          >
            <Heart size={16} className={interested ? "fill-current" : ""} />
            {interested ? "İlgileniyorum" : "İlgileniyorum"}
          </Button>
          <Button variant="outline" size="sm"><MessageCircle size={16} /></Button>
          <Button variant="ghost" size="sm"><Share2 size={16} /></Button>
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
