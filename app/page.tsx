"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  ShoppingBag,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import HeroAmbientVisual from "./components/hero/HeroAmbientVisual";
import HeroBackgroundCarousel from "./components/hero/HeroBackgroundCarousel";
import HeroTitleMotion from "./components/HeroTitleMotion";
import YardimlasmaSpotlight, { type YardimlasmaSpotlightItem } from "./components/YardimlasmaSpotlight";
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

const FEATURED_CAROUSEL_AUTO_ADVANCE_MS = 11_000;
const FEATURED_CAROUSEL_EASING = "cubic-bezier(0.16,1,0.3,1)";
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
  events: {
    title: "Etkinlikler",
    href: "/meetups",
    icon: CalendarDays,
    badgeClass: "bg-white/70 text-[#4F5965] border border-white/60 backdrop-blur-sm",
    cardClass: "from-[#F7F9FC] via-[#EEF3F8] to-[#E8EDF5]",
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
  const [activeCategoryPreview, setActiveCategoryPreview] = useState<HomeCategoryKey>("realEstate");
  const [mobileCategorySecondTapTarget, setMobileCategorySecondTapTarget] = useState<HomeCategoryKey | null>(null);
  const [yardimlasmaSpotlightItems, setYardimlasmaSpotlightItems] = useState<YardimlasmaSpotlightItem[]>([]);
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
        const [eventsRes, realEstateRes, jobsRes, marketplaceRes, yardimlasmaRes] = await Promise.all([
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
          publicSupabase
            .from("help_posts")
            .select("id, title, body, category, location_text, created_at")
            .in("status", ["open", "solved"])
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        if (eventsRes.error) throw eventsRes.error;
        if (realEstateRes.error) throw realEstateRes.error;
        if (jobsRes.error) throw jobsRes.error;
        if (marketplaceRes.error) throw marketplaceRes.error;
        if (yardimlasmaRes.error) throw yardimlasmaRes.error;

        const sanitizeText = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        const createExcerpt = (title: string | null, body: string | null) => {
          const preferred = sanitizeText(title || "");
          if (preferred.length >= 20) return preferred.length > 110 ? `${preferred.slice(0, 107)}...` : preferred;
          const source = sanitizeText(body || "");
          return source.length > 110 ? `${source.slice(0, 107)}...` : source;
        };

        const spotlight = (yardimlasmaRes.data ?? [])
          .map((post) => ({
            id: post.id,
            category: post.category || "Diğer",
            excerpt: createExcerpt(post.title, post.body),
            location: post.location_text,
            createdAt: post.created_at,
            href: `/yardimlasma?post=${post.id}`,
          }))
          .filter((post) => Boolean(post.id) && Boolean(post.excerpt));

        setYardimlasmaSpotlightItems(spotlight);

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

      if (mobileCategorySecondTapTarget === key) {
        setMobileCategorySecondTapTarget(null);
        router.push(config.href);
        return;
      }

      setActiveCategoryPreview(key);
      setMobileCategorySecondTapTarget(key);
    },
    [mobileCategorySecondTapTarget, router],
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

        <main className="flex-1">
          {/* Hero Section - Clean & Minimal */}
          <section className="relative py-20 lg:py-32 overflow-hidden">
            <div className="absolute inset-0">
              <video
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="/back.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-[rgba(255,255,255,0.82)] backdrop-blur-[2px]" />
            </div>
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                {/* Tagline */}
                <p className="text-sm font-medium text-[var(--color-primary)] tracking-wide uppercase mb-4">
                  {t("home.hero.badge")}
                </p>
              </div>

            <div className="app-page-container relative z-10 w-full">
              <div className="mx-auto w-full max-w-[1140px]">
                <div className="hero-card-shell relative">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 translate-x-4 -translate-y-4 rounded-[24px] border border-white/20 bg-[rgba(255,255,255,0.1)] shadow-[0_22px_60px_-52px_rgba(8,20,45,0.6)] backdrop-blur-[48px] md:translate-x-8 md:-translate-y-6"
                  />

                  <div className="relative z-10 rounded-[24px] border border-[rgba(255,255,255,0.66)] bg-[rgba(249,251,255,0.84)] px-6 py-6 text-[var(--color-ink)] shadow-[0_34px_80px_-44px_rgba(8,20,45,0.6)] backdrop-blur-[14px] md:px-10 md:py-7 lg:h-[430px] lg:px-14 lg:py-8 xl:px-16">
                    <HeroBackgroundCarousel />
                    <HeroAmbientVisual />

                    <div className="relative z-10 flex h-full flex-col justify-center lg:justify-between">
                      <div className="mb-3 flex justify-center md:hidden" aria-hidden="true">
                        <Image src="/logo.png" alt="" width={56} height={56} className="h-14 w-14 object-contain" />
                      </div>

                      <div className="mx-auto max-w-[820px] text-center">
                        <div className="flex justify-center">
                          <HeroTitleMotion />
                        </div>
                        <p className="mx-auto mt-2.5 max-w-[700px] text-[16px] leading-relaxed text-slate-600 md:mt-3 md:text-lg">
                          Amerika&apos;nın ilk ve tek tamamen ücretsiz Türkçe paylaşım ve topluluk platformu.
                        </p>
                      </div>

                      <div
                        ref={searchBoxRef}
                        className="relative mx-auto mt-5 w-full max-w-[780px] rounded-[18px] border border-[#D6DEE9] bg-white p-2 shadow-[0_22px_45px_-30px_rgba(15,23,42,0.45)] md:mt-6"
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
                            className="inline-flex h-12 items-center justify-center rounded-[13px] bg-[#356DDB] px-5 text-sm font-semibold tracking-[0.01em] text-white shadow-[0_12px_24px_-14px_rgba(37,99,235,0.58)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2B5FC5] hover:shadow-[0_16px_30px_-16px_rgba(37,99,235,0.66)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 md:hidden disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={onSearchSubmit}
                            aria-label={searching ? "Aranıyor" : "Ara"}
                          >
                            {searching ? "..." : "Ara"}
                          </button>
                          <button
                            type="button"
                            className="hidden h-[52px] items-center justify-center rounded-[14px] bg-[#356DDB] px-8 text-base font-semibold text-white shadow-[0_12px_24px_-14px_rgba(37,99,235,0.58)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2B5FC5] hover:shadow-[0_16px_30px_-16px_rgba(37,99,235,0.66)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
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

                      <div className="relative z-20 mx-auto mt-4 flex w-full max-w-[780px] flex-wrap items-center justify-center gap-2.5 pb-1 md:mt-5 md:gap-3 lg:pb-0">
                        {user ? (
                          <Button
                            variant="primary"
                            size="lg"
                            className="h-10 whitespace-nowrap rounded-[12px] bg-[#B23B46] px-5 text-sm font-semibold text-white shadow-[0_16px_30px_-20px_rgba(126,33,42,0.72)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#9E323D] hover:shadow-[0_18px_34px_-18px_rgba(126,33,42,0.78)] md:h-11 md:px-6"
                            onClick={() => setIsPostListingModalOpen(true)}
                          >
                            İlan Ver
                          </Button>
                        ) : (
                          <Link href="/login">
                            <Button
                              variant="primary"
                              size="lg"
                              className="h-10 whitespace-nowrap rounded-[12px] bg-[#B23B46] px-5 text-sm font-semibold text-white shadow-[0_16px_30px_-20px_rgba(126,33,42,0.72)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#9E323D] hover:shadow-[0_18px_34px_-18px_rgba(126,33,42,0.78)] md:h-11 md:px-6"
                            >
                              Giriş Yap
                            </Button>
                          </Link>
                        )}
                        <Link href="#son-ilanlar">
                          <Button
                            variant="secondary"
                            size="lg"
                            className="h-10 whitespace-nowrap rounded-[12px] border border-[#D5DEE9] bg-[#F8FAFC] px-5 text-sm font-medium text-[#334155] shadow-[0_12px_24px_-20px_rgba(15,23,42,0.38)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_30px_-18px_rgba(15,23,42,0.45)] md:h-11 md:px-6"
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

          <section className="app-page-container relative z-30 -mt-7 bg-transparent pb-12 sm:-mt-8 lg:-mt-16 lg:pb-14">
            {/* Upward overlap creates an Amazon-like merged composition with the hero above. */}
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
                      className={`group flex min-h-[132px] flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center transition-all duration-300 sm:min-h-[156px] sm:px-4 sm:py-5 ${
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
                        <Icon className="h-[19px] w-[19px] sm:h-7 sm:w-7" />
                      </span>
                      <h3
                        className={`mt-2.5 max-w-[10ch] line-clamp-2 text-[14px] font-semibold leading-[1.3] tracking-[-0.01em] transition-colors duration-300 sm:mt-3 sm:max-w-none sm:text-lg sm:leading-tight ${
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
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
                    {categoryPreviewItems[activeCategoryPreview].map((item, index) => (
                      <Link
                        key={`preview-${item.id}`}
                        href={item.href}
                        className={`relative overflow-hidden rounded-2xl border border-[var(--color-border-light)] transition hover:border-[var(--color-border-strong)] hover:shadow-sm ${
                          index >= 6 ? "hidden sm:block" : ""
                        } ${
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
                        <div className={`relative z-10 flex h-28 flex-col justify-end p-3 sm:h-32 ${item.imageUrl ? "text-slate-50" : "text-slate-900"}`}>
                          <h4 className={`line-clamp-2 text-sm font-semibold ${item.imageUrl ? "text-slate-50" : "text-slate-900"}`}>{item.title}</h4>
                          <p className={`mt-1 text-xs ${item.imageUrl ? "text-slate-100" : "text-slate-500"}`}>{item.location}</p>
                          <p className={`mt-1 text-xs font-medium ${item.imageUrl ? "text-slate-100" : "text-slate-600"}`}>{item.priceLabel ?? "Detaylı bilgi"}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <AdsSection title="Öne Çıkan İlanlar" items={featuredAds} loading={loading} />

          <YardimlasmaSpotlight items={yardimlasmaSpotlightItems} />

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
    <section className="relative overflow-hidden bg-[#F6F7FA] py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_52%)]" aria-hidden="true" />
      <div className="app-page-container py-0">
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-[var(--color-ink)] sm:text-4xl">{title}</h2>
          {subtitle && <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--color-ink-secondary)] sm:text-base">{subtitle}</p>}
        </div>
        <FeaturedAdsCarousel items={items} loading={loading} />
      </div>
    </section>
  );
}

function FeaturedAdsCarousel({ items, loading }: { items: UnifiedAd[]; loading: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const [gap, setGap] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const didDrag = useRef(false);
  const isDragging = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mediaQuery.matches);
    sync();

    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };

    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    const updateSizes = () => {
      const firstSlide = container.querySelector<HTMLElement>("[data-featured-slide]");
      if (!firstSlide) return;
      const computed = window.getComputedStyle(container);
      const gapValue = Number.parseFloat(computed.columnGap || computed.gap || "0");
      setSlideWidth(firstSlide.getBoundingClientRect().width);
      setGap(Number.isFinite(gapValue) ? gapValue : 0);
    };

    updateSizes();
    const observer = new ResizeObserver(updateSizes);
    observer.observe(container);
    return () => observer.disconnect();
  }, [items.length]);


  const normalizedActiveIndex = items.length ? activeIndex % items.length : 0;

  const goTo = useCallback(
    (nextIndex: number) => {
      if (items.length === 0) return;
      const normalized = (nextIndex + items.length) % items.length;
      setActiveIndex(normalized);
    },
    [items.length],
  );

  const goToNext = useCallback(() => goTo(normalizedActiveIndex + 1), [normalizedActiveIndex, goTo]);
  const goToPrevious = useCallback(() => goTo(normalizedActiveIndex - 1), [normalizedActiveIndex, goTo]);

  useEffect(() => {
    if (items.length <= 1 || prefersReducedMotion || isHovered || isFocusedWithin || isUserInteracting || !isDocumentVisible) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, FEATURED_CAROUSEL_AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [isDocumentVisible, isFocusedWithin, isHovered, isUserInteracting, items.length, prefersReducedMotion]);

  const baseTranslate = (slideWidth + gap) * normalizedActiveIndex;
  const translateX = -(baseTranslate - dragOffset);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (items.length <= 1) return;
    activePointerId.current = event.pointerId;
    isDragging.current = false;
    didDrag.current = false;
    setIsUserInteracting(true);
    dragStartX.current = event.clientX;
    dragStartTime.current = performance.now();
    setDragOffset(0);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) return;

    const delta = event.clientX - dragStartX.current;
    if (!isDragging.current && Math.abs(delta) > 8) {
      isDragging.current = true;
      didDrag.current = true;
      setIsDraggingState(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (!isDragging.current) return;
    setDragOffset(delta);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) return;

    if (isDragging.current) {
      const delta = event.clientX - dragStartX.current;
      const elapsed = Math.max(1, performance.now() - dragStartTime.current);
      const velocity = Math.abs(delta / elapsed);
      const threshold = Math.max(36, slideWidth * 0.18);

      if (delta <= -threshold || (delta < -20 && velocity > 0.35)) {
        goToNext();
      } else if (delta >= threshold || (delta > 20 && velocity > 0.35)) {
        goToPrevious();
      }
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointerId.current = null;
    isDragging.current = false;
    setIsDraggingState(false);
    setDragOffset(0);
    setIsUserInteracting(false);
  };

  if (loading) {
    return <div className="h-[26rem] animate-pulse rounded-[30px] border border-[rgba(148,163,184,0.24)] bg-[#EEF1F5] md:h-[29rem]" aria-hidden="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="h-[10rem] rounded-[28px] border border-dashed border-[rgba(148,163,184,0.38)] bg-white p-6 text-center text-[var(--color-ink-secondary)] md:h-[10.5rem]">
        <div className="h-full animate-pulse rounded-2xl bg-[#EEF1F5]" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className="group relative w-full max-w-full min-w-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocusedWithin(true)}
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setIsFocusedWithin(false);
      }}
    >
      <div
        role="region"
        aria-label="Öne çıkan ilanlar karuseli"
        tabIndex={0}
        className="w-full max-w-full min-w-0 overflow-hidden rounded-[30px] border border-[rgba(148,163,184,0.3)] bg-gradient-to-b from-white via-white to-[#F8FAFC] p-2.5 shadow-[0_34px_75px_-44px_rgba(15,23,42,0.58)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] sm:p-3"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goToNext();
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goToPrevious();
          }
        }}
      >
        <div className="w-full max-w-full min-w-0 overflow-hidden rounded-[24px]">
          <div
            ref={containerRef}
            className="flex w-full max-w-full min-w-0 gap-4"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClickCapture={(event) => {
              if (!didDrag.current) return;
              event.preventDefault();
              event.stopPropagation();
              didDrag.current = false;
            }}
            style={{
              transform: `translate3d(${translateX}px, 0, 0)`,
              transition: isDraggingState || prefersReducedMotion ? "none" : `transform 720ms ${FEATURED_CAROUSEL_EASING}`,
              touchAction: "pan-y",
            }}
          >
            {items.map((item, index) => {
              const meta = CATEGORY_CONFIG[item.section];
              const isActive = index === normalizedActiveIndex;
              return (
                <Link
                  key={item.id}
                  data-featured-slide
                  href={item.href}
                  aria-label={`${item.title} ilanına git`}
                  aria-current={isActive ? "true" : undefined}
                  className="group/slide relative w-full max-w-full min-w-0 flex-[0_0_100%] overflow-hidden rounded-[24px] border border-[rgba(148,163,184,0.2)] bg-white/95 shadow-[0_22px_55px_-36px_rgba(15,23,42,0.72)] transition duration-500 hover:-translate-y-0.5 hover:shadow-[0_32px_68px_-40px_rgba(15,23,42,0.75)]"
                >
                  <div className="grid min-h-[26rem] min-w-0 md:min-h-[29rem] md:grid-cols-[1.1fr_0.9fr]">
                    <div className="relative min-h-[15rem] overflow-hidden bg-slate-950">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-700 ease-out group-hover/slide:scale-[1.04]"
                        />
                      ) : (
                        <div className={`relative h-full w-full bg-gradient-to-br ${meta.cardClass}`}>
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.55),transparent_55%)]" aria-hidden="true" />
                          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border border-white/30 bg-white/25 blur-2xl" aria-hidden="true" />
                          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(71,85,105,0.55)_1px,transparent_1px)] [background-size:12px_12px]" aria-hidden="true" />
                          <div className="relative flex h-full items-end p-6">
                            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${meta.badgeClass}`}>{meta.title}</span>
                          </div>
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/78 via-slate-900/18 to-transparent" aria-hidden="true" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 sm:p-5">
                        <div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>{meta.title}</span>
                        </div>
                        <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/95 backdrop-blur">
                          Öne Çıkan
                        </span>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-col justify-between p-5 sm:p-6 md:p-7">
                      <div className="space-y-4">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Seçkin ilan</p>
                        <h3 className="line-clamp-3 text-xl font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-2xl">{item.title}</h3>
                        <p className="flex items-center gap-2 text-sm text-slate-500 sm:text-[15px]">
                          <MapPin className="h-4 w-4" />
                          {item.location}
                        </p>
                        <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 sm:text-[15px]">
                          Bölgenizde öne çıkan bu ilanı keşfedin ve detayları inceleyin.
                        </p>
                      </div>
                      <div className="mt-6 border-t border-[rgba(148,163,184,0.24)] pt-4 sm:pt-5">
                        <p className="text-lg font-semibold tracking-[-0.01em] text-slate-900">{item.priceLabel ?? "Detaylı bilgi"}</p>
                        <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary-hover)] transition group-hover/slide:translate-x-0.5 group-hover/slide:text-[var(--color-primary)]">
                          İlan detayını görüntüle
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    style={{ opacity: isActive ? 1 : 0, transition: prefersReducedMotion ? "none" : `opacity 520ms ${FEATURED_CAROUSEL_EASING}` }}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 rounded-r-[24px] bg-gradient-to-l from-[#F7F8FA] to-transparent md:block" aria-hidden="true" />
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/75 text-slate-600 shadow-[0_12px_22px_-16px_rgba(15,23,42,0.7)] backdrop-blur-md transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] md:flex"
            aria-label="Önceki ilan"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/75 text-slate-600 shadow-[0_12px_22px_-16px_rgba(15,23,42,0.7)] backdrop-blur-md transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] md:flex"
            aria-label="Sonraki ilan"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="mt-4 flex items-center justify-center gap-2">
            {items.map((item, index) => {
              const isActive = index === normalizedActiveIndex;
              return (
                <button
                  key={`${item.id}-dot`}
                  type="button"
                  onClick={() => goTo(index)}
                  className={`group/dot relative h-2.5 rounded-full bg-slate-300/80 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    isActive ? "w-7" : "w-2.5 hover:bg-slate-400"
                  }`}
                  aria-label={`${index + 1}. ilana git`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span
                    className={`absolute inset-0 rounded-full bg-[var(--color-primary)] transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
                  />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
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
