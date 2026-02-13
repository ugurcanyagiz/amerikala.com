"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
  Listing,
  RoommateType,
  ROOMMATE_TYPE_LABELS,
  ROOMMATE_TYPE_ICONS,
  PROPERTY_TYPE_LABELS,
  GENDER_PREFERENCE_OPTIONS,
  US_STATES,
  US_STATES_MAP
} from "@/lib/types";
import Sidebar from "@/app/components/Sidebar";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Avatar } from "@/app/components/ui/Avatar";
import { 
  Plus, 
  MapPin,
  Bed,
  DollarSign,
  Loader2,
  Users,
  Search,
  SlidersHorizontal,
  Grid,
  List,
  Heart,
  Eye,
  ArrowLeft,
  X,
  Calendar,
  User,
  Home as HomeIcon
} from "lucide-react";

type ViewMode = "grid" | "list";
type TabType = "all" | "looking_for_room" | "looking_for_roommate";

export default function EvArkadasiPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>(searchParams.get("state") || "all");
  const [priceMax, setPriceMax] = useState("");
  const [genderPref, setGenderPref] = useState("all");

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("listings")
          .select(`
            *,
            user:user_id (id, username, full_name, avatar_url)
          `)
          .eq("status", "approved")
          .eq("listing_type", "roommate")
          .order("created_at", { ascending: false });

        if (activeTab !== "all") {
          query = query.eq("roommate_type", activeTab);
        }
        if (selectedState !== "all") {
          query = query.eq("state", selectedState);
        }
        if (priceMax) {
          query = query.lte("price", parseInt(priceMax));
        }
        if (genderPref !== "all") {
          query = query.eq("preferred_gender", genderPref);
        }

        const { data, error } = await query;
        if (error) console.error("Error fetching listings:", error);
        else setListings(data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [activeTab, selectedState, priceMax, genderPref]);

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const query = searchQuery.toLowerCase();
    return listings.filter(listing => 
      listing.title.toLowerCase().includes(query) ||
      listing.description.toLowerCase().includes(query) ||
      listing.city.toLowerCase().includes(query)
    );
  }, [listings, searchQuery]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedState("all");
    setPriceMax("");
    setGenderPref("all");
  };

  const hasActiveFilters = selectedState !== "all" || priceMax || genderPref !== "all";

  // Stats
  const lookingForRoomCount = listings.filter(l => l.roommate_type === "looking_for_room").length;
  const lookingForRoommateCount = listings.filter(l => l.roommate_type === "looking_for_roommate").length;

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="ak-shell ak-shell-wide py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Link href="/emlak">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft size={20} />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="text-purple-500" />
                    Ev Arkadaşı İlanları
                  </h1>
                  <p className="text-neutral-500 text-sm">
                    {filteredListings.length} ilan bulundu
                  </p>
                </div>
              </div>
              
              <Link href="/emlak/ilan-ver?type=roommate">
                <Button variant="primary" className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <Plus size={18} />
                  İlan Ver
                </Button>
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === "all"
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                    : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
              >
                <Users size={18} />
                Tüm İlanlar
                <Badge variant={activeTab === "all" ? "default" : "default"} size="sm" className={activeTab === "all" ? "bg-white/20 text-white" : ""}>
                  {listings.length}
                </Badge>
              </button>

              <button
                onClick={() => setActiveTab("looking_for_room")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === "looking_for_room"
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                    : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
              >
                🔍 Ev Arıyorum
                <Badge variant={activeTab === "looking_for_room" ? "default" : "info"} size="sm" className={activeTab === "looking_for_room" ? "bg-white/20 text-white" : ""}>
                  {lookingForRoomCount}
                </Badge>
              </button>

              <button
                onClick={() => setActiveTab("looking_for_roommate")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === "looking_for_roommate"
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                    : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
              >
                🙋 Ev Arkadaşı Arıyorum
                <Badge variant={activeTab === "looking_for_roommate" ? "default" : "success"} size="sm" className={activeTab === "looking_for_roommate" ? "bg-white/20 text-white" : ""}>
                  {lookingForRoommateCount}
                </Badge>
              </button>
            </div>

            {/* Info Cards */}
            {activeTab === "all" && (
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <Card className="glass border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-xl">🔍</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Ev Arıyorum</h3>
                        <p className="text-sm text-neutral-500">Ev arayan kişilerin ilanları</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="text-xl">🙋</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Ev Arkadaşı Arıyorum</h3>
                        <p className="text-sm text-neutral-500">Evine arkadaş arayanların ilanları</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Search & Filters */}
            <Card className="glass mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                    <input
                      type="text"
                      placeholder="Şehir, mahalle veya açıklama ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[160px]"
                  >
                    <option value="all">Tüm Eyaletler</option>
                    {US_STATES.map(state => (
                      <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                  </select>

                  <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                    <SlidersHorizontal size={18} />
                    Filtreler
                    {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                  </Button>

                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-neutral-700 shadow-sm" : "hover:bg-neutral-200 dark:hover:bg-neutral-700"}`}
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-neutral-700 shadow-sm" : "hover:bg-neutral-200 dark:hover:bg-neutral-700"}`}
                    >
                      <List size={20} />
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Max Bütçe</label>
                        <input
                          type="number"
                          placeholder="örn: 1500"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5">Cinsiyet Tercihi</label>
                        <select
                          value={genderPref}
                          onChange={(e) => setGenderPref(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        >
                          <option value="all">Tümü</option>
                          {GENDER_PREFERENCE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        {hasActiveFilters && (
                          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:text-red-600">
                            <X size={16} className="mr-1" />
                            Filtreleri Temizle
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : filteredListings.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">İlan bulunamadı</h3>
                  <p className="text-neutral-500 mb-6">
                    {hasActiveFilters ? "Arama kriterlerinize uygun ilan bulunamadı." : "Henüz ev arkadaşı ilanı eklenmemiş."}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="gap-2">
                      <X size={16} />
                      Filtreleri Temizle
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map(listing => (
                  <RoommateCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredListings.map(listing => (
                  <RoommateListCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function RoommateCard({ listing }: { listing: Listing }) {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
  const user = listing.user as any;
  const isLookingForRoom = listing.roommate_type === "looking_for_room";

  return (
    <Link href={`/emlak/ilan/${listing.id}`}>
      <Card className="glass overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group h-full">
        <CardContent className="p-5">
          {/* Header with Type Badge */}
          <div className="flex items-center justify-between mb-4">
            <Badge 
              variant={isLookingForRoom ? "info" : "success"} 
              size="lg"
              className="gap-1"
            >
              {ROOMMATE_TYPE_ICONS[listing.roommate_type!]} 
              {ROOMMATE_TYPE_LABELS[listing.roommate_type!]}
            </Badge>
            <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Heart size={18} className="text-neutral-400 hover:text-red-500" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar 
              src={user?.avatar_url} 
              fallback={user?.full_name || user?.username || "U"} 
              size="lg"
            />
            <div>
              <h3 className="font-bold group-hover:text-purple-500 transition-colors">
                {user?.full_name || user?.username || "Anonim"}
              </h3>
              <p className="text-sm text-neutral-500">@{user?.username}</p>
            </div>
          </div>

          {/* Title */}
          <h4 className="font-semibold mb-2 line-clamp-2">{listing.title}</h4>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-neutral-500 mb-3">
            <MapPin size={14} />
            <span>{listing.city}, {US_STATES_MAP[listing.state] || listing.state}</span>
          </div>

          {/* Budget/Price */}
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-green-500" />
            <span className="text-xl font-bold text-green-600">
              {formatPrice(listing.price)}
              <span className="text-sm font-normal text-neutral-500">/ay</span>
            </span>
          </div>

          {/* Details */}
          <div className="flex flex-wrap gap-2 text-sm">
            {listing.preferred_gender && listing.preferred_gender !== "any" && (
              <Badge variant="default" size="sm" className="gap-1">
                <User size={12} />
                {listing.preferred_gender === "male" ? "Erkek" : "Kadın"} tercih
              </Badge>
            )}
            {listing.move_in_date && (
              <Badge variant="default" size="sm" className="gap-1">
                <Calendar size={12} />
                {new Date(listing.move_in_date).toLocaleDateString("tr-TR", { month: "short", day: "numeric" })}
              </Badge>
            )}
            {!isLookingForRoom && listing.current_occupants > 0 && (
              <Badge variant="default" size="sm" className="gap-1">
                <Users size={12} />
                {listing.current_occupants} kişi mevcut
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RoommateListCard({ listing }: { listing: Listing }) {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(price);
  const user = listing.user as any;
  const isLookingForRoom = listing.roommate_type === "looking_for_room";

  return (
    <Link href={`/emlak/ilan/${listing.id}`}>
      <Card className="glass overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar 
                src={user?.avatar_url} 
                fallback={user?.full_name || user?.username || "U"} 
                size="xl"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={isLookingForRoom ? "info" : "success"} size="sm">
                      {ROOMMATE_TYPE_ICONS[listing.roommate_type!]} {ROOMMATE_TYPE_LABELS[listing.roommate_type!]}
                    </Badge>
                  </div>
                  
                  <h3 className="font-bold text-lg group-hover:text-purple-500 transition-colors line-clamp-1">
                    {listing.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                    <span className="font-medium">{user?.full_name || user?.username}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {listing.city}, {listing.state}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{listing.description}</p>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">
                    {formatPrice(listing.price)}
                    <span className="text-sm font-normal text-neutral-500">/ay</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-wrap gap-2">
                  {listing.preferred_gender && listing.preferred_gender !== "any" && (
                    <Badge variant="default" size="sm">{listing.preferred_gender === "male" ? "Erkek" : "Kadın"} tercih</Badge>
                  )}
                  {listing.move_in_date && (
                    <Badge variant="default" size="sm">
                      {new Date(listing.move_in_date).toLocaleDateString("tr-TR", { month: "long", day: "numeric" })}
                    </Badge>
                  )}
                </div>
                <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <Heart size={18} className="text-neutral-400 hover:text-red-500" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
