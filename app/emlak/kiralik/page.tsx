"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
  Listing,
  PropertyType,
  LISTING_TYPE_COLORS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_ICONS,
  US_STATES,
  US_STATES_MAP,
  AMENITIES_LIST
} from "@/lib/types";
import Sidebar from "@/app/components/Sidebar";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { 
  Plus, 
  MapPin,
  Bed,
  Bath,
  Square,
  DollarSign,
  ChevronRight,
  Loader2,
  Home,
  Search,
  SlidersHorizontal,
  Grid,
  List,
  Heart,
  Eye,
  ArrowLeft,
  X,
  Check
} from "lucide-react";

type ViewMode = "grid" | "list";

export default function KiralikPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // State
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>(searchParams.get("state") || "all");
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType | "all">("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [bedroomsMin, setBedroomsMin] = useState("");

  // Fetch listings
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
          .eq("listing_type", "rent")
          .order("created_at", { ascending: false });

        // Filters
        if (selectedState !== "all") {
          query = query.eq("state", selectedState);
        }
        if (selectedPropertyType !== "all") {
          query = query.eq("property_type", selectedPropertyType);
        }
        if (priceMin) {
          query = query.gte("price", parseInt(priceMin));
        }
        if (priceMax) {
          query = query.lte("price", parseInt(priceMax));
        }
        if (bedroomsMin) {
          query = query.gte("bedrooms", parseInt(bedroomsMin));
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching listings:", error);
        } else {
          setListings(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [selectedState, selectedPropertyType, priceMin, priceMax, bedroomsMin]);

  // Filter by search
  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    
    const query = searchQuery.toLowerCase();
    return listings.filter(listing => 
      listing.title.toLowerCase().includes(query) ||
      listing.description.toLowerCase().includes(query) ||
      listing.city.toLowerCase().includes(query) ||
      listing.address.toLowerCase().includes(query) ||
      (listing.neighborhood && listing.neighborhood.toLowerCase().includes(query))
    );
  }, [listings, searchQuery]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedState("all");
    setSelectedPropertyType("all");
    setPriceMin("");
    setPriceMax("");
    setBedroomsMin("");
  };

  const hasActiveFilters = selectedState !== "all" || selectedPropertyType !== "all" || priceMin || priceMax || bedroomsMin;

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                    <Home className="text-blue-500" />
                    Kiralık İlanlar
                  </h1>
                  <p className="text-neutral-500 text-sm">
                    {filteredListings.length} ilan bulundu
                  </p>
                </div>
              </div>
              
              <Link href="/emlak/ilan-ver?type=rent">
                <Button variant="primary" className="gap-2">
                  <Plus size={18} />
                  İlan Ver
                </Button>
              </Link>
            </div>

            {/* Search & Filters Bar */}
            <Card className="glass mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                    <input
                      type="text"
                      placeholder="Adres, şehir veya mahalle ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* State Filter */}
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
                  >
                    <option value="all">Tüm Eyaletler</option>
                    {US_STATES.map(state => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>

                  {/* Filters Toggle */}
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                  >
                    <SlidersHorizontal size={18} />
                    Filtreler
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </Button>

                  {/* View Toggle */}
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === "grid" 
                          ? "bg-white dark:bg-neutral-700 shadow-sm" 
                          : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === "list" 
                          ? "bg-white dark:bg-neutral-700 shadow-sm" 
                          : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      <List size={20} />
                    </button>
                  </div>
                </div>

                {/* Extended Filters */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Property Type */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Emlak Tipi</label>
                        <select
                          value={selectedPropertyType}
                          onChange={(e) => setSelectedPropertyType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="all">Tümü</option>
                          {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {PROPERTY_TYPE_ICONS[value as PropertyType]} {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Price Range */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Fiyat Aralığı</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={priceMin}
                            onChange={(e) => setPriceMin(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <span className="text-neutral-400">-</span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      </div>

                      {/* Bedrooms */}
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Min. Yatak Odası</label>
                        <select
                          value={bedroomsMin}
                          onChange={(e) => setBedroomsMin(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Farketmez</option>
                          <option value="0">Stüdyo</option>
                          <option value="1">1+</option>
                          <option value="2">2+</option>
                          <option value="3">3+</option>
                          <option value="4">4+</option>
                        </select>
                      </div>

                      {/* Clear Filters */}
                      <div className="flex items-end">
                        {hasActiveFilters && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearFilters}
                            className="text-red-500 hover:text-red-600"
                          >
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
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : filteredListings.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Home className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">İlan bulunamadı</h3>
                  <p className="text-neutral-500 mb-6">
                    {hasActiveFilters 
                      ? "Arama kriterlerinize uygun ilan bulunamadı. Filtreleri değiştirmeyi deneyin."
                      : "Henüz kiralık ilan eklenmemiş."}
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
                  <ListingGridCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredListings.map(listing => (
                  <ListingListCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Grid Card Component
function ListingGridCard({ listing }: { listing: Listing }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;

  return (
    <Link href={`/emlak/ilan/${listing.id}`}>
      <Card className="glass overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group h-full">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800">
          {firstImage ? (
            <img 
              src={firstImage} 
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Home className="w-12 h-12 text-neutral-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Property Type Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="info" size="sm">
              {PROPERTY_TYPE_ICONS[listing.property_type]} {PROPERTY_TYPE_LABELS[listing.property_type]}
            </Badge>
          </div>

          {/* Price */}
          <div className="absolute bottom-3 left-3">
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              {formatPrice(listing.price)}
              <span className="text-sm font-normal">/ay</span>
            </span>
          </div>

          {/* Favorite */}
          <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-lg">
            <Heart size={16} className="text-neutral-600 hover:text-red-500" />
          </button>

          {/* Image Count */}
          {listing.images && listing.images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
              +{listing.images.length - 1} foto
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-blue-500 transition-colors">
            {listing.title}
          </h3>

          <div className="flex items-center gap-1 text-sm text-neutral-500 mb-3">
            <MapPin size={14} />
            <span className="truncate">{listing.city}, {US_STATES_MAP[listing.state] || listing.state}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-1">
              <Bed size={16} />
              <span>{listing.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath size={16} />
              <span>{listing.bathrooms}</span>
            </div>
            {listing.sqft && (
              <div className="flex items-center gap-1">
                <Square size={16} />
                <span>{listing.sqft}</span>
              </div>
            )}
          </div>

          {/* Utilities Badge */}
          {listing.utilities_included && (
            <div className="mt-3">
              <Badge variant="success" size="sm" className="gap-1">
                <Check size={12} />
                Faturalar Dahil
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// List Card Component
function ListingListCard({ listing }: { listing: Listing }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;

  return (
    <Link href={`/emlak/ilan/${listing.id}`}>
      <Card className="glass overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-0">
          <div className="flex">
            {/* Image */}
            <div className="relative w-48 sm:w-64 flex-shrink-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800">
              {firstImage ? (
                <img 
                  src={firstImage} 
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Home className="w-10 h-10 text-neutral-400" />
                </div>
              )}
              
              {/* Image Count */}
              {listing.images && listing.images.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  +{listing.images.length - 1}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="info" size="sm">
                      {PROPERTY_TYPE_LABELS[listing.property_type]}
                    </Badge>
                    {listing.utilities_included && (
                      <Badge variant="success" size="sm">Faturalar Dahil</Badge>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg group-hover:text-blue-500 transition-colors line-clamp-1">
                    {listing.title}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-sm text-neutral-500 mt-1">
                    <MapPin size={14} />
                    <span>{listing.address}, {listing.city}, {listing.state}</span>
                  </div>

                  <p className="text-sm text-neutral-500 mt-2 line-clamp-2">
                    {listing.description}
                  </p>
                </div>

                {/* Price & Actions */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPrice(listing.price)}
                    <span className="text-sm font-normal text-neutral-500">/ay</span>
                  </div>
                  {listing.deposit && (
                    <div className="text-sm text-neutral-500">
                      Depozito: {formatPrice(listing.deposit)}
                    </div>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1">
                    <Bed size={16} />
                    <span>{listing.bedrooms} yatak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath size={16} />
                    <span>{listing.bathrooms} banyo</span>
                  </div>
                  {listing.sqft && (
                    <div className="flex items-center gap-1">
                      <Square size={16} />
                      <span>{listing.sqft} sqft</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <Eye size={12} />
                    <span>{listing.view_count}</span>
                  </div>
                  <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <Heart size={18} className="text-neutral-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
