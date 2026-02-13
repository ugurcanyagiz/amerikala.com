"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import {
  MarketplaceListing,
  MarketplaceCategory,
  MarketplaceCondition,
  MARKETPLACE_CATEGORY_LABELS,
  MARKETPLACE_CATEGORY_ICONS,
  MARKETPLACE_CONDITION_LABELS,
  US_STATES_MAP
} from "@/lib/types";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import {
  ShoppingBag,
  Search,
  MapPin,
  Heart,
  Grid,
  List,
  Plus,
  Package,
  MessageCircle,
  Loader2,
  Phone,
  Mail,
} from "lucide-react";

type ViewMode = "grid" | "list";

const CATEGORIES: { value: MarketplaceCategory | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "Tümü", emoji: "🛒" },
  { value: "araba", label: "Araba", emoji: "🚗" },
  { value: "elektronik", label: "Elektronik", emoji: "💻" },
  { value: "giyim", label: "Giyim", emoji: "👕" },
  { value: "mobilya", label: "Mobilya", emoji: "🛋️" },
  { value: "hizmet", label: "Hizmet", emoji: "🔧" },
  { value: "diger", label: "Diğer", emoji: "📦" },
];

const STATE_OPTIONS = [
  { value: "all", label: "Tüm Eyaletler" },
  ...Object.entries(US_STATES_MAP).map(([code, name]) => ({
    value: code,
    label: name
  }))
];

const CONDITION_OPTIONS = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "new", label: "Sıfır" },
  { value: "like_new", label: "Sıfır Gibi" },
  { value: "good", label: "İyi" },
  { value: "fair", label: "Orta" },
  { value: "for_parts", label: "Parça İçin" },
];

export default function AlisverisPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory | "all">("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [stats, setStats] = useState({ total: 0, sellers: 0 });

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, selectedState, selectedCondition]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("marketplace_listings")
        .select("*, user:user_id (id, username, full_name, avatar_url)", { count: "exact" })
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }
      if (selectedState !== "all") {
        query = query.eq("state", selectedState);
      }
      if (selectedCondition !== "all") {
        query = query.eq("condition", selectedCondition);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      setListings(data || []);
      const uniqueSellers = new Set(data?.map(l => l.user_id) || []);
      setStats({ total: count || 0, sellers: uniqueSellers.size });
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      listing.title.toLowerCase().includes(query) ||
      listing.description?.toLowerCase().includes(query) ||
      listing.city.toLowerCase().includes(query)
    );
  });

  return (
    <div className="ak-page pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="relative py-12 lg:py-16 bg-gradient-to-b from-orange-50 to-transparent dark:from-orange-950/20">
        <div className="ak-shell">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-sm font-medium mb-4">
              <ShoppingBag size={16} />
              Alım-Satım Platformu
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Alışveriş
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Amerika'daki Türk topluluğundan güvenilir alım-satım.
            </p>

            <Link href={user ? "/alisveris/ilan-ver" : "/login?redirect=/alisveris/ilan-ver"}>
              <Button variant="primary" size="lg" className="gap-2 bg-orange-500 hover:bg-orange-600">
                <Plus size={20} />
                İlan Ver
              </Button>
            </Link>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-neutral-500">Aktif İlan</div>
              </div>
              <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.sellers}</div>
                <div className="text-sm text-neutral-500">Satıcı</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="ak-shell py-6">
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.value
                  ? "bg-orange-500 text-white"
                  : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800"
              }`}
            >
              <span className="mr-1.5">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="ak-shell py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Ürün veya hizmet ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
              />
            </div>

            <Select
              options={STATE_OPTIONS}
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            />

            <Select
              options={CONDITION_OPTIONS}
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
            />

            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-neutral-700 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-neutral-700 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="ak-shell py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {selectedCategory === "all" ? "Tüm İlanlar" : MARKETPLACE_CATEGORY_LABELS[selectedCategory]}
          </h2>
          <span className="text-sm text-neutral-500">{filteredListings.length} ilan</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : filteredListings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz ilan yok</h3>
              <p className="text-neutral-500 mb-6">Bu kategoride henüz ilan bulunmuyor.</p>
              <Link href={user ? "/alisveris/ilan-ver" : "/login?redirect=/alisveris/ilan-ver"}>
                <Button variant="primary" className="gap-2 bg-orange-500 hover:bg-orange-600">
                  <Plus size={18} />
                  İlan Ver
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} viewMode={viewMode} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ListingCard({ listing, viewMode }: { listing: MarketplaceListing; viewMode: ViewMode }) {
  const [liked, setLiked] = useState(false);
  const categoryEmoji = MARKETPLACE_CATEGORY_ICONS[listing.category] || "📦";
  const conditionLabel = MARKETPLACE_CONDITION_LABELS[listing.condition] || listing.condition;

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              {listing.images && listing.images.length > 0 ? (
                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">{categoryEmoji}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-bold text-orange-500">${listing.price.toLocaleString()}</p>
                  <h3 className="font-semibold truncate mt-1">{listing.title}</h3>
                </div>
                <button onClick={() => setLiked(!liked)} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <Heart size={20} className={liked ? "fill-red-500 text-red-500" : "text-neutral-400"} />
                </button>
              </div>
              <div className="flex items-center gap-1 text-sm text-neutral-500 mt-2">
                <MapPin size={14} />
                {listing.city}, {US_STATES_MAP[listing.state] || listing.state}
              </div>
              <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{listing.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" size="sm">{conditionLabel}</Badge>
                <Badge variant="outline" size="sm">{MARKETPLACE_CATEGORY_LABELS[listing.category]}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/alisveris/ilan/${listing.id}`}>
      <Card className="hover:shadow-lg transition-all group overflow-hidden cursor-pointer">
        <div className="relative h-44 overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          {listing.images && listing.images.length > 0 ? (
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <span className="text-5xl">{categoryEmoji}</span>
          )}
          <button
            onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 dark:bg-neutral-800/90 flex items-center justify-center shadow-sm"
          >
            <Heart size={16} className={liked ? "fill-red-500 text-red-500" : "text-neutral-500"} />
          </button>
          <Badge variant="default" size="sm" className="absolute top-3 left-3 bg-white/90 dark:bg-neutral-800/90">
            {conditionLabel}
          </Badge>
        </div>
        <CardContent className="p-4">
          <p className="text-lg font-bold text-orange-500">${listing.price.toLocaleString()}</p>
          <h3 className="font-semibold truncate mt-1">{listing.title}</h3>
          <div className="flex items-center gap-1 text-sm text-neutral-500 mt-2">
            <MapPin size={12} />
            {listing.city}, {US_STATES_MAP[listing.state] || listing.state}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <Badge variant="outline" size="sm">{MARKETPLACE_CATEGORY_LABELS[listing.category]}</Badge>
            {listing.contact_phone ? (
              <Phone size={16} className="text-neutral-400" />
            ) : (
              <MessageCircle size={16} className="text-neutral-400" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
