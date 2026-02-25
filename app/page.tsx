"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Search,
  ShoppingBag,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import { Button } from "./components/ui/Button";
import { Modal } from "./components/ui/Modal";
import { publicSupabase } from "@/lib/supabase/publicClient";
import { searchSiteContent } from "@/lib/siteSearch";
import { devLog } from "@/lib/debug/devLogger";
import { useAuth } from "./contexts/AuthContext";

type HomeCategoryKey = "events" | "realEstate" | "jobs" | "marketplace";

type PostListingCategory = {
  id: "realEstate" | "jobs" | "marketplace";
  label: string;
  description: string;
  href: string;
};

const POST_LISTING_CATEGORIES: PostListingCategory[] = [
  {
    id: "realEstate",
    label: "Emlak",
    description: "Ev, oda veya arsa ilanı ver",
    href: "/emlak/ilan-ver",
  },
  {
    id: "jobs",
    label: "İş",
    description: "İş arayan veya işveren ilanı oluştur",
    href: "/is/ilan-ver",
  },
  {
    id: "marketplace",
    label: "Alışveriş",
    description: "Ürün alım-satım ilanı paylaş",
    href: "/alisveris/ilan-ver",
  },
];

type UnifiedAd = {
  id: string;
  title: string;
  location: string;
  href: string;
  section: HomeCategoryKey;
  createdAt: string;
  popularity: number;
  priceLabel?: string;
  imageUrl?: string | null;
};

type SearchSuggestion = {
  id: string;
  title: string;
  location: string;
  href: string;
  section: HomeCategoryKey;
};

const SEARCH_TYPE_TO_SECTION: Record<string, HomeCategoryKey> = {
  event: "events",
  realEstate: "realEstate",
  job: "jobs",
  marketplace: "marketplace",
  group: "events",
  profile: "events",
  post: "events",
};

const HOME_THEME = {
  bg: "var(--color-surface)",
  primary: "var(--color-primary)",
  accent: "var(--color-primary-hover)",
  text: "var(--color-ink)",
  textSecondary: "var(--color-ink-secondary)",
};

const CATEGORY_CONFIG: Record<
  HomeCategoryKey,
  {
    title: string;
    href: string;
    icon: typeof Building2;
    badgeClass: string;
    cardClass: string;
    iconCircleClass: string;
  }
> = {
  events: {
    title: "Etkinlikler",
    href: "/meetups",
    icon: CalendarDays,
    badgeClass: "bg-[#FCE8E7] text-[var(--color-primary-hover)]",
    cardClass: "from-[#FBEDE6] via-[#FFF8F6] to-[#FDEAE8]",
    iconCircleClass: "bg-[var(--color-primary)] text-white",
  },
  realEstate: {
    title: "Emlak",
    href: "/emlak",
    icon: Building2,
    badgeClass: "bg-[#FCE8E7] text-[var(--color-primary-hover)]",
    cardClass: "from-[#F8EDE7] via-[#FFF8F6] to-[#FCEBE8]",
    iconCircleClass: "bg-[var(--color-ink)] text-white",
  },
  jobs: {
    title: "İş",
    href: "/is",
    icon: BriefcaseBusiness,
    badgeClass: "bg-[#FCE8E7] text-[var(--color-primary-hover)]",
    cardClass: "from-[#F9EAE8] via-[#FFF8F6] to-[#FDEDEA]",
    iconCircleClass: "bg-[var(--color-primary)] text-white",
  },
  marketplace: {
    title: "Alışveriş",
    href: "/alisveris",
    icon: ShoppingBag,
    badgeClass: "bg-[#FCE8E7] text-[var(--color-primary-hover)]",
    cardClass: "from-[#F9ECE6] via-[#FFF8F6] to-[#FDEAE6]",
    iconCircleClass: "bg-[var(--color-ink)] text-white",
  },
};

