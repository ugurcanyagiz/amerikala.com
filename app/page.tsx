"use client";

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
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-surface)]">
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
                <source src="/back3.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                {/* Tagline */}
                <p className="text-sm font-medium text-[var(--color-primary)] tracking-wide uppercase mb-4">
                  {t("home.hero.badge")}
                </p>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[var(--color-ink)] leading-[1.1] mb-6">
                  {t("home.hero.title")}
                </h1>

                {/* Subtitle */}
                <p className="text-lg sm:text-xl text-[var(--color-ink-secondary)] leading-relaxed mb-10 max-w-2xl mx-auto">
                  {t("home.hero.subtitle")}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link href="/meetups">
                    <Button variant="primary" size="lg" className="gap-2">
                      {t("home.hero.cta1")}
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/groups">
                    <Button variant="outline" size="lg" className="gap-2">
                      {t("home.hero.cta2")}
                    </Button>
                  </Link>
                </div>

                {/* Stats - Inline, Minimal */}
                <div className="flex items-center justify-center gap-8 sm:gap-12 mt-16 pt-16 border-t border-[var(--color-border-light)]">
                  <Stat number="2,500+" label={t("home.stats.members")} />
                  <Stat number="150+" label={t("home.stats.events")} />
                  <Stat number="45" label={t("home.stats.cities")} />
                  <Stat number="80+" label={t("home.stats.groups")} />
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

          {/* Testimonials - Single Quote */}
          <section className="py-20 bg-[var(--color-surface-sunken)]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--color-ink)] mb-12">
                {t("home.testimonials.title")}
              </h2>

              <blockquote className="relative">
                <p className="text-xl sm:text-2xl text-[var(--color-ink)] leading-relaxed mb-8">
                  &ldquo;{TESTIMONIALS[0].text}&rdquo;
                </p>
                <footer className="flex items-center justify-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
                    <span className="text-[var(--color-primary)] font-medium">
                      {TESTIMONIALS[0].name.charAt(0)}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[var(--color-ink)]">{TESTIMONIALS[0].name}</p>
                    <p className="text-sm text-[var(--color-ink-secondary)]">{TESTIMONIALS[0].location}</p>
                  </div>
                </footer>
              </blockquote>
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

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)]">{number}</div>
      <div className="text-sm text-[var(--color-ink-secondary)] mt-1">{label}</div>
    </div>
  );
}

function EventRow({ event }: { event: Event }) {
  const date = new Date(event.event_date);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase();

  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-center gap-6 p-4 rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-sunken)] transition-all duration-200 group"
    >
      {/* Date */}
      <div className="flex-shrink-0 w-14 text-center">
        <div className="text-xs font-medium text-[var(--color-primary)]">{month}</div>
        <div className="text-2xl font-semibold text-[var(--color-ink)]">{day}</div>
      </div>

      {/* Divider */}
      <div className="h-10 w-px bg-[var(--color-border-light)]" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors truncate">
          {event.title}
        </h3>
        <div className="flex items-center gap-4 mt-1 text-sm text-[var(--color-ink-secondary)]">
          <span className="flex items-center gap-1">
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
      <ArrowRight className="h-5 w-5 text-[var(--color-ink-tertiary)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

function ActivityStream() {
  const { t } = useLanguage();
  const [view, setView] = useState<ActivityView>("grid");
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
          summary: truncateText(listing.description, 140),
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
          summary: truncateText(job.description, 140),
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
          summary: truncateText(item.description, 140),
          location: `${item.city}, ${item.state}`,
          time: formatRelativeTime(item.created_at),
          price: formatCurrency(item.price),
          href: `/alisveris/ilan/${item.id}`,
          createdAt: item.created_at,
        }));

        const combined = [...mappedListings, ...mappedJobs, ...mappedMarketplace]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 15);

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
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                view === "list"
                  ? "bg-[var(--color-ink)] text-white border-transparent shadow-sm"
                  : "bg-transparent text-[var(--color-ink-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-border)]"
              }`}
            >
              {t("home.activityStream.listView")}
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                view === "grid"
                  ? "bg-[var(--color-ink)] text-white border-transparent shadow-sm"
                  : "bg-transparent text-[var(--color-ink-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-border)]"
              }`}
            >
              {t("home.activityStream.gridView")}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
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
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
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
          className={`flex flex-wrap gap-2 mb-10 transition-all duration-300 ${
            showSubfilters ? "opacity-100 max-h-20" : "opacity-0 max-h-0 overflow-hidden"
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
          <div
            className={
              view === "grid"
                ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-4"
            }
          >
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="group rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5 transition-all duration-200 hover:border-[var(--color-border)] hover:shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-[var(--color-surface-sunken)] text-[var(--color-ink)]">
                      {t(`home.activityStream.categories.${post.category}`)}
                    </span>
                    {post.subcategory && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                        {t(`home.activityStream.subcategoryLabels.${post.subcategory}`)}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-[var(--color-ink-tertiary)]">
                    <Clock className="h-3 w-3" />
                    {post.time}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2 leading-snug">
                  {post.title}
                </h3>
                <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed mb-4">
                  {post.summary}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-ink-secondary)] mb-5">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {post.location}
                  </span>
                  {post.price && (
                    <span className="px-2 py-1 rounded-full bg-[var(--color-surface-sunken)]">
                      {post.price}
                    </span>
                  )}
                  {post.tagLabel && (
                    <span className="px-2 py-1 rounded-full bg-[var(--color-surface-sunken)]">
                      {post.tagLabel}
                    </span>
                  )}
                </div>
                <Link
                  href={post.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] group-hover:gap-3 transition-all"
                >
                  {t(`home.activityStream.cta.${post.category}`)}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Types & Data

interface Testimonial {
  name: string;
  location: string;
  text: string;
}

type ActivityCategory = "all" | "realEstate" | "jobs" | "marketplace";
type ActivitySubcategory =
  | "all"
  | "rent"
  | "sale"
  | "roommate"
  | "seeking_job"
  | "hiring";
type ActivityView = "list" | "grid";

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

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Mehmet Şahin",
    location: "Boston, MA",
    text: "amerikala sayesinde Boston'daki Türk topluluğunu buldum. Artık hafta sonları yalnız geçmiyor!",
  },
];

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
