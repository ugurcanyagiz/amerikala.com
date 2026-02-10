"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Users, MapPin, ArrowRight, Clock, Loader2 } from "lucide-react";
import Sidebar from "./components/Sidebar";
import { Button } from "./components/ui/Button";
import { useLanguage } from "./contexts/LanguageContext";
import { publicSupabase } from "@/lib/supabase/publicClient";
import type { Event, JobListing, Listing, MarketplaceListing } from "@/lib/types";

export default function Home() {
  const { t } = useLanguage();
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingEvents = async () => {
      setEventsLoading(true);
      try {
        const { data, error } = await publicSupabase
          .from("events")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;
        setTrendingEvents(data || []);
      } catch (error) {
        console.error("Error fetching trending events:", error);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchTrendingEvents();
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] overflow-x-hidden bg-[var(--color-surface)]">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          {/* Hero Section - Full-bleed visual + single CTA */}
          <section className="relative overflow-hidden border-b border-[var(--color-border-light)]">
            <div className="relative mx-auto min-h-[420px] max-w-7xl sm:min-h-[500px] lg:min-h-[620px]">
              <Image
                src="/amerikala.png"
                alt="Amerikala ana görseli"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/55" />

              <div className="relative z-10 flex min-h-[420px] flex-col justify-center px-4 py-14 sm:min-h-[500px] sm:px-10 sm:py-16 lg:min-h-[620px] lg:px-16">
                <div className="max-w-2xl">
                  <p className="mb-4 inline-flex max-w-full items-center rounded-full border border-white/35 bg-black/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/90 sm:px-4 sm:text-sm sm:tracking-[0.18em]">
                    Amerika&apos;daki Türk Topluluğu
                  </p>

                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    Emlak, İş, Alışveriş ve MeetUp fırsatları tek yerde.
                  </h1>

                  <p className="mt-5 max-w-xl text-base text-white/90 sm:text-lg">
                    Yeni şehirde hayatını hızlandır: güvenilir ilanları keşfet, sosyal çevreni büyüt, fırsatları kaçırma.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-2 text-xs font-medium text-white/95 sm:gap-3 sm:text-sm">
                    {[
                      "🏠 Yeni Evini Bul",
                      "💼 Kariyer Fırsatları",
                      "🛍️ Topluluktan Al-Sat",
                      "🤝 MeetUp ile Bağlantı Kur",
                    ].map((tagline) => (
                      <span key={tagline} className="max-w-full rounded-full border border-white/30 bg-black/25 px-3 py-1.5 backdrop-blur-[2px] [overflow-wrap:anywhere] sm:px-4 sm:py-2">
                        {tagline}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8">
                    <Link href="/register">
                      <Button variant="primary" size="lg" className="h-12 rounded-xl px-8 text-base font-semibold">
                        Hemen Katıl!
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Activity Stream Section - Jony Ive Inspired */}
          <ActivityStream />

          {/* Trending Events - Clean List */}
          <section className="py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
                  {t("home.trending.title")}
                </h2>
                <Link href="/events">
                  <Button variant="ghost" className="gap-1 text-[var(--color-ink-secondary)]">
                    {t("home.trending.viewAll")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {eventsLoading ? (
                <div className="flex items-center justify-center py-10 text-[var(--color-ink-tertiary)]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : trendingEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-border-light)] bg-[var(--color-surface)] p-10 text-center">
                  <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
                    {t("home.activityStream.emptyTitle")}
                  </h3>
                  <p className="text-sm text-[var(--color-ink-secondary)]">
                    {t("home.activityStream.emptyDescription")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trendingEvents.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* CTA Section - Simple */}
          <section className="py-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-ink)] mb-6">
                {t("home.cta.title")}
              </h2>
              <p className="text-lg text-[var(--color-ink-secondary)] mb-10">
                {t("home.cta.subtitle")}
              </p>
              <Link href="/register">
                <Button variant="primary" size="lg" className="gap-2">
                  {t("home.cta.button")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

// Sub-components

function EventRow({ event }: { event: Event }) {
  const date = new Date(event.event_date);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase();

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col items-start gap-3 rounded-xl border border-[var(--color-border-light)] p-4 transition-all duration-200 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-sunken)] sm:flex-row sm:items-center sm:gap-6"
    >
      {/* Date */}
      <div className="flex-shrink-0 w-14 text-center">
        <div className="text-xs font-medium text-[var(--color-primary)]">{month}</div>
        <div className="text-2xl font-semibold text-[var(--color-ink)]">{day}</div>
      </div>

      {/* Divider */}
      <div className="hidden h-10 w-px bg-[var(--color-border-light)] sm:block" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors truncate">
          {event.title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--color-ink-secondary)]">
          <span className="flex min-w-0 items-center gap-1 [overflow-wrap:anywhere]">
            <MapPin className="h-4 w-4" />
            {event.city}, {event.state}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {event.current_attendees} katılımcı
          </span>
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight className="h-5 w-5 self-end text-[var(--color-ink-tertiary)] transition-all group-hover:translate-x-1 group-hover:text-[var(--color-primary)] sm:self-auto" />
    </Link>
  );
}

function ActivityStream() {
  const { t } = useLanguage();
  const [category, setCategory] = useState<ActivityCategory>("all");
  const [subcategory, setSubcategory] = useState<ActivitySubcategory>("all");
  const [activityPosts, setActivityPosts] = useState<ActivityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const showSubfilters = category === "realEstate" || category === "jobs";
  const subfilterOptions = useMemo(() => {
    if (category === "realEstate") {
      return [
        { key: "all" as const, label: t("home.activityStream.subfilters.realEstate.all") },
        { key: "rent" as const, label: t("home.activityStream.subfilters.realEstate.rent") },
        { key: "sale" as const, label: t("home.activityStream.subfilters.realEstate.sale") },
        { key: "roommate" as const, label: t("home.activityStream.subfilters.realEstate.roommate") },
      ];
    }
    if (category === "jobs") {
      return [
        { key: "all" as const, label: t("home.activityStream.subfilters.jobs.all") },
        { key: "seeking_job" as const, label: t("home.activityStream.subfilters.jobs.seeking_job") },
        { key: "hiring" as const, label: t("home.activityStream.subfilters.jobs.hiring") },
      ];
    }
    return [];
  }, [category, t]);

  useEffect(() => {
    const fetchActivityPosts = async () => {
      setLoading(true);
      try {
        const [listingsResponse, jobsResponse, marketplaceResponse] = await Promise.all([
          publicSupabase
            .from("listings")
            .select("id, title, description, city, state, price, listing_type, created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(15),
          publicSupabase
            .from("job_listings")
            .select(
              "id, title, description, city, state, salary_min, salary_max, salary_type, listing_type, is_remote, created_at, job_type"
            )
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(15),
          publicSupabase
            .from("marketplace_listings")
            .select("id, title, description, city, state, price, category, created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(15),
        ]);

        if (listingsResponse.error) throw listingsResponse.error;
        if (jobsResponse.error) throw jobsResponse.error;
        if (marketplaceResponse.error) throw marketplaceResponse.error;

        const listings = (listingsResponse.data || []) as Listing[];
        const jobs = (jobsResponse.data || []) as JobListing[];
        const marketplace = (marketplaceResponse.data || []) as MarketplaceListing[];

        const mappedListings: ActivityPost[] = listings.map((listing) => ({
          id: `listing-${listing.id}`,
          category: "realEstate",
          subcategory: listing.listing_type,
          title: listing.title,
          summary: truncateText(listing.description, 90),
          location: `${listing.city}, ${listing.state}`,
          time: formatRelativeTime(listing.created_at),
          price: formatCurrency(listing.price),
          href: `/emlak/ilan/${listing.id}`,
          createdAt: listing.created_at,
        }));

        const mappedJobs: ActivityPost[] = jobs.map((job) => ({
          id: `job-${job.id}`,
          category: "jobs",
          subcategory: job.listing_type,
          title: job.title,
          summary: truncateText(job.description, 90),
          location: `${job.city}, ${job.state}`,
          time: formatRelativeTime(job.created_at),
          price: formatSalary(job.salary_min, job.salary_max, job.salary_type),
          tagLabel: job.is_remote ? t("home.activityStream.remote") : undefined,
          href: `/is/ilan/${job.id}`,
          createdAt: job.created_at,
        }));

        const mappedMarketplace: ActivityPost[] = marketplace.map((item) => ({
          id: `marketplace-${item.id}`,
          category: "marketplace",
          title: item.title,
          summary: truncateText(item.description, 90),
          location: `${item.city}, ${item.state}`,
          time: formatRelativeTime(item.created_at),
          price: formatCurrency(item.price),
          href: `/alisveris/ilan/${item.id}`,
          createdAt: item.created_at,
        }));

        const combined = [...mappedListings, ...mappedJobs, ...mappedMarketplace]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 16);

        setActivityPosts(combined);
      } catch (error) {
        console.error("Error fetching activity posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityPosts();
  }, [t]);

  const filteredPosts = useMemo(() => {
    return activityPosts.filter((post) => {
      if (category !== "all" && post.category !== category) return false;
      if (showSubfilters && subcategory !== "all" && post.subcategory !== subcategory) return false;
      return true;
    });
  }, [activityPosts, category, showSubfilters, subcategory]);

  return (
    <section className="py-20 bg-[var(--color-surface-sunken)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-ink)] mb-4">
              {t("home.activityStream.title")}
            </h2>
            <p className="text-lg text-[var(--color-ink-secondary)] max-w-2xl">
              {t("home.activityStream.subtitle")}
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          {[
            { key: "all" as const, label: t("home.activityStream.filters.all") },
            { key: "realEstate" as const, label: t("home.activityStream.filters.realEstate") },
            { key: "jobs" as const, label: t("home.activityStream.filters.jobs") },
            { key: "marketplace" as const, label: t("home.activityStream.filters.marketplace") },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => {
                setCategory(filter.key);
                setSubcategory("all");
              }}
              aria-pressed={category === filter.key}
              className={`w-full rounded-full border px-3 py-2 text-center text-sm font-medium transition-all sm:w-auto sm:px-4 ${
                category === filter.key
                  ? "bg-[var(--color-primary)] text-white border-transparent shadow-sm"
                  : "bg-[var(--color-surface)] text-[var(--color-ink-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-border)]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div
          className={`mb-10 flex flex-wrap gap-2 transition-all duration-300 ${
            showSubfilters ? "max-h-40 opacity-100 sm:max-h-20" : "max-h-0 overflow-hidden opacity-0"
          }`}
          aria-hidden={!showSubfilters}
        >
          {subfilterOptions.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setSubcategory(filter.key)}
              aria-pressed={subcategory === filter.key}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                subcategory === filter.key
                  ? "bg-[var(--color-ink)] text-white border-transparent shadow-sm"
                  : "bg-transparent text-[var(--color-ink-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-border)]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-[var(--color-ink-tertiary)]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border-light)] bg-[var(--color-surface)] p-10 text-center">
            <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              {t("home.activityStream.emptyTitle")}
            </h3>
            <p className="text-sm text-[var(--color-ink-secondary)]">
              {t("home.activityStream.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={post.href}
                className="group flex h-full min-w-0 flex-col rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-3 transition-all duration-200 hover:border-[var(--color-border)] hover:shadow-[var(--shadow-sm)] sm:rounded-2xl sm:p-4"
              >
                <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
                  <span className="truncate rounded-full bg-[var(--color-surface-sunken)] px-2 py-1 text-[10px] font-semibold tracking-wide text-[var(--color-ink)] sm:text-xs">
                    {t(`home.activityStream.categories.${post.category}`)}
                  </span>
                  <span className="shrink-0 flex items-center gap-1 text-[10px] text-[var(--color-ink-tertiary)] sm:text-xs">
                    <Clock className="h-3 w-3" />
                    {post.time}
                  </span>
                </div>

                <h3 className="mb-1 truncate text-sm font-semibold leading-snug text-[var(--color-ink)] sm:text-base">
                  {truncateText(post.title, 42)}
                </h3>
                <p className="mb-2 text-xs leading-relaxed text-[var(--color-ink-secondary)] sm:text-sm">
                  {truncateText(post.summary, 72)}
                </p>

                <div className="mt-auto space-y-1 text-[10px] text-[var(--color-ink-secondary)] sm:text-xs">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {truncateText(post.location, 28)}
                  </span>

                  <div className="flex min-w-0 flex-wrap items-center gap-1">
                    {post.price && (
                      <span className="max-w-full truncate rounded-full bg-[var(--color-surface-sunken)] px-2 py-1">
                        {truncateText(post.price, 18)}
                      </span>
                    )}
                    {post.tagLabel && (
                      <span className="max-w-full truncate rounded-full bg-[var(--color-surface-sunken)] px-2 py-1">
                        {truncateText(post.tagLabel, 16)}
                      </span>
                    )}
                  </div>
                </div>

                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] transition-all group-hover:gap-2">
                  {t(`home.activityStream.cta.${post.category}`)}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Types & Data

type ActivityCategory = "all" | "realEstate" | "jobs" | "marketplace";
type ActivitySubcategory =
  | "all"
  | "rent"
  | "sale"
  | "roommate"
  | "seeking_job"
  | "hiring";
interface ActivityPost {
  id: string;
  category: Exclude<ActivityCategory, "all">;
  subcategory?: Exclude<ActivitySubcategory, "all">;
  title: string;
  summary: string;
  location: string;
  time: string;
  price?: string;
  tagLabel?: string;
  href: string;
  createdAt: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSalary(
  min: number | null,
  max: number | null,
  type: "hourly" | "yearly" | null
) {
  if (!min && !max) return "Belirtilmemiş";
  const suffix = type === "hourly" ? "/saat" : "/yıl";
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}${suffix}`;
  if (min) return `$${min.toLocaleString()}+${suffix}`;
  if (max) return `$${max.toLocaleString()}'a kadar${suffix}`;
  return "Belirtilmemiş";
}

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  const rtf = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });

  if (minutes < 60) return rtf.format(-minutes, "minute");
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-days, "day");
}

function truncateText(text: string | null | undefined, maxLength: number) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}