export default function Home() {
  const INITIAL_LATEST_ROWS = 20;
  const LATEST_ROWS_PER_LOAD = 10;
  const MAX_LATEST_ROWS = 50;
  const MAX_LOAD_REPETITIONS = 5;
  const LATEST_COLUMNS = 2;

  const INITIAL_LATEST_ITEMS = INITIAL_LATEST_ROWS * LATEST_COLUMNS;
  const LATEST_ITEMS_PER_LOAD = LATEST_ROWS_PER_LOAD * LATEST_COLUMNS;
  const MAX_LATEST_ITEMS = MAX_LATEST_ROWS * LATEST_COLUMNS;

  const router = useRouter();
  const { user } = useAuth();
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const latestAdsLoadTriggerRef = useRef<HTMLDivElement>(null);

  const [ads, setAds] = useState<UnifiedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMoreLatestAds, setLoadingMoreLatestAds] = useState(false);
  const [latestAdsLoadRepetition, setLatestAdsLoadRepetition] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isPostListingModalOpen, setIsPostListingModalOpen] = useState(false);
  const [latestAdsCategoryFilter, setLatestAdsCategoryFilter] = useState<"all" | HomeCategoryKey>("all");
  const [activeCategoryPreview, setActiveCategoryPreview] = useState<HomeCategoryKey>("events");
  const [categoryPreviewItems, setCategoryPreviewItems] = useState<Record<HomeCategoryKey, UnifiedAd[]>>({
    events: [],
    realEstate: [],
    jobs: [],
    marketplace: [],
  });

  const isAbortLikeError = (error: unknown) => {
    if (!error) return false;
    if (error instanceof DOMException) {
      return error.name === "AbortError" || error.name === "TimeoutError";
    }

    if (typeof error !== "object") return false;

    const maybeError = error as { name?: string; message?: string; details?: string; code?: string };
    const combined = `${maybeError.name || ""} ${maybeError.message || ""} ${maybeError.details || ""} ${maybeError.code || ""}`.toLowerCase();

    return (
      maybeError.name === "AbortError" ||
      maybeError.name === "TimeoutError" ||
      combined.includes("aborterror") ||
      combined.includes("signal is aborted") ||
      combined.includes("request aborted")
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const latestAdsTargetCount = useMemo(
    () => Math.min(MAX_LATEST_ITEMS, INITIAL_LATEST_ITEMS + latestAdsLoadRepetition * LATEST_ITEMS_PER_LOAD),
    [INITIAL_LATEST_ITEMS, LATEST_ITEMS_PER_LOAD, MAX_LATEST_ITEMS, latestAdsLoadRepetition],
  );
  const hasMoreLatestAds = latestAdsTargetCount < MAX_LATEST_ITEMS && latestAdsLoadRepetition < MAX_LOAD_REPETITIONS;

  const fetchHomepageData = useCallback(
    async (latestLimit: number) => {
      const today = new Date().toISOString().split("T")[0];
      devLog("home", "fetch:start", { latestLimit });
      setLoading(latestLimit === INITIAL_LATEST_ITEMS);
      setLoadingMoreLatestAds(latestLimit > INITIAL_LATEST_ITEMS);
      try {
        const [eventsRes, realEstateRes, jobsRes, marketplaceRes] = await Promise.all([
          publicSupabase
            .from("events")
            .select("id, title, city, state, current_attendees, created_at, cover_image_url")
            .eq("status", "approved")
            .gte("event_date", today)
            .order("current_attendees", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(latestLimit),
          publicSupabase
            .from("listings")
            .select("id, title, city, state, price, view_count, created_at, images")
            .eq("status", "approved")
            .order("view_count", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(latestLimit),
          publicSupabase
            .from("job_listings")
            .select("id, title, city, state, salary_min, salary_max, view_count, created_at")
            .eq("status", "approved")
            .order("view_count", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(latestLimit),
          publicSupabase
            .from("marketplace_listings")
            .select("id, title, city, state, price, view_count, created_at, images")
            .eq("status", "approved")
            .order("view_count", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(latestLimit),
        ]);

        if (eventsRes.error) throw eventsRes.error;
        if (realEstateRes.error) throw realEstateRes.error;
        if (jobsRes.error) throw jobsRes.error;
        if (marketplaceRes.error) throw marketplaceRes.error;

        const unified: UnifiedAd[] = [
          ...(eventsRes.data ?? []).map((item) => ({
            id: `event-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/meetups/${item.id}`,
            section: "events" as const,
            createdAt: item.created_at,
            popularity: item.current_attendees ?? 0,
            priceLabel: "Ücretsiz / biletli",
            imageUrl: item.cover_image_url,
          })),
          ...(realEstateRes.data ?? []).map((item) => ({
            id: `listing-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/emlak/ilan/${item.id}`,
            section: "realEstate" as const,
            createdAt: item.created_at,
            popularity: item.view_count ?? 0,
            priceLabel: formatCurrency(item.price),
            imageUrl: item.images?.[0] ?? null,
          })),
          ...(jobsRes.data ?? []).map((item) => ({
            id: `job-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/is/ilan/${item.id}`,
            section: "jobs" as const,
            createdAt: item.created_at,
            popularity: item.view_count ?? 0,
            priceLabel: formatSalaryRange(item.salary_min, item.salary_max),
          })),
          ...(marketplaceRes.data ?? []).map((item) => ({
            id: `market-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/alisveris/ilan/${item.id}`,
            section: "marketplace" as const,
            createdAt: item.created_at,
            popularity: item.view_count ?? 0,
            priceLabel: formatCurrency(item.price),
            imageUrl: item.images?.[0] ?? null,
          })),
        ]
          .sort((a, b) => b.popularity - a.popularity || +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, latestLimit);

        const previewItems: Record<HomeCategoryKey, UnifiedAd[]> = {
          events: (eventsRes.data ?? []).slice(0, 9).map((item) => ({
            id: `event-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/meetups/${item.id}`,
            section: "events" as const,
            createdAt: item.created_at,
            popularity: item.current_attendees ?? 0,
            priceLabel: "Ücretsiz / biletli",
            imageUrl: item.cover_image_url,
          }))
            .sort((a, b) => b.popularity - a.popularity || +new Date(b.createdAt) - +new Date(a.createdAt)),
          realEstate: (realEstateRes.data ?? []).slice(0, 9).map((item) => ({
            id: `listing-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/emlak/ilan/${item.id}`,
            section: "realEstate" as const,
            createdAt: item.created_at,
            popularity: item.view_count ?? 0,
            priceLabel: formatCurrency(item.price),
            imageUrl: item.images?.[0] ?? null,
          }))
            .sort((a, b) => b.popularity - a.popularity || +new Date(b.createdAt) - +new Date(a.createdAt)),
          jobs: (jobsRes.data ?? []).slice(0, 9).map((item) => ({
            id: `job-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/is/ilan/${item.id}`,
            section: "jobs" as const,
            createdAt: item.created_at,
            popularity: item.view_count ?? 0,
            priceLabel: formatSalaryRange(item.salary_min, item.salary_max),
          }))
            .sort((a, b) => b.popularity - a.popularity || +new Date(b.createdAt) - +new Date(a.createdAt)),
          marketplace: (marketplaceRes.data ?? []).slice(0, 9).map((item) => ({
            id: `market-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/alisveris/ilan/${item.id}`,
            section: "marketplace" as const,
            createdAt: item.created_at,
            popularity: item.view_count ?? 0,
            priceLabel: formatCurrency(item.price),
            imageUrl: item.images?.[0] ?? null,
          }))
            .sort((a, b) => b.popularity - a.popularity || +new Date(b.createdAt) - +new Date(a.createdAt)),
        };

        setAds(unified);
        setCategoryPreviewItems(previewItems);
        devLog("home", "fetch:set", { latestLimit, count: unified.length });
      } catch (error) {
        if (!isAbortLikeError(error)) {
          console.error("Homepage fetch error", error);
        }
      } finally {
        devLog("home", "fetch:end", { latestLimit });
        setLoading(false);
        setLoadingMoreLatestAds(false);
      }
    },
    [INITIAL_LATEST_ITEMS],
  );

  useEffect(() => {
    fetchHomepageData(latestAdsTargetCount);
  }, [fetchHomepageData, latestAdsTargetCount]);

  useEffect(() => {
    const node = latestAdsLoadTriggerRef.current;
    if (!node || loading || loadingMoreLatestAds || !hasMoreLatestAds) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setLoadingMoreLatestAds(true);
          setLatestAdsLoadRepetition((prev) => (prev < MAX_LOAD_REPETITIONS ? prev + 1 : prev));
        }
      },
      { rootMargin: "250px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreLatestAds, loading, loadingMoreLatestAds, MAX_LOAD_REPETITIONS]);

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();

    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      setSearching(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    const debounce = window.setTimeout(async () => {
      setSearching(true);
      try {
        const merged: SearchSuggestion[] = (await searchSiteContent(normalizedQuery, 6)).map((item) => ({
          id: item.id,
          title: item.title,
          location: item.subtitle,
          href: item.href,
          section: SEARCH_TYPE_TO_SECTION[item.type] || "events",
        })).slice(0, 8);

        setSuggestions(merged);
        setSearchOpen(true);
        setActiveSuggestionIndex(-1);
      } catch (error) {
        console.error("Search suggestions error", error);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => window.clearTimeout(debounce);
  }, [searchQuery]);

  const onSearchSubmit = () => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) return;

    if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
      router.push(suggestions[activeSuggestionIndex].href);
      setSearchOpen(false);
      return;
    }

    if (suggestions[0]) {
      router.push(suggestions[0].href);
      setSearchOpen(false);
      return;
    }

    const q = encodeURIComponent(normalizedQuery);
    router.push(`/search?q=${q}`);
    setSearchOpen(false);
  };

  const handlePostListingCategorySelect = (href: string) => {
    setIsPostListingModalOpen(false);
    router.push(href);
  };

  const handleCategoryCardClick = useCallback(
    (key: HomeCategoryKey) => {
      const config = CATEGORY_CONFIG[key];
      const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

      if (isDesktop) {
        router.push(config.href);
        return;
      }

      setActiveCategoryPreview(key);
    },
    [router],
  );

  const featuredAds = useMemo(() => ads.slice(0, 4), [ads]);
  const latestAds = useMemo(() => ads.slice(0, latestAdsTargetCount), [ads, latestAdsTargetCount]);
  const latestFilteredAds = useMemo(
    () => (latestAdsCategoryFilter === "all" ? latestAds : latestAds.filter((item) => item.section === latestAdsCategoryFilter)),
    [latestAds, latestAdsCategoryFilter],
  );

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-x-clip bg-[var(--color-surface)]" style={{ backgroundColor: HOME_THEME.bg, color: HOME_THEME.text }}>
      <div className="flex">
        <Sidebar />

        <main className="relative z-10 flex-1">
          <section className="relative overflow-hidden border-b border-[var(--color-border-light)] bg-[var(--color-surface)]">
            <div className="app-page-container relative pt-12 pb-10 sm:pb-12">
              <div className="max-w-[760px]">
                <div>
                  <h1 className="text-[56px] font-black uppercase leading-[0.92] tracking-tight text-[var(--color-ink)] sm:text-[64px] lg:text-[72px]">
                    SENİ
                    <br />
                    BEKLEYENLER
                    <br />
                    <span className="text-[var(--color-primary)]">BURADA.</span>
                  </h1>
                  <p className="mt-6 max-w-[680px] text-lg text-[var(--color-ink-secondary)]">
                    Amerika&apos;nın ilk ve tek tamamen ücretsiz Türkçe paylaşım ve topluluk platformu.
                  </p>

                  <div
                    ref={searchBoxRef}
                    className="relative mt-8 w-full max-w-[710px] rounded-2xl border border-[#DECFC0] bg-white p-1.5 shadow-[0_10px_24px_-20px_rgba(17,17,17,0.4)]"
                  >
                    <div className="grid min-h-14 gap-0 md:grid-cols-[1fr_100px_116px]">
                      <div className="flex items-center gap-3 px-5">
                        <Search className="h-5 w-5 text-[#C49A5C]" />
                        <input
                          value={searchQuery}
                          onChange={(event) => {
                            setSearchQuery(event.target.value);
                            setSearchOpen(true);
                          }}
                          onFocus={() => setSearchOpen(true)}
                          onKeyDown={(event) => {
                            if (!suggestions.length) {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                onSearchSubmit();
                              }
                              return;
                            }

                            if (event.key === "ArrowDown") {
                              event.preventDefault();
                              setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
                            }

                            if (event.key === "ArrowUp") {
                              event.preventDefault();
                              setActiveSuggestionIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                            }

                            if (event.key === "Enter") {
                              event.preventDefault();
                              onSearchSubmit();
                            }
                          }}
                          className="w-full border-none bg-transparent text-base text-[var(--color-ink)] outline-none placeholder:text-[#BE9C72]"
                          placeholder="Etkinlik, ilan, kişi ara..."
                          aria-label="Site içi arama"
                        />
                      </div>

                      <button
                        type="button"
                        className="rounded-[14px] border border-[#E3D6CA] bg-[#FBF8F4] px-6 text-base font-semibold text-[#403B36]"
                      >
                        TÜM
                      </button>
                      <Button
                        variant="primary"
                        className="h-full min-h-14 rounded-[14px] bg-[var(--color-primary)] px-8 text-base font-bold uppercase tracking-wide hover:bg-[var(--color-primary-hover)]"
                        onClick={onSearchSubmit}
                      >
                        {searching ? "Aranıyor..." : "ARA"}
                      </Button>
                    </div>

                    {searchOpen && searchQuery.trim().length >= 2 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-white shadow-[0_18px_40px_-30px_rgba(17,17,17,0.4)]">
                        {searching ? (
                          <p className="px-4 py-3 text-sm text-slate-500">Uygun ilanlar aranıyor...</p>
                        ) : suggestions.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-slate-500">Sonuç bulunamadı. Farklı bir arama deneyin.</p>
                        ) : (
                          <ul className="max-h-80 overflow-y-auto py-1">
                            {suggestions.map((item, index) => {
                              const meta = CATEGORY_CONFIG[item.section];
                              const isActive = index === activeSuggestionIndex;

                              return (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      router.push(item.href);
                                      setSearchOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                                      isActive ? "bg-[#FDF3EF]" : "hover:bg-[#FDF3EF]"
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{item.title}</p>
                                      <p className="truncate text-xs text-[#6C645E]">{item.location}</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${meta.badgeClass}`}>{meta.title}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {user ? (
                      <Button
                        variant="primary"
                        size="lg"
                        className="h-11 rounded-xl bg-[var(--color-ink)] px-7 text-sm font-semibold tracking-wide text-white shadow-[0_14px_26px_-18px_rgba(17,17,17,0.9)]"
                        onClick={() => setIsPostListingModalOpen(true)}
                      >
                        İlan Ver
                      </Button>
                    ) : (
                      <Link href="/login">
                        <Button
                          variant="ghost"
                          size="lg"
                          className="h-11 rounded-xl border border-black bg-transparent px-7 text-sm font-bold uppercase tracking-[0.08em] text-black shadow-none hover:bg-black/5"
                        >
                          GİRİŞ YAP
                        </Button>
                      </Link>
                    )}
                    <Link href="#son-ilanlar">
                      <Button
                        variant="primary"
                        size="lg"
                        className="h-11 rounded-xl bg-black px-7 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_16px_28px_-18px_rgba(17,17,17,0.45)] hover:bg-black/90 hover:text-white focus-visible:ring-black/20"
                      >
                        PAYLAŞIMLARI GÖR →
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Modal
            open={isPostListingModalOpen}
            onClose={() => setIsPostListingModalOpen(false)}
            title="Hangi kategoride ilan vermek istiyorsunuz?"
            description="Devam etmek için bir kategori seçin."
            size="sm"
          >
            <div className="space-y-3">
              {POST_LISTING_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handlePostListingCategorySelect(category.href)}
                  className="w-full rounded-2xl border border-[var(--color-border-light)] bg-white px-4 py-3 text-left transition hover:border-[#D7B8A7] hover:bg-[#FDF5EF]"
                >
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{category.label}</p>
                  <p className="mt-1 text-xs text-[#6C645E]">{category.description}</p>
                </button>
              ))}
            </div>
          </Modal>

          <section className="app-page-container py-12">
            <div className="rounded-3xl border border-[var(--color-border-light)] bg-[#F8F3EE] p-4 shadow-[0_22px_45px_-40px_rgba(15,23,42,0.55)] sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {(Object.keys(CATEGORY_CONFIG) as HomeCategoryKey[]).map((key) => {
                  const config = CATEGORY_CONFIG[key];
                  const Icon = config.icon;
                  const isActive = activeCategoryPreview === key;

                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => handleCategoryCardClick(key)}
                      onMouseEnter={() => setActiveCategoryPreview(key)}
                      onFocus={() => setActiveCategoryPreview(key)}
                      className={`group rounded-2xl border px-3 py-4 text-center transition-all sm:px-4 sm:py-5 ${
                        isActive
                          ? "border-[#E9D5C8] bg-[#FDF6F2] shadow-[0_22px_36px_-30px_rgba(17,17,17,0.35)]"
                          : "border-[var(--color-border-light)] bg-white hover:-translate-y-0.5 hover:shadow-[0_24px_40px_-30px_rgba(17,17,17,0.35)]"
                      }`}
                    >
                      <span className={`mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full ${config.iconCircleClass} sm:h-14 sm:w-14`}>
                        <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                      </span>
                      <h3 className="mt-3 text-sm font-semibold text-[var(--color-ink)] sm:text-lg">{config.title}</h3>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-3xl border border-[var(--color-border-light)] bg-[#FBF7F3] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[var(--color-ink)]">{CATEGORY_CONFIG[activeCategoryPreview].title} - Popüler Gönderiler</h3>
                  <Link
                    href={CATEGORY_CONFIG[activeCategoryPreview].href}
                    className="rounded-full border border-[var(--color-border-light)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--color-primary-hover)] transition hover:border-[#D8B7A6] hover:text-[#A52020]"
                  >
                    Tümü
                  </Link>
                </div>

                {categoryPreviewItems[activeCategoryPreview].length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#DCCFC3] bg-white p-6 text-center text-sm text-[#6C645E]">
                    Bu kategori için henüz gönderi bulunmuyor.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryPreviewItems[activeCategoryPreview].map((item) => (
                      <Link
                        key={`preview-${item.id}`}
                        href={item.href}
                        className={`relative overflow-hidden rounded-2xl border border-[var(--color-border-light)] transition hover:border-[#D9B9A7] hover:shadow-sm ${
                          item.imageUrl ? "bg-[var(--color-ink)]" : "bg-white"
                        }`}
                      >
                        {item.imageUrl && (
                          <>
                            <div
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${item.imageUrl})` }}
                              aria-hidden="true"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/55 to-slate-900/20" aria-hidden="true" />
                          </>
                        )}
                        <div className={`relative z-10 flex h-28 flex-col justify-end p-3 ${item.imageUrl ? "text-white" : "text-slate-900"}`}>
                          <h4 className="line-clamp-2 text-sm font-semibold">{item.title}</h4>
                          <p className={`mt-1 text-xs ${item.imageUrl ? "text-white/85" : "text-slate-500"}`}>{item.location}</p>
                          <p className={`mt-1 text-xs font-medium ${item.imageUrl ? "text-white" : "text-slate-600"}`}>{item.priceLabel ?? "Detaylı bilgi"}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <AdsSection title="Öne Çıkan İlanlar" items={featuredAds} loading={loading} />

          <section id="son-ilanlar" className="bg-[var(--color-surface)] py-14 scroll-mt-24">
            <div className="app-page-container py-0">
              <div className="mb-7 flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-[var(--color-ink)]">Son İlanlar</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <CategoryFilterButton
                      isActive={latestAdsCategoryFilter === "all"}
                      onClick={() => setLatestAdsCategoryFilter("all")}
                    >
                      Tümü
                    </CategoryFilterButton>
                    {(Object.keys(CATEGORY_CONFIG) as HomeCategoryKey[]).map((key) => (
                      <CategoryFilterButton key={key} isActive={latestAdsCategoryFilter === key} onClick={() => setLatestAdsCategoryFilter(key)}>
                        {CATEGORY_CONFIG[key].title}
                      </CategoryFilterButton>
                    ))}
                  </div>
                </div>
              </div>
              <AdsGrid items={latestFilteredAds} loading={loading} latestMobileGrid />
              <div ref={latestAdsLoadTriggerRef} className="h-2" aria-hidden="true" />
              {loadingMoreLatestAds && <p className="mt-4 text-center text-sm text-[#6C645E]">Daha fazla ilan yükleniyor...</p>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function AdsSection({
  title,
  subtitle,
  items,
  loading,
}: {
  title: string;
  subtitle?: string;
  items: UnifiedAd[];
  loading: boolean;
}) {
  return (
    <section className="bg-[var(--color-surface)] py-14">
      <div className="app-page-container py-0">
        <div className="mb-7 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-ink)]">{title}</h2>
          {subtitle && <p className="mt-1 text-[#6C645E]">{subtitle}</p>}
        </div>
        <AdsGrid items={items} loading={loading} />
      </div>
    </section>
  );
}

function CategoryFilterButton({
  children,
  isActive,
  onClick,
}: {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        isActive ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-[#D8C9BE] bg-white text-[#5F5852] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
      }`}
    >
      {children}
    </button>
  );
}

function AdsGrid({ items, loading, latestMobileGrid = false }: { items: UnifiedAd[]; loading: boolean; latestMobileGrid?: boolean }) {
  const gridClassName = latestMobileGrid ? "grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4" : "grid gap-4 md:grid-cols-2 xl:grid-cols-4";

  if (loading) {
    return (
      <div className={gridClassName}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-60 animate-pulse rounded-2xl border border-[var(--color-border-light)] bg-[#EFE4DB]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-[#D8C9BE] bg-white p-8 text-center text-[#6C645E]">Henüz listelenecek ilan bulunamadı.</p>;
  }

  return (
    <div className={gridClassName}>
      {items.map((item) => {
        const meta = CATEGORY_CONFIG[item.section];
        return (
          <Link
            key={item.id}
            href={item.href}
            className="group overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-white transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {item.imageUrl ? (
              <div className="h-28 bg-[#F6EEE8]">
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className={`h-28 bg-gradient-to-r ${meta.cardClass} p-4`}>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${meta.badgeClass}`}>{meta.title}</span>
              </div>
            )}
            <div className="space-y-3 p-4">
              <h3 className="line-clamp-2 min-h-[3rem] text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {item.location}
              </p>
              <div className="flex items-center justify-between border-t border-[#F0E5DC] pt-3">
                <span className="text-sm font-semibold text-slate-700">{item.priceLabel ?? "Detaylı bilgi"}</span>
                <span className="text-xs text-[#6C645E]">İlana git</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function formatCurrency(value?: number | null) {
  if (!value) return "Fiyat bilgisi yok";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSalaryRange(min?: number | null, max?: number | null) {
  if (!min && !max) return "Maaş belirtilmemiş";
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `$${min.toLocaleString()}+`;
  return `En fazla $${max?.toLocaleString()}`;
}
