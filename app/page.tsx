"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, BriefcaseBusiness, CalendarDays, MapPin, Search, ShoppingBag } from "lucide-react";
import Sidebar from "./components/Sidebar";
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
  { id: "realEstate", label: "Emlak", description: "Ev, oda veya arsa ilanı ver", href: "/emlak/ilan-ver" },
  { id: "jobs", label: "İş", description: "İş arayan veya işveren ilanı oluştur", href: "/is/ilan-ver" },
  { id: "marketplace", label: "Alışveriş", description: "Ürün alım-satım ilanı paylaş", href: "/alisveris/ilan-ver" },
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

const CATEGORY_CONFIG: Record<
  HomeCategoryKey,
  {
    title: string;
    href: string;
    icon: typeof Building2;
    description: string;
    gradient: string;
  }
> = {
  events: {
    title: "Etkinlikler",
    href: "/meetups",
    icon: CalendarDays,
    description: "Yaklaşan buluşmalar ve sosyal etkinlikler",
    gradient: "from-sky-50 to-blue-100",
  },
  realEstate: {
    title: "Emlak",
    href: "/emlak",
    icon: Building2,
    description: "Kiralık, satılık ve oda paylaşımları",
    gradient: "from-indigo-50 to-blue-100",
  },
  jobs: {
    title: "İş",
    href: "/is",
    icon: BriefcaseBusiness,
    description: "İş fırsatları ve kariyer ilanları",
    gradient: "from-violet-50 to-indigo-100",
  },
  marketplace: {
    title: "Alışveriş",
    href: "/alisveris",
    icon: ShoppingBag,
    description: "Topluluk içinde güvenli alım-satım",
    gradient: "from-amber-50 to-orange-100",
  },
};

const CITY_CHIPS = [
  { label: "New York", href: "/search?q=new+york" },
  { label: "New Jersey", href: "/search?q=new+jersey" },
  { label: "Florida", href: "/search?q=florida" },
  { label: "California", href: "/search?q=california" },
  { label: "Texas", href: "/search?q=texas" },
];

