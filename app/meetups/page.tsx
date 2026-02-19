"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  Loader2,
  CalendarDays,
  Search,
  X,
} from "lucide-react";

export default function MeetupsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date_asc");
  const [quickDate, setQuickDate] = useState<"today" | "weekend" | "month" | null>(null);

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
      try {
        // Fetch upcoming events
        const eventSelectWithFk = `
            *,
            organizer:profiles!events_organizer_id_fkey (id, username, first_name, last_name, full_name, avatar_url)
          `;
        const eventSelectLegacy = `
            *,
            organizer:organizer_id (id, username, first_name, last_name, full_name, avatar_url)
          `;

        const eventResultWithFk = await supabase
          .from("events")
          .select(eventSelectWithFk)
          .eq("status", "approved")
          .gte("event_date", new Date().toISOString().split("T")[0])
          .order("event_date", { ascending: true })
          .limit(4);

        const eventResult = eventResultWithFk.error
          ? await supabase
              .from("events")
              .select(eventSelectLegacy)
              .eq("status", "approved")
              .gte("event_date", new Date().toISOString().split("T")[0])
              .order("event_date", { ascending: true })
              .limit(4)
          : eventResultWithFk;

        setUpcomingEvents((eventResult.data as Event[] | null) || []);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase(),
      weekday: date.toLocaleDateString("tr-TR", { weekday: "short" })
    };
  };

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
            <section className="mb-8">
              <Card variant="default" padding="sm">
                <CardContent className="p-0">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[150px] flex-1">
                      <label className="mb-1 block text-xs font-medium text-[var(--color-ink-secondary)]">Başlangıç tarihi</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(event) => {
                          setFromDate(event.target.value);
                          setQuickDate(null);
                        }}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]"
                      />
                    </div>

                    <div className="min-w-[150px] flex-1">
                      <label className="mb-1 block text-xs font-medium text-[var(--color-ink-secondary)]">Bitiş tarihi</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(event) => {
                          setToDate(event.target.value);
                          setQuickDate(null);
                        }}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]"
                      />
                    </div>

                    <div className="min-w-[160px] flex-1">
                      <label className="mb-1 block text-xs font-medium text-[var(--color-ink-secondary)]">Şehir</label>
                      <select
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]"
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
                      <label className="mb-1 block text-xs font-medium text-[var(--color-ink-secondary)]">Etkinlik ara</label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-tertiary)]" />
                        <input
                          type="text"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Başlık içinde ara..."
                          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-ink)]"
                        />
                      </div>
                    </div>

                    <div className="min-w-[150px] sm:w-[170px]">
                      <label className="mb-1 block text-xs font-medium text-[var(--color-ink-secondary)]">Sıralama</label>
                      <select
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]"
                      >
                        <option value="date_asc">Tarih (Yakın)</option>
                        <option value="date_desc">Tarih (Uzak)</option>
                      </select>
                    </div>

                    <Button variant="ghost" size="sm" className="gap-1" onClick={clearFilters}>
                      <X className="h-4 w-4" />
                      Temizle
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[var(--color-ink-secondary)]">Hızlı tarih:</span>
                    <Button
                      variant={quickDate === "today" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => applyQuickDate("today")}
                    >
                      Today
                    </Button>
                    <Button
                      variant={quickDate === "weekend" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => applyQuickDate("weekend")}
                    >
                      This Weekend
                    </Button>
                    <Button
                      variant={quickDate === "month" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => applyQuickDate("month")}
                    >
                      This Month
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Upcoming Events Section */}
            <section className="mb-12">
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
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <Card variant="default" padding="md">
                    <CardContent className="p-0 text-center py-8">
                      <CalendarDays className="h-10 w-10 text-[var(--color-ink-tertiary)] mx-auto mb-3" />
                      <p className="text-[var(--color-ink-secondary)]">Yaklaşan etkinlik bulunmuyor</p>
                      <Link href="/meetups/create">
                        <Button variant="outline" size="sm" className="mt-4">
                          İlk Etkinliği Oluştur
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map(event => {
                      const date = formatDate(event.event_date);

                      return (
                        <Link key={event.id} href={`/meetups/${event.id}`}>
                          <Card variant="interactive" padding="sm">
                            <CardContent className="p-0">
                              <div className="flex items-center gap-4">
                                {/* Date */}
                                <div className="flex-shrink-0 w-12 text-center">
                                  <div className="text-xs font-medium text-[var(--color-primary)]">{date.month}</div>
                                  <div className="text-xl font-semibold text-[var(--color-ink)]">{date.day}</div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${EVENT_CATEGORY_COLORS[event.category]}`}>
                                    {EVENT_CATEGORY_ICONS[event.category]}
                                  </span>
                                  <h3 className="font-medium text-[var(--color-ink)] line-clamp-1">
                                    {event.title}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-ink-secondary)]">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTime(event.start_time)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      {event.is_online ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                      {event.is_online ? "Online" : event.city}
                                    </span>
                                    <span className="flex items-center gap-1 truncate">
                                      <Users className="h-3 w-3" />
                                      {resolveDisplayName(event.organizer)}
                                    </span>
                                  </div>
                                </div>

                                <ChevronRight className="h-5 w-5 text-[var(--color-ink-tertiary)]" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
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
