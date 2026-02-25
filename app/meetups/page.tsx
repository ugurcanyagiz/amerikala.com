"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import {
  Event,
  EVENT_CATEGORY_ICONS,
  EVENT_CATEGORY_COLORS,
} from "@/lib/types";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import {
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Globe,
  CalendarDays,
  Search,
  X,
  Grid,
  List,
} from "lucide-react";

export default function MeetupsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date_asc");
  const [quickDate, setQuickDate] = useState<"today" | "weekend" | "month" | null>(null);
  const [filterViewMode, setFilterViewMode] = useState<"grid" | "list">("grid");

  const cityOptions = useMemo(() => {
    return Array.from(new Set(upcomingEvents.map((event) => event.city).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "tr")
    );
  }, [upcomingEvents]);

  const applyQuickDate = (range: "today" | "weekend" | "month") => {
    const now = new Date();
    const format = (date: Date) => date.toISOString().split("T")[0];

    if (range === "today") {
      const today = format(now);
      setFromDate(today);
      setToDate(today);
    }

    if (range === "weekend") {
      const day = now.getDay();
      const daysUntilSaturday = (6 - day + 7) % 7;
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + daysUntilSaturday);
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      setFromDate(format(saturday));
      setToDate(format(sunday));
    }

    if (range === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFromDate(format(firstDay));
      setToDate(format(lastDay));
    }

    setQuickDate(range);
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setCity("");
    setSearch("");
    setSort("date_asc");
    setQuickDate(null);
  };

  const hasActiveFilters = Boolean(
    fromDate || toDate || city || search.trim() || sort !== "date_asc"
  );

  const resolveDisplayName = (profile?: {
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
  } | null) => {
    if (!profile) return "Anonim";
    const full = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
    return full || profile.username || profile.full_name || "Anonim";
  };

  const formatTime = (time?: string | null) => {
    if (!time) return "Saat belirtilmedi";
    return time.slice(0, 5);
  };

  useEffect(() => {
    setFromDate(searchParams.get("from") || "");
    setToDate(searchParams.get("to") || "");
    setCity(searchParams.get("city") || "");
    setSearch(searchParams.get("q") || "");
    setSort(searchParams.get("sort") || "date_asc");
    setQuickDate(null);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    const syncParam = (key: string, value: string, defaultValue = "") => {
      if (!value || value === defaultValue) {
        params.delete(key);
        return;
      }
      params.set(key, value);
    };

    syncParam("city", city);
    syncParam("from", fromDate);
    syncParam("to", toDate);
    syncParam("q", search);
    syncParam("sort", sort, "date_asc");

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [city, fromDate, pathname, router, search, searchParams, sort, toDate]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const eventSelectWithFk = `
            *,
            organizer:profiles!events_organizer_id_fkey (id, username, first_name, last_name, full_name, avatar_url)
          `;
        const eventSelectLegacy = `
            *,
            organizer:organizer_id (id, username, first_name, last_name, full_name, avatar_url)
          `;

        const buildEventQuery = (selectClause: string) => {
          let filteredQuery = supabase
            .from("events")
            .select(selectClause)
            .eq("status", "approved");

          if (city) {
            filteredQuery = filteredQuery.ilike("city", `%${city}%`);
          }

          if (fromDate) {
            filteredQuery = filteredQuery.gte("event_date", fromDate);
          } else {
            filteredQuery = filteredQuery.gte("event_date", new Date().toISOString().split("T")[0]);
          }

          if (toDate) {
            filteredQuery = filteredQuery.lte("event_date", toDate);
          }

          if (search.trim()) {
            filteredQuery = filteredQuery.ilike("title", `%${search.trim()}%`);
          }

          if (sort === "date_desc") {
            filteredQuery = filteredQuery.order("event_date", { ascending: false });
          } else if (sort === "newest") {
            filteredQuery = filteredQuery.order("created_at", { ascending: false });
          } else {
            filteredQuery = filteredQuery.order("event_date", { ascending: true });
          }

          return filteredQuery.limit(24);
        };

        const eventResultWithFk = await buildEventQuery(eventSelectWithFk);

        const eventResult = eventResultWithFk.error
          ? await buildEventQuery(eventSelectLegacy)
          : eventResultWithFk;

        if (eventResult.error) {
          throw eventResult.error;
        }

        setUpcomingEvents((eventResult.data as unknown as Event[] | null) || []);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching data:", error);
        }
        setUpcomingEvents([]);
        setErrorMessage("Etkinlikler yüklenemedi. Lütfen kısa bir süre sonra tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [city, fromDate, search, sort, toDate]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-surface)]">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="ak-shell lg:px-8 py-10">
            {/* Hero Section - Clean & Minimal */}
            <section className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-ink)] mb-4">
                Etkinlikleri Keşfet, Buluşmalara Katıl
              </h1>
              <p className="text-lg text-[var(--color-ink-secondary)] max-w-2xl mx-auto mb-6">
                Amerika&apos;daki Türk topluluğunun etkinliklerini keşfet, katıl ve yeni
                insanlarla bağlantı kur.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Link href="/meetups/create">
                  <Button variant="primary" size="lg" className="gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Etkinlik Oluştur
                  </Button>
                </Link>
                <Link href="/groups">
                  <Button variant="primary" size="lg">
                    Gruplar
                  </Button>
                </Link>
              </div>
            </section>

            {/* Filter Bar */}
            <section className="mb-10 max-w-6xl mx-auto">
              <Card className="glass">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="min-w-[150px] flex-1">
                      <label htmlFor="meetups-from-date" className="mb-1 block text-xs font-medium text-[var(--color-ink-secondary)]">Başlangıç tarihi</label>
                      <input
                        type="date"
                        id="meetups-from-date"
                        aria-label="Başlangıç tarihi"
                        value={fromDate}
                        onChange={(event) => {
                          setFromDate(event.target.value);
                          setQuickDate(null);
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="min-w-[150px] flex-1">
                      <label htmlFor="meetups-to-date" className="mb-1 block text-xs font-medium text-[var(--color-ink-secondary)]">Bitiş tarihi</label>
                      <input
                        type="date"
                        id="meetups-to-date"
                        aria-label="Bitiş tarihi"
                        value={toDate}
                        onChange={(event) => {
                          setToDate(event.target.value);
                          setQuickDate(null);
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="min-w-[160px] flex-1">
                      <label htmlFor="meetups-city" className="mb-1 block text-xs font-medium text-[var(--color-ink-secondary)]">Şehir</label>
                      <select
                        id="meetups-city"
                        aria-label="Şehir filtresi"
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Tüm şehirler</option>
                        {cityOptions.map((cityOption) => (
                          <option key={cityOption} value={cityOption}>
                            {cityOption}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="min-w-[200px] flex-[1.2]">
                      <label htmlFor="meetups-search" className="mb-1 block text-xs font-medium text-[var(--color-ink-secondary)]">Etkinlik ara</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          id="meetups-search"
                          aria-label="Etkinlik başlığında ara"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Başlık içinde ara..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="min-w-[150px] sm:w-[170px]">
                      <label htmlFor="meetups-sort" className="mb-1 block text-xs font-medium text-[var(--color-ink-secondary)]">Sıralama</label>
                      <select
                        id="meetups-sort"
                        aria-label="Sıralama"
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="date_asc">Tarih (Yakın)</option>
                        <option value="date_desc">Tarih (Uzak)</option>
                        <option value="newest">Yeni Eklenenler</option>
                      </select>
                    </div>

                    <Button variant="outline" size="sm" className="gap-1 h-[42px] self-end" onClick={clearFilters} aria-label="Filtreleri temizle">
                      <X className="h-4 w-4" />
                      Temizle
                    </Button>

                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 self-end">
                      <button
                        type="button"
                        onClick={() => setFilterViewMode("grid")}
                        aria-label="Grid görünümü"
                        className={`p-2 rounded-md transition-colors ${
                          filterViewMode === "grid"
                            ? "bg-white dark:bg-neutral-700 shadow-sm"
                            : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        }`}
                      >
                        <Grid size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterViewMode("list")}
                        aria-label="Liste görünümü"
                        className={`p-2 rounded-md transition-colors ${
                          filterViewMode === "list"
                            ? "bg-white dark:bg-neutral-700 shadow-sm"
                            : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        }`}
                      >
                        <List size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 items-center">
                    <span className="text-xs text-[var(--color-ink-secondary)] mr-1">Hızlı tarih:</span>
                    <button
                      type="button"
                      onClick={() => applyQuickDate("today")}
                      aria-label="Bugün için hızlı tarih filtresi"
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        quickDate === "today"
                          ? "bg-blue-500 text-white"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickDate("weekend")}
                      aria-label="Bu hafta sonu için hızlı tarih filtresi"
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        quickDate === "weekend"
                          ? "bg-blue-500 text-white"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      This Weekend
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickDate("month")}
                      aria-label="Bu ay için hızlı tarih filtresi"
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        quickDate === "month"
                          ? "bg-blue-500 text-white"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      This Month
                    </button>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Upcoming Events Section */}
            <section className="mb-12 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[var(--color-ink)]">
                    Yaklaşan Etkinlikler
                  </h2>
                  <Link href="/meetups">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Tümü
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Card key={index} variant="default" padding="none" className="overflow-hidden bg-white border-black/10 shadow-sm rounded-2xl">
                        <div className="h-48 animate-pulse bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100" />
                        <CardContent className="p-4 space-y-3">
                          <div className="h-4 w-24 rounded bg-neutral-200 animate-pulse" />
                          <div className="h-5 w-3/4 rounded bg-neutral-200 animate-pulse" />
                          <div className="h-3 w-2/3 rounded bg-neutral-200 animate-pulse" />
                          <div className="h-3 w-1/2 rounded bg-neutral-200 animate-pulse" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : errorMessage ? (
                  <Card variant="default" padding="md" className="bg-white border-black/10 shadow-sm rounded-2xl">
                    <CardContent className="p-0 text-center py-8">
                      <p className="text-[var(--color-ink-secondary)]">{errorMessage}</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                        Tekrar Dene
                      </Button>
                    </CardContent>
                  </Card>
                ) : upcomingEvents.length === 0 ? (
                  <Card variant="default" padding="md" className="bg-white border-black/10 shadow-sm rounded-2xl">
                    <CardContent className="p-0 text-center py-9">
                      <CalendarDays className="h-10 w-10 text-[var(--color-ink-tertiary)] mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                        {hasActiveFilters ? "Sonuç bulunamadı" : "Yaklaşan etkinlik bulunmuyor"}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--color-ink-secondary)]">
                        {hasActiveFilters
                          ? "Filtreleri güncelleyerek yeniden deneyebilir veya temizleyebilirsiniz."
                          : "Henüz gösterilecek etkinlik yok. İlk etkinliği sen oluşturabilirsin."}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                        {hasActiveFilters && (
                          <Button variant="outline" size="sm" onClick={clearFilters}>
                            Filtreleri Temizle
                          </Button>
                        )}
                        <Link href="/meetups/create">
                          <Button variant="primary" size="sm">
                            Etkinlik Oluştur
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {upcomingEvents.map((event) => (
                      <Link key={event.id} href={`/meetups/${event.id}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 rounded-2xl">
                        <Card
                          variant="interactive"
                          padding="none"
                          className="h-full overflow-hidden hover:scale-[1.01] bg-white border-black/10 shadow-sm rounded-2xl"
                        >
                          <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200">
                            {event.cover_image_url ? (
                              <Image
                                src={event.cover_image_url}
                                alt={event.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                <span className="text-4xl opacity-80">{EVENT_CATEGORY_ICONS[event.category]}</span>
                              </div>
                            )}
                          </div>

                          <CardContent className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${EVENT_CATEGORY_COLORS[event.category]}`}>
                              {EVENT_CATEGORY_ICONS[event.category]}
                            </span>

                            <h3 className="font-semibold text-[var(--color-ink)] line-clamp-2 mb-2 min-h-[2.75rem]">
                              {event.title}
                            </h3>

                            <div className="space-y-2 text-sm text-[var(--color-ink-secondary)]">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{event.event_date} • {formatTime(event.start_time)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {event.is_online ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                <span>{event.is_online ? "Online" : event.city}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="truncate">{resolveDisplayName(event.organizer)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
            </section>

            {/* CTA for logged-in users */}
            {user && (
              <section className="mt-16">
                <Card variant="default" padding="md" className="bg-[var(--color-surface-sunken)]">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[var(--color-ink)]">Topluluğa Katkıda Bulun</h3>
                        <p className="text-sm text-[var(--color-ink-secondary)]">
                          Etkinlik veya grup oluşturarak topluluğu büyüt
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Link href="/meetups/my-events">
                          <Button variant="outline" size="sm">
                            Etkinliklerim
                          </Button>
                        </Link>
                        <Link href="/groups">
                          <Button variant="primary" size="sm">
                            Grupları Keşfet
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
