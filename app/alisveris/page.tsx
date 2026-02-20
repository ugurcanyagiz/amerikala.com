"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import {
  MarketplaceListing,
  MarketplaceCategory,
  MARKETPLACE_CATEGORY_LABELS,
  MARKETPLACE_CONDITION_LABELS,
  US_STATES_MAP
} from "@/lib/types";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import {
  Search,
  MapPin,
  Plus,
  Package,
  Loader2,
  Filter,
  X,
} from "lucide-react";

const CATEGORIES: { value: MarketplaceCategory | "all"; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "araba", label: "Araba" },
  { value: "elektronik", label: "Elektronik" },
  { value: "giyim", label: "Giyim" },
  { value: "mobilya", label: "Mobilya" },
  { value: "hizmet", label: "Hizmet" },
  { value: "diger", label: "Diğer" },
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

const SORT_OPTIONS = [
  { value: "newest", label: "En Yeni" },
  { value: "price_asc", label: "Fiyat: Düşükten Yükseğe" },
  { value: "price_desc", label: "Fiyat: Yüksekten Düşüğe" },
];

const CATEGORY_OPTIONS = CATEGORIES.map((cat) => ({ value: cat.value, label: cat.label }));
const PAGE_SIZE = 24;

type FilterState = {
  q: string;
  category: MarketplaceCategory | "all";
  state: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  sort: string;
};

