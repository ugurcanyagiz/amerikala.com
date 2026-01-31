"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShoppingBag, Search, MapPin, DollarSign, Heart, Grid, List, Plus, 
  Star, Car, Laptop, Shirt, Armchair, Wrench, Package, Filter, MessageCircle
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

type Category = "all" | "araba" | "elektronik" | "giyim" | "mobilya" | "hizmet" | "diger";
type ViewMode = "grid" | "list";

const CATEGORIES = [
  { value: "all", label: "Tümü", icon: Package, emoji: "🛒" },
  { value: "araba", label: "Araba", icon: Car, emoji: "🚗" },
  { value: "elektronik", label: "Elektronik", icon: Laptop, emoji: "💻" },
  { value: "giyim", label: "Giyim", icon: Shirt, emoji: "👕" },
  { value: "mobilya", label: "Mobilya", icon: Armchair, emoji: "🛋️" },
  { value: "hizmet", label: "Hizmet", icon: Wrench, emoji: "🔧" },
  { value: "diger", label: "Diğer", icon: Package, emoji: "📦" },
];

export default function AlisverisPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedState, setSelectedState] = useState("all");

  const filteredListings = selectedCategory === "all" 
    ? LISTINGS 
    : LISTINGS.filter(l => l.category === selectedCategory);

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          {/* HERO */}
          <section className="relative overflow-hidden bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('/pattern.svg')]" />
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Alışveriş</h1>
                  <p className="text-teal-100 text-lg">
                    Türk topluluğundan güvenilir alım-satım platformu
                  </p>
                </div>
                <Link href="/alisveris/ilan-ver">
                  <Button variant="secondary" size="lg" className="gap-2 shadow-xl">
                    <Plus className="h-5 w-5" />
                    İlan Ver
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">{LISTINGS.length * 25}</div>
                  <div className="text-sm text-teal-100">Aktif İlan</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">45</div>
                  <div className="text-sm text-teal-100">Eyalet</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">2.5K</div>
                  <div className="text-sm text-teal-100">Satıcı</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-sm text-teal-100">Memnuniyet</div>
                </div>
              </div>
            </div>
          </section>

          {/* CATEGORY CARDS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {CATEGORIES.slice(1).map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value as Category)}
                    className={`p-4 rounded-xl text-center transition-smooth ${
                      selectedCategory === cat.value
                        ? "bg-teal-500 text-white shadow-lg"
                        : "bg-white dark:bg-neutral-800 hover:shadow-md"
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.emoji}</div>
                    <p className="text-sm font-medium">{cat.label}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* FILTERS */}
          <section className="sticky top-16 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 shadow-sm mt-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Ürün veya hizmet ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={18} />}
                  />
                </div>

                <Select
                  options={[
                    { value: "all", label: "Tüm Eyaletler" },
                    { value: "NY", label: "New York" },
                    { value: "CA", label: "California" },
                    { value: "TX", label: "Texas" },
                    { value: "NJ", label: "New Jersey" },
                  ]}
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                />

                <Select
                  options={[
                    { value: "newest", label: "En Yeni" },
                    { value: "price-low", label: "Fiyat: Düşükten Yükseğe" },
                    { value: "price-high", label: "Fiyat: Yüksekten Düşüğe" },
                  ]}
                />

                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                  <button onClick={() => setViewMode("grid")} className={`p-2 rounded ${viewMode === "grid" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"}`}>
                    <Grid size={20} />
                  </button>
                  <button onClick={() => setViewMode("list")} className={`p-2 rounded ${viewMode === "list" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"}`}>
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* LISTINGS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {selectedCategory === "all" ? "Tüm İlanlar" : CATEGORIES.find(c => c.value === selectedCategory)?.label}
              </h2>
              <div className="text-sm text-neutral-500">{filteredListings.length} ilan</div>
            </div>

            <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-4"}>
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} viewMode={viewMode} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function ListingCard({ listing, viewMode }: { listing: typeof LISTINGS[0]; viewMode: ViewMode }) {
  const [liked, setLiked] = useState(false);

  if (viewMode === "list") {
    return (
      <Card className="glass hover:shadow-lg transition-smooth">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-bold text-teal-600">${listing.price.toLocaleString()}</p>
                  <h3 className="font-bold truncate">{listing.title}</h3>
                </div>
                <button onClick={() => setLiked(!liked)}>
                  <Heart size={20} className={liked ? "fill-red-500 text-red-500" : ""} />
                </button>
              </div>
              <div className="flex items-center gap-1 text-sm text-neutral-500 mt-1">
                <MapPin size={14} />{listing.location}
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">{listing.description}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Avatar src={listing.seller.avatar} fallback={listing.seller.name} size="sm" />
                  <span className="text-sm">{listing.seller.name}</span>
                </div>
                <Button variant="primary" size="sm">Mesaj Gönder</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass hover:shadow-lg transition-smooth group">
      <div className="relative h-40 overflow-hidden rounded-t-xl">
        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
        <button onClick={() => setLiked(!liked)} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center">
          <Heart size={16} className={liked ? "fill-red-500 text-red-500" : ""} />
        </button>
        <Badge variant="default" size="sm" className="absolute top-2 left-2">{listing.categoryLabel}</Badge>
      </div>
      <CardContent className="p-4">
        <p className="text-lg font-bold text-teal-600">${listing.price.toLocaleString()}</p>
        <h3 className="font-bold truncate">{listing.title}</h3>
        <div className="flex items-center gap-1 text-sm text-neutral-500 mt-1">
          <MapPin size={12} />{listing.location}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Avatar src={listing.seller.avatar} fallback={listing.seller.name} size="sm" />
            <span className="text-xs">{listing.seller.name}</span>
          </div>
          <Button variant="ghost" size="sm"><MessageCircle size={16} /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

const LISTINGS = [
  { id: 1, title: "iPhone 15 Pro Max 256GB", price: 950, category: "elektronik", categoryLabel: "Elektronik", location: "New York, NY", description: "Kutusunda, garantili, çok temiz kullanılmış iPhone 15 Pro Max.", image: "/marketplace/iphone.jpg", seller: { name: "Ahmet Y.", avatar: "/avatars/ahmet.jpg" }},
  { id: 2, title: "2020 Toyota Camry", price: 22500, category: "araba", categoryLabel: "Araba", location: "New Jersey", description: "45K mil, tek sahibinden, servis bakımları yapılmış.", image: "/marketplace/car.jpg", seller: { name: "Mehmet Ş.", avatar: "/avatars/mehmet.jpg" }},
  { id: 3, title: "IKEA Koltuk Takımı", price: 350, category: "mobilya", categoryLabel: "Mobilya", location: "Brooklyn, NY", description: "3+2 koltuk takımı, taşınma nedeniyle satılık.", image: "/marketplace/sofa.jpg", seller: { name: "Zeynep K.", avatar: "/avatars/zeynep.jpg" }},
  { id: 4, title: "Nike Air Max 90", price: 85, category: "giyim", categoryLabel: "Giyim", location: "Los Angeles, CA", description: "Size 42, 2 kez giyilmiş, kutusunda.", image: "/marketplace/shoes.jpg", seller: { name: "Can Ö.", avatar: "/avatars/can.jpg" }},
  { id: 5, title: "Ev Temizliği Hizmeti", price: 120, category: "hizmet", categoryLabel: "Hizmet", location: "Chicago, IL", description: "Profesyonel ev temizliği. Haftalık/aylık anlaşma yapılır.", image: "/marketplace/cleaning.jpg", seller: { name: "Ayşe K.", avatar: "/avatars/ayse.jpg" }},
  { id: 6, title: "MacBook Pro 2023 M3", price: 1800, category: "elektronik", categoryLabel: "Elektronik", location: "San Francisco, CA", description: "14 inch, 16GB RAM, 512GB SSD, kutusunda.", image: "/marketplace/macbook.jpg", seller: { name: "Elif D.", avatar: "/avatars/elif.jpg" }},
  { id: 7, title: "Nakliye Hizmeti", price: 200, category: "hizmet", categoryLabel: "Hizmet", location: "New York, NY", description: "Ev/ofis taşıma, eşya nakliyesi. Güvenilir ve uygun fiyat.", image: "/marketplace/moving.jpg", seller: { name: "Murat A.", avatar: "/avatars/murat.jpg" }},
  { id: 8, title: "Vintage Masa Lambası", price: 45, category: "diger", categoryLabel: "Diğer", location: "Boston, MA", description: "Antika görünümlü dekoratif masa lambası.", image: "/marketplace/lamp.jpg", seller: { name: "Selin Y.", avatar: "/avatars/selin.jpg" }},
];