export default function Home() {
  const INITIAL_LATEST_ITEMS = 40;
  const router = useRouter();
  const { user } = useAuth();
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const [ads, setAds] = useState<UnifiedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isPostListingModalOpen, setIsPostListingModalOpen] = useState(false);
  const [latestAdsCategoryFilter, setLatestAdsCategoryFilter] = useState<"all" | HomeCategoryKey>("all");
  const [yardimlasmaSpotlightItems, setYardimlasmaSpotlightItems] = useState<YardimlasmaSpotlightItem[]>([]);

  const isAbortLikeError = (error: unknown) => {
    if (!error) return false;
    if (error instanceof DOMException) {
      return error.name === "AbortError" || error.name === "TimeoutError";
    }
    return typeof error === "object" && `${(error as { message?: string }).message || ""}`.toLowerCase().includes("abort");
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

  const fetchHomepageData = useCallback(async (latestLimit: number) => {
    const today = new Date().toISOString().split("T")[0];
    devLog("home", "fetch:start", { latestLimit });
    setLoading(true);

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

      setYardimlasmaSpotlightItems(
        (yardimlasmaRes.data ?? [])
          .map((post) => ({
            id: post.id,
            category: post.category || "Diğer",
            excerpt: createExcerpt(post.title, post.body),
            location: post.location_text,
            createdAt: post.created_at,
            href: `/yardimlasma?post=${post.id}`,
          }))
          .filter((post) => Boolean(post.id) && Boolean(post.excerpt)),
      );

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

      setAds(unified);
    } catch (error) {
      if (!isAbortLikeError(error)) {
        console.error("Homepage fetch error", error);
      }
    } finally {
      setLoading(false);
      devLog("home", "fetch:end", { latestLimit });
    }
  }, []);

  useEffect(() => {
    fetchHomepageData(INITIAL_LATEST_ITEMS);
  }, [fetchHomepageData]);

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
        const merged: SearchSuggestion[] = (await searchSiteContent(normalizedQuery, 6))
          .map((item) => ({
            id: item.id,
            title: item.title,
            location: item.subtitle,
            href: item.href,
            section: SEARCH_TYPE_TO_SECTION[item.type] || "events",
          }))
          .slice(0, 8);
        setSuggestions(merged);
        setSearchOpen(true);
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

    router.push(`/search?q=${encodeURIComponent(normalizedQuery)}`);
    setSearchOpen(false);
  };

  const handlePostListingCategorySelect = (href: string) => {
    setIsPostListingModalOpen(false);
    router.push(href);
  };

  const featuredAds = useMemo(() => ads.slice(0, 6), [ads]);
  const pulseFeed = useMemo(() => ads.slice(0, 5), [ads]);
  const conversionShowcase = useMemo(() => ads.slice(0, 3), [ads]);
  const latestFilteredAds = useMemo(
    () => (latestAdsCategoryFilter === "all" ? ads : ads.filter((item) => item.section === latestAdsCategoryFilter)),
    [ads, latestAdsCategoryFilter],
  );

  return (
    <div className="bg-slate-50 text-slate-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <section className="relative isolate overflow-hidden px-4 pb-20 pt-12 sm:px-6 lg:px-10 lg:pt-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.22),transparent_40%),radial-gradient(circle_at_88%_12%,rgba(239,68,68,0.15),transparent_34%),radial-gradient(circle_at_50%_86%,rgba(251,146,60,0.17),transparent_38%),linear-gradient(170deg,#eff6ff_0%,#f8fafc_52%,#eef2ff_100%)]" />
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(120deg,rgba(37,99,235,0.08)_0,rgba(37,99,235,0.08)_1px,transparent_1px,transparent_22px),linear-gradient(to_right,rgba(220,38,38,0.06)_0,rgba(220,38,38,0.06)_1px,transparent_1px,transparent_22px)] [background-size:24px_24px]" />
            <div className="pointer-events-none absolute -left-10 top-20 h-56 w-56 rounded-full bg-white/70 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-12 h-72 w-72 rounded-full bg-blue-100/80 blur-3xl" />
            <div className="relative mx-auto max-w-7xl">
              <div className="grid gap-8 rounded-[36px] border border-blue-100 bg-white/85 p-6 shadow-[0_50px_100px_-60px_rgba(14,116,255,0.45)] backdrop-blur-xl lg:grid-cols-12 lg:p-10">
                <div className="lg:col-span-8">
                  <p className="mb-5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Türk - Amerikan Topluluğu</p>
                  <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Amerika’daki Türk topluluğunun buluşma noktası
                  </h1>
                  <p className="mt-5 max-w-3xl text-base text-slate-700 sm:text-lg">
                  Etkinlik ara, iş bul, ev keşfet, topluluğundan destek al. Amerikala’da her gün yeni bağlantılar, fırsatlar ve paylaşımlar seni bekliyor.
                  </p>

                  <div ref={searchBoxRef} className="relative mt-8 max-w-4xl">
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg sm:flex-row sm:items-center">
                      <div className="flex flex-1 items-center gap-3 px-2">
                        <Search className="h-5 w-5 text-slate-400" />
                        <input
                          value={searchQuery}
                          onChange={(event) => {
                            setSearchQuery(event.target.value);
                            setSearchOpen(true);
                          }}
                          onFocus={() => setSearchOpen(true)}
                          onKeyDown={(event) => {
                            if (event.key === "ArrowDown" && suggestions.length) {
                              event.preventDefault();
                              setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
                            }
                            if (event.key === "ArrowUp" && suggestions.length) {
                              event.preventDefault();
                              setActiveSuggestionIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                            }
                            if (event.key === "Enter") {
                              event.preventDefault();
                              onSearchSubmit();
                            }
                          }}
                          className="h-12 w-full border-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                          placeholder="Etkinlik ara, iş bul, ev ara, grup keşfet..."
                          aria-label="Site içi arama"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={onSearchSubmit}
                        className="h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-8 font-semibold text-slate-950 transition hover:brightness-110"
                      >
                        {searching ? "Aranıyor..." : "Keşfet"}
                      </button>
                    </div>

                    {searchOpen && searchQuery.trim().length >= 2 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                        {searching ? (
                          <p className="px-4 py-3 text-sm text-slate-500">Uygun sonuçlar aranıyor...</p>
                        ) : suggestions.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-slate-500">Sonuç bulunamadı. Farklı bir arama deneyin.</p>
                        ) : (
                          <ul className="max-h-80 overflow-y-auto py-1">
                            {suggestions.map((item, index) => (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  className={`flex w-full items-center justify-between px-4 py-3 text-left ${index === activeSuggestionIndex ? "bg-blue-50" : "hover:bg-slate-50"}`}
                                  onClick={() => {
                                    router.push(item.href);
                                    setSearchOpen(false);
                                  }}
                                >
                                  <span>
                                    <span className="block text-sm font-semibold text-slate-800">{item.title}</span>
                                    <span className="block text-xs text-slate-500">{item.location}</span>
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{CATEGORY_CONFIG[item.section].title}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link href="#popular-listings">
                      <Button className="rounded-xl bg-white px-7 text-slate-900 hover:bg-slate-100">Keşfet</Button>
                    </Link>
                    {user ? (
                      <Button className="rounded-xl bg-orange-500 px-7 text-white hover:bg-orange-600" onClick={() => setIsPostListingModalOpen(true)}>
                        Paylaşım Yap
                      </Button>
                    ) : (
                      <Link href="/login">
                        <Button className="rounded-xl bg-orange-500 px-7 text-white hover:bg-orange-600">Paylaşım Yap</Button>
                      </Link>
                    )}
                    <Link href="/feed" className="rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                      Topluluk Akışı
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-4">
                  <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-white to-blue-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Canlı Topluluk Nabzı</p>
                    <div className="mt-4 space-y-3">
                      {pulseFeed.slice(0, 4).map((item, index) => (
                        <Link key={`pulse-${item.id}`} href={item.href} className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
                          <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{index + 1}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">{item.title}</span>
                            <span className="mt-0.5 block text-xs text-slate-600">{item.location}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-[linear-gradient(to_bottom,#eff6ff_0%,#f8fafc_28%,#f1f5f9_100%)]">
            <section className="px-4 pb-14 pt-8 sm:px-6 lg:px-10">
              <SectionHeader title="Katılım Alanları" subtitle="Keşiften etkileşime, etkileşimden topluluk üretimine geç." />
              <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-12">
                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8">
                  <h3 className="text-xl font-black text-slate-900">Nereden başlamak istersin?</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {(Object.keys(CATEGORY_CONFIG) as HomeCategoryKey[]).map((key) => {
                      const config = CATEGORY_CONFIG[key];
                      const Icon = config.icon;
                      return (
                        <Link key={key} href={config.href} className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${config.gradient} p-5 shadow-sm transition hover:-translate-y-0.5`}>
                          <div className="inline-flex rounded-xl bg-white p-2 text-blue-700 shadow-sm"><Icon className="h-5 w-5" /></div>
                          <h3 className="mt-3 text-lg font-bold text-slate-900">{config.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">{config.description}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-[30px] border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-6 shadow-sm lg:col-span-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.17em] text-blue-700">Dönüşüm Anı</p>
                  <h3 className="mt-2 text-xl font-black text-slate-900">Topluluk ekonomisine hemen katıl</h3>
                  <div className="mt-4 space-y-3">
                    {conversionShowcase.map((item) => (
                      <Link key={`convert-${item.id}`} href={item.href} className="block rounded-xl border border-blue-100 bg-white p-3 hover:border-blue-300">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.location}</p>
                      </Link>
                    ))}
                  </div>
                  <Link href="/register" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    Hemen Üye Ol <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>

            <section className="px-4 pb-14 pt-14 sm:px-6 lg:px-10">
              <SectionHeader title="Bu Hafta Toplulukta Neler Var?" subtitle="Güven, hareket ve sosyal bağların güçlendiği canlı merkez." />
              <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-12">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm lg:col-span-7">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50 to-indigo-50 px-6 py-4">
                    <h3 className="text-lg font-black text-slate-900">Öne Çıkan Tartışmalar ve Etkinlikler</h3>
                  </div>
                  <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {featuredAds.slice(0, 4).map((item) => (
                      <AdCard key={`weekly-${item.id}`} item={item} compact />
                    ))}
                  </div>
                </div>
                <div className="space-y-4 lg:col-span-5">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900">Şehrine Göre Keşfet</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {CITY_CHIPS.map((city) => (
                        <Link key={city.label} href={city.href} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                          {city.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-rose-50 p-5 text-slate-900 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900">Toplulukta Yardımlaşma Canlı</h3>
                    <p className="mt-1 text-sm text-slate-600">Gerçek sorular, gerçek destek, hızlı geri dönüşler.</p>
                    <div className="mt-4 space-y-2">
                      {yardimlasmaSpotlightItems.slice(0, 3).map((item) => (
                        <Link key={item.id} href={item.href} className="block rounded-xl border border-blue-100 bg-white p-3 text-sm transition hover:border-blue-200 hover:bg-blue-50/40">
                          <p className="font-semibold text-slate-900">{item.excerpt}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.location || "ABD geneli"}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="popular-listings" className="px-4 pb-14 sm:px-6 lg:px-10">
              <SectionHeader title="Topluluk Pazarında Öne Çıkanlar" subtitle="İlanlar artık sadece katalog değil; aktif topluluk ekonomisinin vitrini." />
              <div className="mx-auto max-w-7xl">
                <div className="mb-4 flex flex-wrap gap-2">
                  <FilterButton active={latestAdsCategoryFilter === "all"} onClick={() => setLatestAdsCategoryFilter("all")}>Tümü</FilterButton>
                  {(Object.keys(CATEGORY_CONFIG) as HomeCategoryKey[]).map((key) => (
                    <FilterButton key={key} active={latestAdsCategoryFilter === key} onClick={() => setLatestAdsCategoryFilter(key)}>
                      {CATEGORY_CONFIG[key].title}
                    </FilterButton>
                  ))}
                </div>
                <AdsGrid items={latestFilteredAds} loading={loading} />
              </div>
            </section>

            <YardimlasmaSpotlight items={yardimlasmaSpotlightItems} />

            <section className="px-4 pb-16 sm:px-6 lg:px-10">
              <div className="mx-auto max-w-7xl rounded-[34px] border border-blue-200 bg-gradient-to-r from-blue-600 to-sky-500 p-8 text-white shadow-[0_40px_80px_-40px_rgba(37,99,235,0.9)] sm:p-10">
                <h2 className="text-3xl font-black sm:text-4xl">Amerikala’ya Katıl, Topluluğunu Büyüt</h2>
                <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">Ücretsiz hesap oluştur, ilan paylaş, etkinliklere katıl ve Amerika’daki Türk topluluğunun canlı parçası ol.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/register" className="rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 transition hover:bg-blue-50">Ücretsiz Katıl</Link>
                  <Link href="/feed" className="rounded-xl border border-white/70 px-6 py-3 font-semibold text-white transition hover:bg-white/10">Topluluk Akışını Gör</Link>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <Modal
        open={isPostListingModalOpen}
        onClose={() => setIsPostListingModalOpen(false)}
        title="Hangi kategoride paylaşım yapmak istiyorsunuz?"
        description="Devam etmek için bir kategori seçin."
        size="sm"
      >
        <div className="space-y-3">
          {POST_LISTING_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handlePostListingCategorySelect(category.href)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="text-sm font-semibold text-slate-900">{category.label}</p>
              <p className="mt-1 text-xs text-slate-500">{category.description}</p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto mb-6 max-w-7xl">
      <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <p className="mt-1 text-sm text-slate-600 sm:text-base">{subtitle}</p>
    </div>
  );
}

function FilterButton({ children, active, onClick }: { children: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-blue-600 text-white" : "bg-white text-slate-700 border border-slate-200 hover:border-blue-200 hover:text-blue-700"}`}
    >
      {children}
    </button>
  );
}

function AdsGrid({ items, loading }: { items: UnifiedAd[]; loading: boolean }) {
  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">İlanlar yükleniyor...</div>;
  }

  if (!items.length) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Henüz ilan bulunmuyor.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
      {items.map((item, index) => (
        <div key={item.id} className={index % 5 === 0 ? "xl:col-span-8" : "xl:col-span-4"}>
          <AdCard item={item} compact={index % 5 !== 0} />
        </div>
      ))}
    </div>
  );
}

function AdCard({ item, compact = false }: { item: UnifiedAd; compact?: boolean }) {
  return (
    <Link href={item.href} className="group block overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className={`relative ${compact ? "h-44" : "h-56"} bg-slate-100`}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-slate-400">İlan Görseli</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-slate-700 shadow">{labelForSection(item.section)}</span>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900">{item.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" /> {item.location}</p>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">{item.priceLabel || "Detaylı bilgi"}</span>
          <span className="text-slate-500">{timeAgo(item.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function labelForSection(section: HomeCategoryKey) {
  return section === "realEstate" ? "Emlak" : section === "jobs" ? "İş" : section === "marketplace" ? "Alışveriş" : "Etkinlik";
}

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "Fiyat belirtilmedi";
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatSalaryRange(min?: number | null, max?: number | null) {
  if (!min && !max) return "Maaş belirtilmedi";
  if (min && max) return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  return `${formatCurrency(min || max)}+`;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.max(1, Math.floor(diff / (1000 * 60 * 60)));
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  const months = Math.floor(days / 30);
  return `${months} ay önce`;
}