const dedupeById = (items: MarketplaceListing[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export default function AlisverisPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPageState] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory | "all">((searchParams.get("category") as MarketplaceCategory) || "all");
  const [selectedState, setSelectedState] = useState(searchParams.get("state") || "all");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get("condition") || "all");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileDraft, setMobileDraft] = useState<FilterState | null>(null);
  const setPageNumber = useCallback((nextPage: number | string) => {
    const parsed = typeof nextPage === "string" ? Number.parseInt(nextPage, 10) : nextPage;
    setPageState(Number.isNaN(parsed) || parsed < 1 ? 1 : parsed);
  }, []);

  const isRequestInFlight = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setDebouncedSearchQuery(searchParams.get("q") || "");
    setSelectedCategory((searchParams.get("category") as MarketplaceCategory) || "all");
    setSelectedState(searchParams.get("state") || "all");
    setSelectedCity(searchParams.get("city") || "");
    setSelectedCondition(searchParams.get("condition") || "all");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setSortBy(searchParams.get("sort") || "newest");
  }, [searchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const syncUrl = useCallback((next: {
    q?: string;
    category?: string;
    state?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string;
    sort?: string;
    page?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    const data = {
      q: next.q ?? debouncedSearchQuery,
      category: next.category ?? selectedCategory,
      state: next.state ?? selectedState,
      city: next.city ?? selectedCity,
      minPrice: next.minPrice ?? minPrice,
      maxPrice: next.maxPrice ?? maxPrice,
      condition: next.condition ?? selectedCondition,
      sort: next.sort ?? sortBy,
    };

    Object.entries(data).forEach(([key, value]) => {
      if (!value || value === "all" || (key === "sort" && value === "newest")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    const currentQuery = searchParams.toString();
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    pathname,
    router,
    searchParams,
    debouncedSearchQuery,
    selectedCategory,
    selectedState,
    selectedCity,
    minPrice,
    maxPrice,
    selectedCondition,
    sortBy,
  ]);

  useEffect(() => {
    syncUrl({ q: debouncedSearchQuery });
  }, [debouncedSearchQuery, syncUrl]);

  const buildFilterState = (): FilterState => ({
    q: searchQuery,
    category: selectedCategory,
    state: selectedState,
    city: selectedCity,
    minPrice,
    maxPrice,
    condition: selectedCondition,
    sort: sortBy,
  });

  const applyFilters = (next: FilterState, closeSheet = false) => {
    setSearchQuery(next.q);
    setSelectedCategory(next.category);
    setSelectedState(next.state);
    setSelectedCity(next.city);
    setMinPrice(next.minPrice);
    setMaxPrice(next.maxPrice);
    setSelectedCondition(next.condition);
    setSortBy(next.sort);
    syncUrl(next);

    if (closeSheet) {
      setIsMobileFiltersOpen(false);
      setMobileDraft(null);
    }
  };

  const resetFilters = (): FilterState => ({
    q: "",
    category: "all",
    state: "all",
    city: "",
    minPrice: "",
    maxPrice: "",
    condition: "all",
    sort: "newest",
  });

  const fetchListingsPage = useCallback(async (targetPage: number, replace: boolean) => {
    if (isRequestInFlight.current) return;
    isRequestInFlight.current = true;

    if (replace) {
      setLoading(true);
      setErrorMessage(null);
      setLoadMoreError(null);
    } else {
      setIsLoadingMore(true);
      setLoadMoreError(null);
    }

    try {
      let listingsQuery = supabase
        .from("marketplace_listings")
        .select("*, user:user_id (id, username, full_name, avatar_url)", { count: "exact" })
        .eq("status", "approved");

      const trimmedQuery = debouncedSearchQuery.trim();
      if (trimmedQuery) {
        const escapedQuery = trimmedQuery.replaceAll(",", " ");
        listingsQuery = listingsQuery.or(`title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`);
      }

      if (selectedCategory !== "all") listingsQuery = listingsQuery.eq("category", selectedCategory);
      if (selectedState !== "all") listingsQuery = listingsQuery.eq("state", selectedState);
      if (selectedCity.trim()) listingsQuery = listingsQuery.ilike("city", `%${selectedCity.trim()}%`);
      if (selectedCondition !== "all") listingsQuery = listingsQuery.eq("condition", selectedCondition);

      if (minPrice) {
        const parsedMin = Number(minPrice);
        if (!Number.isNaN(parsedMin)) listingsQuery = listingsQuery.gte("price", parsedMin);
      }

      if (maxPrice) {
        const parsedMax = Number(maxPrice);
        if (!Number.isNaN(parsedMax)) listingsQuery = listingsQuery.lte("price", parsedMax);
      }

      if (sortBy === "price_asc") {
        listingsQuery = listingsQuery.order("price", { ascending: true }).order("created_at", { ascending: false });
      } else if (sortBy === "price_desc") {
        listingsQuery = listingsQuery.order("price", { ascending: false }).order("created_at", { ascending: false });
      } else {
        listingsQuery = listingsQuery.order("created_at", { ascending: false });
      }

      const from = (targetPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: listingsData, count: listingsCount, error: listingsError } = await listingsQuery.range(from, to);
      if (listingsError) throw listingsError;

      const nextPageItems = listingsData || [];
      setTotalCount(listingsCount || 0);
      setPageNumber(targetPage);
      setHasMore((listingsCount || 0) > targetPage * PAGE_SIZE);

      setListings((prev) => {
        const merged = replace ? nextPageItems : [...prev, ...nextPageItems];
        return dedupeById(merged);
      });
    } catch (error) {
      console.error("Error fetching listings:", error);
      if (replace) {
        setListings([]);
        setTotalCount(0);
        setHasMore(false);
        setErrorMessage("İlanlar yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.");
      } else {
        setLoadMoreError("Daha fazla ilan yüklenemedi.");
      }
    } finally {
      if (replace) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
      }
      isRequestInFlight.current = false;
    }
  }, [
    debouncedSearchQuery,
    selectedCategory,
    selectedState,
    selectedCity,
    selectedCondition,
    minPrice,
    maxPrice,
    sortBy,
    setPageNumber,
  ]);

  useEffect(() => {
    setListings([]);
    setPageNumber(1);
    setHasMore(true);
    fetchListingsPage(1, true);
  }, [
    debouncedSearchQuery,
    selectedCategory,
    selectedState,
    selectedCity,
    selectedCondition,
    minPrice,
    maxPrice,
    sortBy,
    fetchListingsPage,
    setPageNumber,
  ]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || loading || isLoadingMore || !hasMore || !!errorMessage) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isRequestInFlight.current) {
        fetchListingsPage(page + 1, false);
      }
    }, { rootMargin: "200px 0px" });

    observer.observe(node);
    return () => observer.disconnect();
  }, [page, hasMore, loading, isLoadingMore, errorMessage, fetchListingsPage]);

  return (
    <div className="ak-page pb-20 md:pb-0">
      <section className="relative py-8 md:py-10 bg-gradient-to-b from-orange-50 to-transparent dark:from-orange-950/20">
        <div className="ak-shell">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Alışveriş</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                  Amerika&apos;daki Türk topluluğundan güvenilir alım-satım.
                </p>
              </div>
              <Link href={user ? "/alisveris/ilan-ver" : "/login?redirect=/alisveris/ilan-ver"}>
                <Button variant="primary" size="lg" className="gap-2 bg-orange-500 hover:bg-orange-600 w-full md:w-auto">
                  <Plus size={20} />
                  İlan Ver
                </Button>
              </Link>
            </div>

            <div className="hidden md:grid md:grid-cols-12 gap-3 mt-1">
              <div className="col-span-3">
                <Input
                  placeholder="Ara (q)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search size={18} />}
                />
              </div>
              <div className="col-span-2">
                <Select
                  options={STATE_OPTIONS}
                  value={selectedState}
                  onChange={(e) => applyFilters({ ...buildFilterState(), state: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Şehir"
                  value={selectedCity}
                  onChange={(e) => applyFilters({ ...buildFilterState(), city: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Select
                  options={CONDITION_OPTIONS}
                  value={selectedCondition}
                  onChange={(e) => applyFilters({ ...buildFilterState(), condition: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <Input
                  type="number"
                  placeholder="Min $"
                  value={minPrice}
                  onChange={(e) => applyFilters({ ...buildFilterState(), minPrice: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <Input
                  type="number"
                  placeholder="Max $"
                  value={maxPrice}
                  onChange={(e) => applyFilters({ ...buildFilterState(), maxPrice: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <Select
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={(e) => applyFilters({ ...buildFilterState(), sort: e.target.value })}
                />
              </div>
            </div>

            <div className="md:hidden flex gap-2 mt-1">
              <div className="flex-1">
                <Input
                  placeholder="Ürün veya hizmet ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search size={18} />}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="px-4"
                onClick={() => {
                  setMobileDraft(buildFilterState());
                  setIsMobileFiltersOpen(true);
                }}
              >
                <Filter size={18} className="mr-2" />
                Filters
              </Button>
            </div>

            <div className="hidden md:flex gap-2 overflow-x-auto pt-1 pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => applyFilters({ ...buildFilterState(), category: cat.value })}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    selectedCategory === cat.value
                      ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white"
                      : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ak-shell py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {selectedCategory === "all" ? "Tüm İlanlar" : MARKETPLACE_CATEGORY_LABELS[selectedCategory]}
          </h2>
          <span className="text-sm text-neutral-500">{totalCount} ilan</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : errorMessage ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium mb-2">Bir hata oluştu</h3>
              <p className="text-neutral-500 mb-6">{errorMessage}</p>
            </CardContent>
          </Card>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Sonuç bulunamadı</h3>
              <p className="text-neutral-500 mb-6">Bu filtrelerde ilan bulunamadı.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            <div ref={sentinelRef} className="h-8" />

            {isLoadingMore && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Daha fazla ilan yükleniyor...
              </div>
            )}

            {loadMoreError && (
              <div className="flex flex-col items-center gap-3 py-6">
                <p className="text-sm text-neutral-500">{loadMoreError}</p>
                <Button type="button" variant="secondary" onClick={() => fetchListingsPage(page + 1, false)}>
                  Tekrar Dene
                </Button>
              </div>
            )}

            {!isLoadingMore && !hasMore && (
              <p className="text-center text-sm text-neutral-500 py-6">No more listings</p>
            )}
          </>
        )}
      </section>

      {isMobileFiltersOpen && mobileDraft && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setIsMobileFiltersOpen(false);
              setMobileDraft(null);
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white dark:bg-neutral-950 p-5 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filtreler</h3>
              <button
                type="button"
                onClick={() => {
                  setIsMobileFiltersOpen(false);
                  setMobileDraft(null);
                }}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <Select
                options={CATEGORY_OPTIONS}
                value={mobileDraft.category}
                onChange={(e) => setMobileDraft((prev) => prev ? { ...prev, category: e.target.value as MarketplaceCategory | "all" } : prev)}
              />
              <Select
                options={STATE_OPTIONS}
                value={mobileDraft.state}
                onChange={(e) => setMobileDraft((prev) => prev ? { ...prev, state: e.target.value } : prev)}
              />
              <Input
                placeholder="Şehir"
                value={mobileDraft.city}
                onChange={(e) => setMobileDraft((prev) => prev ? { ...prev, city: e.target.value } : prev)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min $"
                  value={mobileDraft.minPrice}
                  onChange={(e) => setMobileDraft((prev) => prev ? { ...prev, minPrice: e.target.value } : prev)}
                />
                <Input
                  type="number"
                  placeholder="Max $"
                  value={mobileDraft.maxPrice}
                  onChange={(e) => setMobileDraft((prev) => prev ? { ...prev, maxPrice: e.target.value } : prev)}
                />
              </div>
              <Select
                options={CONDITION_OPTIONS}
                value={mobileDraft.condition}
                onChange={(e) => setMobileDraft((prev) => prev ? { ...prev, condition: e.target.value } : prev)}
              />
              <Select
                options={SORT_OPTIONS}
                value={mobileDraft.sort}
                onChange={(e) => setMobileDraft((prev) => prev ? { ...prev, sort: e.target.value } : prev)}
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const cleared = resetFilters();
                    setMobileDraft(cleared);
                    applyFilters(cleared, true);
                  }}
                >
                  Temizle
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => applyFilters(mobileDraft, true)}
                >
                  Uygula
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const conditionLabel = MARKETPLACE_CONDITION_LABELS[listing.condition] || listing.condition;
  const postedDate = new Date(listing.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  return (
    <Link href={`/alisveris/ilan/${listing.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
        <div className="relative h-44 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {listing.images && listing.images.length > 0 ? (
            <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
              <Package size={30} />
              <span className="text-xs mt-2">Görsel yok</span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-lg font-bold text-orange-500">${listing.price.toLocaleString()}</p>
            <Badge variant="outline" size="sm">{conditionLabel}</Badge>
          </div>
          <h3 className="font-semibold mt-1 line-clamp-2 min-h-[3rem]">{listing.title}</h3>
          <div className="flex items-center gap-1 text-sm text-neutral-500 mt-2">
            <MapPin size={12} />
            {listing.city}, {US_STATES_MAP[listing.state] || listing.state}
          </div>
          <p className="text-xs text-neutral-500 mt-2">{postedDate}</p>
          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <Badge variant="outline" size="sm">{MARKETPLACE_CATEGORY_LABELS[listing.category]}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
