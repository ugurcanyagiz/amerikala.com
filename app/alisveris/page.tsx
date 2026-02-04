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
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import {
  ShoppingBag,
  Search,
  MapPin,
  DollarSign,
  Heart,
  Grid,
  List,
  Plus,
  Package,
  MessageCircle,
  Loader2,
  X,
  Phone,
  Mail,
  ExternalLink,
  Tag,
  Clock,
  AlertCircle
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
  const [showCreateModal, setShowCreateModal] = useState(false);

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

      // Get unique sellers count
      const uniqueSellers = new Set(data?.map(l => l.user_id) || []);
      setStats({
        total: count || 0,
        sellers: uniqueSellers.size
      });
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
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-16 lg:py-20 bg-[var(--color-surface-sunken)]">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                <p className="text-sm font-medium text-[var(--color-primary)] tracking-wide uppercase mb-4">
                  Alım-Satım Platformu
                </p>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--color-ink)] leading-[1.1] mb-6">
                  Alışveriş
                </h1>
                <p className="text-lg text-[var(--color-ink-secondary)] leading-relaxed mb-8">
                  Amerika'daki Türk topluluğundan güvenilir alım-satım.
                  İkinci el, sıfır ürünler ve hizmetler.
                </p>

                <Button
                  variant="primary"
                  size="lg"
                  className="gap-2"
                  onClick={() => user ? setShowCreateModal(true) : window.location.href = '/login'}
                >
                  <Plus size={20} />
                  İlan Ver
                </Button>

                {/* Stats */}
                <div className="flex items-center justify-center gap-12 pt-8 mt-8 border-t border-[var(--color-border-light)]">
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-[var(--color-ink)]">{stats.total}</div>
                    <div className="text-sm text-[var(--color-ink-secondary)] mt-1">Aktif İlan</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-[var(--color-ink)]">{stats.sellers}</div>
                    <div className="text-sm text-[var(--color-ink-secondary)] mt-1">Satıcı</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Category Pills */}
          <section className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
            <div className="flex flex-wrap justify-center gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.value
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-border-light)] border border-[var(--color-border)]"
                  }`}
                >
                  <span className="mr-2">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </section>

          {/* Filters */}
          <section className="sticky top-[72px] z-40 bg-[var(--color-surface)] border-b border-[var(--color-border-light)]">
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-4">
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
                  options={STATE_OPTIONS}
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                />

                <Select
                  options={CONDITION_OPTIONS}
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                />

                <div className="flex items-center gap-1 bg-[var(--color-surface-raised)] rounded-lg p-1 border border-[var(--color-border-light)]">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "grid"
                        ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-ink)]"
                        : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "list"
                        ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-ink)]"
                        : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Listings */}
          <section className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--color-ink)]">
                {selectedCategory === "all"
                  ? "Tüm İlanlar"
                  : MARKETPLACE_CATEGORY_LABELS[selectedCategory]}
              </h2>
              <span className="text-sm text-[var(--color-ink-secondary)]">
                {filteredListings.length} ilan
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
              </div>
            ) : filteredListings.length === 0 ? (
              <Card variant="default">
                <CardContent className="p-12 text-center">
                  <ShoppingBag className="h-12 w-12 text-[var(--color-ink-faint)] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[var(--color-ink)] mb-2">
                    Henüz ilan yok
                  </h3>
                  <p className="text-[var(--color-ink-secondary)] mb-6">
                    Bu kategoride henüz ilan bulunmuyor. İlk ilan veren siz olun!
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => user ? setShowCreateModal(true) : window.location.href = '/login'}
                    className="gap-2"
                  >
                    <Plus size={18} />
                    İlan Ver
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={
                viewMode === "grid"
                  ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }>
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} viewMode={viewMode} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Create Modal */}
      <CreateListingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchListings();
        }}
        userId={user?.id}
      />
    </div>
  );
}

function ListingCard({ listing, viewMode }: { listing: MarketplaceListing; viewMode: ViewMode }) {
  const [liked, setLiked] = useState(false);
  const categoryEmoji = MARKETPLACE_CATEGORY_ICONS[listing.category] || "📦";
  const conditionLabel = MARKETPLACE_CONDITION_LABELS[listing.condition] || listing.condition;

  if (viewMode === "list") {
    return (
      <Card variant="elevated" className="hover:shadow-[var(--shadow-md)] transition-shadow">
        <CardContent className="p-5">
          <div className="flex gap-5">
            <div className="w-36 h-36 flex-shrink-0 rounded-xl overflow-hidden bg-[var(--color-surface-sunken)] flex items-center justify-center">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">{categoryEmoji}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xl font-semibold text-[var(--color-primary)]">
                    ${listing.price.toLocaleString()}
                  </p>
                  <h3 className="font-semibold text-[var(--color-ink)] truncate mt-1">
                    {listing.title}
                  </h3>
                </div>
                <button
                  onClick={() => setLiked(!liked)}
                  className="p-2 rounded-full hover:bg-[var(--color-surface-sunken)] transition-colors"
                >
                  <Heart
                    size={20}
                    className={liked ? "fill-red-500 text-red-500" : "text-[var(--color-ink-secondary)]"}
                  />
                </button>
              </div>
              <div className="flex items-center gap-1 text-sm text-[var(--color-ink-secondary)] mt-2">
                <MapPin size={14} />
                {listing.city}, {US_STATES_MAP[listing.state] || listing.state}
              </div>
              <p className="text-sm text-[var(--color-ink-secondary)] mt-2 line-clamp-2">
                {listing.description}
              </p>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" size="sm">{conditionLabel}</Badge>
                  <Badge variant="outline" size="sm">
                    {MARKETPLACE_CATEGORY_LABELS[listing.category]}
                  </Badge>
                </div>
                {listing.contact_phone && (
                  <a href={`tel:${listing.contact_phone}`}>
                    <Button variant="primary" size="sm" className="gap-1">
                      <Phone size={14} />
                      Ara
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="hover:shadow-[var(--shadow-md)] transition-shadow group overflow-hidden">
      <div className="relative h-44 overflow-hidden bg-[var(--color-surface-sunken)] flex items-center justify-center">
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-5xl">{categoryEmoji}</span>
        )}
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 dark:bg-neutral-800/90 flex items-center justify-center shadow-sm"
        >
          <Heart
            size={16}
            className={liked ? "fill-red-500 text-red-500" : "text-[var(--color-ink-secondary)]"}
          />
        </button>
        <Badge
          variant="default"
          size="sm"
          className="absolute top-3 left-3 bg-white/90 dark:bg-neutral-800/90 text-[var(--color-ink)]"
        >
          {conditionLabel}
        </Badge>
      </div>
      <CardContent className="p-5">
        <p className="text-lg font-semibold text-[var(--color-primary)]">
          ${listing.price.toLocaleString()}
        </p>
        <h3 className="font-semibold text-[var(--color-ink)] truncate mt-1">
          {listing.title}
        </h3>
        <div className="flex items-center gap-1 text-sm text-[var(--color-ink-secondary)] mt-2">
          <MapPin size={12} />
          {listing.city}, {US_STATES_MAP[listing.state] || listing.state}
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border-light)]">
          <Badge variant="outline" size="sm">
            {MARKETPLACE_CATEGORY_LABELS[listing.category]}
          </Badge>
          {listing.contact_phone ? (
            <a href={`tel:${listing.contact_phone}`}>
              <Button variant="ghost" size="sm">
                <Phone size={16} />
              </Button>
            </a>
          ) : listing.contact_email ? (
            <a href={`mailto:${listing.contact_email}`}>
              <Button variant="ghost" size="sm">
                <Mail size={16} />
              </Button>
            </a>
          ) : (
            <Button variant="ghost" size="sm">
              <MessageCircle size={16} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateListingModal({
  isOpen,
  onClose,
  onSuccess,
  userId
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "diger" as MarketplaceCategory,
    condition: "good" as MarketplaceCondition,
    price: "",
    city: "",
    state: "",
    contact_email: "",
    contact_phone: "",
    is_negotiable: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const { error: submitError } = await supabase.from("marketplace_listings").insert({
        user_id: userId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        price: parseFloat(formData.price),
        city: formData.city,
        state: formData.state,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        is_negotiable: formData.is_negotiable,
        status: "pending",
        images: []
      });

      if (submitError) throw submitError;

      onSuccess();
      setFormData({
        title: "",
        description: "",
        category: "diger",
        condition: "good",
        price: "",
        city: "",
        state: "",
        contact_email: "",
        contact_phone: "",
        is_negotiable: false
      });
    } catch (err) {
      console.error("Error creating listing:", err);
      setError("İlan oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Yeni İlan Ver">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <Input
          label="İlan Başlığı"
          placeholder="Örn: iPhone 15 Pro Max 256GB"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-ink-secondary)] mb-1.5">
              Kategori
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as MarketplaceCategory })}
              className="w-full h-11 px-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none"
              required
            >
              {CATEGORIES.slice(1).map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-ink-secondary)] mb-1.5">
              Durum
            </label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value as MarketplaceCondition })}
              className="w-full h-11 px-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none"
              required
            >
              <option value="new">Sıfır</option>
              <option value="like_new">Sıfır Gibi</option>
              <option value="good">İyi</option>
              <option value="fair">Orta</option>
              <option value="for_parts">Parça İçin</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fiyat ($)"
            type="number"
            placeholder="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_negotiable}
                onChange={(e) => setFormData({ ...formData, is_negotiable: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-ink-secondary)]">Pazarlık Payı Var</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-ink-secondary)] mb-1.5">
            Açıklama
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Ürün veya hizmet hakkında detaylı bilgi..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Şehir"
            placeholder="Örn: New York"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-[var(--color-ink-secondary)] mb-1.5">
              Eyalet
            </label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full h-11 px-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none"
              required
            >
              <option value="">Seçiniz</option>
              {Object.entries(US_STATES_MAP).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-[var(--color-border-light)] pt-5">
          <h4 className="text-sm font-medium text-[var(--color-ink)] mb-4">
            İletişim Bilgileri
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="E-posta (opsiyonel)"
              type="email"
              placeholder="email@example.com"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            />
            <Input
              label="Telefon (opsiyonel)"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            İptal
          </Button>
          <Button type="submit" variant="primary" disabled={loading} className="flex-1 gap-2">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Plus size={18} />
                İlan Ver
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-[var(--color-ink-secondary)] text-center">
          İlanınız onaylandıktan sonra yayınlanacaktır.
        </p>
      </form>
    </Modal>
  );
}
