"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Newspaper, Search, Clock, User, Eye, MessageCircle, Share2, 
  Bookmark, TrendingUp, Star, ChevronRight, Calendar, Tag
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";

type Category = "all" | "news" | "guide" | "community" | "events";

export default function HaberlerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  const categories = [
    { value: "all", label: "Tümü", icon: "📰" },
    { value: "news", label: "Haberler", icon: "🗞️" },
    { value: "guide", label: "Rehberler", icon: "📚" },
    { value: "community", label: "Topluluk", icon: "👥" },
    { value: "events", label: "Etkinlikler", icon: "🎉" },
  ];

  const filteredNews = selectedCategory === "all" 
    ? NEWS 
    : NEWS.filter(n => n.category === selectedCategory);

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-[var(--color-surface)] text-[var(--color-ink)]">
          {/* HERO */}
          <section className="relative overflow-hidden bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('/pattern.svg')]" />
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Haberler & Rehberler</h1>
                  <p className="text-white/80 text-lg">
                    Amerika&apos;daki Türk topluluğu için güncel haberler ve yararlı bilgiler
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-[color:var(--color-surface-raised)]/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">{NEWS.length * 10}</div>
                  <div className="text-sm text-white/80">Makale</div>
                </div>
                <div className="bg-[color:var(--color-surface-raised)]/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">25+</div>
                  <div className="text-sm text-white/80">Rehber</div>
                </div>
                <div className="bg-[color:var(--color-surface-raised)]/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">50K</div>
                  <div className="text-sm text-white/80">Okuyucu</div>
                </div>
                <div className="bg-[color:var(--color-surface-raised)]/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">Haftalık</div>
                  <div className="text-sm text-white/80">Güncelleme</div>
                </div>
              </div>
            </div>
          </section>

          {/* FILTERS */}
          <section className="sticky top-16 z-40 bg-[var(--color-surface)]/90 backdrop-blur-lg border-b border-[var(--color-border-light)] shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Haber veya rehber ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={18} />}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value as Category)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-smooth whitespace-nowrap ${
                      selectedCategory === cat.value
                        ? "bg-[var(--color-primary)] text-white shadow-lg"
                        : "bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] border border-[var(--color-border-light)]"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURED ARTICLE */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-bold">Öne Çıkan</h2>
            </div>

            <Card className="glass overflow-hidden hover:shadow-xl transition-smooth mb-8 bg-[var(--color-surface-raised)] border border-[var(--color-border-light)]">
              <div className="md:flex">
                <div className="md:w-1/2 h-64 md:h-auto bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)]">
                  <img src="/news/featured.jpg" alt="" className="w-full h-full object-cover" />
                </div>
                <CardContent className="md:w-1/2 p-6 flex flex-col justify-center">
                  <Badge variant="primary" size="sm" className="w-fit mb-3">Öne Çıkan Rehber</Badge>
                  <h3 className="text-2xl font-bold mb-3">2025 Green Card Başvuru Rehberi</h3>
                  <p className="text-[var(--color-ink-secondary)] mb-4">
                    Green Card başvuru sürecinde bilmeniz gereken her şey: Başvuru türleri, gerekli belgeler, 
                    süreler ve pratik ipuçları...
                  </p>
                  <div className="flex items-center gap-4 text-sm text-[var(--color-ink-tertiary)] mb-4">
                    <div className="flex items-center gap-1"><Clock size={14} />15 dk okuma</div>
                    <div className="flex items-center gap-1"><Eye size={14} />12.5K görüntülenme</div>
                  </div>
                  <Button variant="primary" className="w-fit gap-2">
                    Rehberi Oku <ChevronRight size={18} />
                  </Button>
                </CardContent>
              </div>
            </Card>

            {/* NEWS GRID */}
            <h2 className="text-2xl font-bold mb-6">
              {selectedCategory === "all" ? "Son Haberler" : categories.find(c => c.value === selectedCategory)?.label}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function NewsCard({ news }: { news: typeof NEWS[0] }) {
  const [saved, setSaved] = useState(false);

  return (
    <Card className="glass hover:shadow-lg transition-smooth group bg-[var(--color-surface-raised)] border border-[var(--color-border-light)]">
      <div className="h-48 overflow-hidden rounded-t-xl">
        <img src={news.image} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
      </div>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={news.category === "news" ? "info" : news.category === "guide" ? "success" : "default"} size="sm">
            {news.categoryLabel}
          </Badge>
          <span className="text-xs text-[var(--color-ink-tertiary)]">{news.date}</span>
        </div>

        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-red-600 transition-smooth">
          {news.title}
        </h3>
        <p className="text-sm text-[var(--color-ink-secondary)] mb-4 line-clamp-2">
          {news.excerpt}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-light)]">
          <div className="flex items-center gap-2">
            <Avatar src={news.author.avatar} fallback={news.author.name} size="sm" />
            <span className="text-sm">{news.author.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[var(--color-surface-sunken)] rounded-full transition-smooth">
              <Share2 size={16} />
            </button>
            <button onClick={() => setSaved(!saved)} className="p-2 hover:bg-[var(--color-surface-sunken)] rounded-full transition-smooth">
              <Bookmark size={16} className={saved ? "fill-amber-500 text-amber-500" : ""} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const NEWS = [
  {
    id: 1, title: "H1B Vize Loteryası 2025 Sonuçları Açıklandı",
    excerpt: "Bu yılki H1B vize loteryası sonuçları açıklandı. Seçilen başvuru sahipleri için sonraki adımlar...",
    image: "/news/visa.jpg", category: "news", categoryLabel: "Göçmenlik",
    date: "2 gün önce", author: { name: "AmerikaLa Editör", avatar: "/avatars/editor.jpg" }
  },
  {
    id: 2, title: "Ev Alırken Dikkat Edilmesi Gerekenler",
    excerpt: "Amerika'da ilk evini almayı düşünenler için kapsamlı rehber. Mortgage, down payment, closing costs...",
    image: "/news/house.jpg", category: "guide", categoryLabel: "Rehber",
    date: "1 hafta önce", author: { name: "Zeynep K.", avatar: "/avatars/zeynep.jpg" }
  },
  {
    id: 3, title: "NYC Turkish Festival Büyük İlgi Gördü",
    excerpt: "Bu yıl düzenlenen NYC Turkish Festival 10,000'den fazla ziyaretçi ağırladı...",
    image: "/news/festival.jpg", category: "community", categoryLabel: "Topluluk",
    date: "3 gün önce", author: { name: "Ahmet Y.", avatar: "/avatars/ahmet.jpg" }
  },
  {
    id: 4, title: "Sağlık Sigortası Seçim Rehberi",
    excerpt: "Open enrollment döneminde doğru sağlık sigortasını seçmek için bilmeniz gerekenler...",
    image: "/news/health.jpg", category: "guide", categoryLabel: "Rehber",
    date: "5 gün önce", author: { name: "Dr. Elif D.", avatar: "/avatars/elif.jpg" }
  },
  {
    id: 5, title: "San Francisco Networking Etkinliği",
    excerpt: "Aylık SF Tech Networking etkinliği bu Cumartesi. 50+ katılımcı bekleniyor...",
    image: "/news/networking.jpg", category: "events", categoryLabel: "Etkinlik",
    date: "1 gün önce", author: { name: "Can Ö.", avatar: "/avatars/can.jpg" }
  },
  {
    id: 6, title: "Vergi Sezonu: Bilmeniz Gerekenler",
    excerpt: "2025 vergi sezonu yaklaşıyor. Tax filing için önemli tarihler ve ipuçları...",
    image: "/news/tax.jpg", category: "guide", categoryLabel: "Rehber",
    date: "1 hafta önce", author: { name: "Mehmet Ş.", avatar: "/avatars/mehmet.jpg" }
  },
];
