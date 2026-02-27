"use client";

import Image from "next/image";
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
import HeroTitleMotion from "./components/HeroTitleMotion";
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
    badgeClass: "bg-white/70 text-[#4F5965] border border-white/60 backdrop-blur-sm",
    cardClass: "from-[#F7F9FC] via-[#EEF3F8] to-[#E8EDF5]",
    iconCircleClass: "bg-[var(--color-surface-raised)] text-[var(--color-trust)] border border-[rgba(var(--color-trust-rgb),0.16)]",
  },
  realEstate: {
    title: "Emlak",
    href: "/emlak",
    icon: Building2,
    badgeClass: "bg-white/70 text-[#55616E] border border-white/60 backdrop-blur-sm",
    cardClass: "from-[#F6F8FB] via-[#EEF2F7] to-[#E7ECF3]",
    iconCircleClass: "bg-[var(--color-surface-raised)] text-[var(--color-trust)] border border-[rgba(var(--color-trust-rgb),0.16)]",
  },
  jobs: {
    title: "İş",
    href: "/is",
    icon: BriefcaseBusiness,
    badgeClass: "bg-white/70 text-[#4A5764] border border-white/60 backdrop-blur-sm",
    cardClass: "from-[#F7FAFC] via-[#EEF4F8] to-[#E8EEF4]",
    iconCircleClass: "bg-[var(--color-surface-raised)] text-[var(--color-trust)] border border-[rgba(var(--color-trust-rgb),0.16)]",
  },
  marketplace: {
    title: "Alışveriş",
    href: "/alisveris",
    icon: ShoppingBag,
    badgeClass: "bg-white/70 text-[#53606E] border border-white/60 backdrop-blur-sm",
    cardClass: "from-[#F6F9FB] via-[#EEF3F7] to-[#E7EDF3]",
    iconCircleClass: "bg-[var(--color-surface-raised)] text-[var(--color-trust)] border border-[rgba(var(--color-trust-rgb),0.16)]",
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
    <div className="relative overflow-x-clip bg-[#F7F8FA]" style={{ color: HOME_THEME.text }}>
      <div className="flex">
        <Sidebar />

        <main className="relative z-10 flex-1">
          <section className="relative mt-4 flex min-h-[540px] overflow-hidden border-b border-[#1E3352] bg-gradient-to-br from-[#1A2740] via-[#223B5A] to-[#4B6E9D] lg:mt-5 lg:min-h-[600px]">
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  "linear-gradient(128deg, rgba(255,255,255,0.05) 8%, rgba(255,255,255,0) 34%), linear-gradient(136deg, rgba(255,255,255,0.04) 15%, rgba(255,255,255,0) 42%), radial-gradient(72% 58% at 6% 10%, rgba(153,193,247,0.16) 0%, rgba(153,193,247,0) 70%), radial-gradient(70% 60% at 90% 12%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)",
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(137deg, rgba(255,255,255,0.07) 0, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 120px)",
              }}
            />

            <div className="app-page-container relative py-14 lg:py-20">
              <div className="mx-auto w-full max-w-[1140px]">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-20 translate-x-4 -translate-y-4 rounded-[24px] border border-white/25 bg-white/25 shadow-[0_18px_36px_-30px_rgba(8,20,45,0.45)] backdrop-blur-[2px] md:translate-x-8 md:-translate-y-5"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-30 -translate-x-4 translate-y-5 rounded-[24px] border border-white/18 bg-white/16 shadow-[0_16px_32px_-30px_rgba(8,20,45,0.36)] backdrop-blur-[1px] md:-translate-x-7 md:translate-y-8"
                  />

                  <div className="relative overflow-hidden rounded-[24px] border border-white/30 bg-white/60 px-6 py-9 text-[var(--color-ink)] shadow-[0_28px_64px_-40px_rgba(8,20,45,0.58)] md:px-10 md:py-12 lg:px-14 lg:py-[64px] xl:px-16">
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-[rgba(248,252,255,0.38)] backdrop-blur-md" />

                    <div className="relative z-10">
                      <div className="mb-4 flex justify-center md:hidden" aria-hidden="true">
                        <Image src="/logo.png" alt="" width={56} height={56} className="h-14 w-14 object-contain" />
                      </div>

                      <div className="mx-auto max-w-[820px] text-center">
                        <div className="flex justify-center">
                          <HeroTitleMotion />
                        </div>
                        <p className="mx-auto mt-5 max-w-[700px] text-[16px] leading-relaxed text-slate-600 md:text-lg">
                          Amerika&apos;nın ilk ve tek tamamen ücretsiz Türkçe paylaşım ve topluluk platformu.
                        </p>
                      </div>

                      <div
                        ref={searchBoxRef}
                        className="relative mt-10 w-full max-w-[780px] rounded-[18px] border border-[#D6DEE9] bg-white p-2 shadow-[0_22px_45px_-30px_rgba(15,23,42,0.45)]"
                      >
                        <div className="grid min-h-12 grid-cols-[1fr_auto] items-center gap-2 rounded-[14px] bg-white px-2 py-1 md:min-h-[52px] md:grid-cols-[1fr_124px] md:gap-0 md:px-1 md:py-0">
                          <div className="flex items-center gap-2.5 px-2 md:gap-3 md:px-4">
                            <Search className="h-[18px] w-[18px] text-[var(--color-soft-blue)] md:h-5 md:w-5 md:text-[var(--color-navy)]" />
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
                              className="h-12 w-full rounded-xl border border-[#D7DCE4] bg-white px-3 text-[15px] text-[var(--color-ink)] outline-none placeholder:text-[#76849B] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/30 md:h-[52px] md:text-base"
                              placeholder="Ne arıyorsun? (ör: kiralık ev, iş, etkinlik)"
                              aria-label="Site içi arama"
                            />
                          </div>
                          <button
                            type="button"
                            className="inline-flex h-12 items-center justify-center rounded-[13px] bg-[#356DDB] px-5 text-sm font-semibold tracking-[0.01em] text-white shadow-[0_12px_24px_-14px_rgba(37,99,235,0.58)] transition-colors hover:bg-[#2B5FC5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 md:hidden disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={onSearchSubmit}
                            aria-label={searching ? "Aranıyor" : "Ara"}
                          >
                            {searching ? "..." : "Ara"}
                          </button>
                          <button
                            type="button"
                            className="hidden h-[52px] items-center justify-center rounded-[14px] bg-[#356DDB] px-8 text-base font-semibold text-white shadow-[0_12px_24px_-14px_rgba(37,99,235,0.58)] transition-colors hover:bg-[#2B5FC5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
                            onClick={onSearchSubmit}
                          >
                            {searching ? "Aranıyor..." : "Ara"}
                          </button>
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
                                          isActive ? "bg-[#EAF2FF]" : "hover:bg-[#F2F7FF]"
                                        }`}
                                      >
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{item.title}</p>
                                          <p className="truncate text-xs text-[var(--color-ink-secondary)]">{item.location}</p>
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

                      <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-9 md:gap-4">
                        {user ? (
                          <Button
                            variant="primary"
                            size="lg"
                            className="h-12 rounded-[14px] bg-[#B23B46] px-8 text-base font-semibold text-white shadow-[0_16px_30px_-20px_rgba(126,33,42,0.72)] hover:bg-[#9E323D]"
                            onClick={() => setIsPostListingModalOpen(true)}
                          >
                            İlan Ver
                          </Button>
                        ) : (
                          <Link href="/login">
                            <Button
                              variant="primary"
                              size="lg"
                              className="h-12 rounded-[14px] bg-[#B23B46] px-8 text-base font-semibold text-white shadow-[0_16px_30px_-20px_rgba(126,33,42,0.72)] hover:bg-[#9E323D]"
                            >
                              Giriş Yap
                            </Button>
                          </Link>
                        )}
                        <Link href="#son-ilanlar">
                          <Button
                            variant="secondary"
                            size="lg"
                            className="h-12 rounded-[14px] border border-[#D5DEE9] bg-[#F8FAFC] px-8 text-base font-medium text-[#334155] shadow-[0_12px_24px_-20px_rgba(15,23,42,0.38)] hover:bg-white"
                          >
                            Paylaşımları Gör
                          </Button>
                        </Link>
                      </div>
                    </div>
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
                  className="w-full rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] px-4 py-3 text-left transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-primary-subtle)]"
                >
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{category.label}</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-secondary)]">{category.description}</p>
                </button>
              ))}
            </div>
          </Modal>

          <section className="app-page-container bg-[#F7F8FA] pt-8 pb-12 lg:pt-10 lg:pb-14">
            <div className="rounded-3xl border border-[rgba(148,163,184,0.24)] bg-white p-5 shadow-[0_26px_54px_-40px_rgba(15,23,42,0.55)] sm:p-7">
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
                      className={`group rounded-2xl border px-3 py-5 text-center transition-all duration-300 sm:px-4 sm:py-5 ${
                        isActive
                          ? "border-[rgba(100,116,139,0.35)] bg-[#F3F7FE] shadow-[0_18px_34px_-28px_rgba(15,23,42,0.6)]"
                          : "border-[rgba(148,163,184,0.24)] bg-white hover:-translate-y-0.5 hover:border-[rgba(100,116,139,0.35)] hover:bg-[#FAFBFD] hover:shadow-[0_18px_34px_-28px_rgba(15,23,42,0.6)]"
                      }`}
                      aria-pressed={isActive}
                    >
                      <span
                        className={`mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 sm:h-14 sm:w-14 ${
                          isActive
                            ? "bg-[var(--color-surface)] text-[var(--color-primary)]"
                            : `${config.iconCircleClass} group-hover:bg-[var(--color-primary-subtle)] group-hover:text-[var(--color-primary)]`
                        }`}
                      >
                        <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                      </span>
                      <h3
                        className={`mt-3 text-sm font-semibold transition-colors duration-300 sm:text-lg ${
                          isActive ? "text-[var(--color-primary-hover)]" : "text-[var(--color-ink)] group-hover:text-[var(--color-primary)]"
                        }`}
                      >
                        {config.title}
                      </h3>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-3xl border border-[rgba(148,163,184,0.24)] bg-white p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.55)] sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[var(--color-ink)]">{CATEGORY_CONFIG[activeCategoryPreview].title} - Popüler Gönderiler</h3>
                  <Link
                    href={CATEGORY_CONFIG[activeCategoryPreview].href}
                    className="rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-semibold text-[var(--color-primary-hover)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-primary)]"
                  >
                    Tümü
                  </Link>
                </div>

                {categoryPreviewItems[activeCategoryPreview].length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-ink-secondary)]">
                    Bu kategori için henüz gönderi bulunmuyor.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryPreviewItems[activeCategoryPreview].map((item) => (
                      <Link
                        key={`preview-${item.id}`}
                        href={item.href}
                        className={`relative overflow-hidden rounded-2xl border border-[var(--color-border-light)] transition hover:border-[var(--color-border-strong)] hover:shadow-sm ${
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
              {loadingMoreLatestAds && <p className="mt-4 text-center text-sm text-[var(--color-ink-secondary)]">Daha fazla ilan yükleniyor...</p>}
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
    <section className="bg-[#F7F8FA] py-14">
      <div className="app-page-container py-0">
        <div className="mb-7 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-ink)]">{title}</h2>
          {subtitle && <p className="mt-1 text-[var(--color-ink-secondary)]">{subtitle}</p>}
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
        isActive ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
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
          <div key={index} className="h-60 animate-pulse rounded-2xl border border-[rgba(148,163,184,0.24)] bg-[#EEF1F5]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[rgba(148,163,184,0.38)] bg-white p-8 text-center text-[var(--color-ink-secondary)]">Henüz listelenecek ilan bulunamadı.</p>;
  }

  return (
    <div className={gridClassName}>
      {items.map((item) => {
        const meta = CATEGORY_CONFIG[item.section];
        return (
          <Link
            key={item.id}
            href={item.href}
            className="group overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.24)] bg-white shadow-[0_16px_30px_-26px_rgba(15,23,42,0.6)] transition hover:-translate-y-0.5 hover:border-[rgba(100,116,139,0.35)] hover:shadow-[0_24px_40px_-28px_rgba(15,23,42,0.65)]"
          >
            {item.imageUrl ? (
              <div className="h-28 bg-[var(--color-surface-sunken)]">
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className={`h-28 bg-gradient-to-br ${meta.cardClass} p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]`}>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${meta.badgeClass}`}>{meta.title}</span>
              </div>
            )}
            <div className="space-y-3 p-4">
              <h3 className="line-clamp-2 min-h-[3rem] text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {item.location}
              </p>
              <div className="flex items-center justify-between border-t border-[var(--color-border-light)] pt-3">
                <span className="text-sm font-semibold text-slate-700">{item.priceLabel ?? "Detaylı bilgi"}</span>
                <span className="text-xs text-[var(--color-ink-secondary)]">İlana git</span>
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
