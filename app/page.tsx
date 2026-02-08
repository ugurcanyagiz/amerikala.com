"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  ArrowRight,
  Building2,
  Briefcase,
  ShoppingBag,
  Clock,
  Loader2,
  Users,
  type LucideIcon,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import { Button } from "./components/ui/Button";
import { useLanguage } from "./contexts/LanguageContext";
import { supabase } from "@/lib/supabase/client";
import type { JobListing, Listing, MarketplaceListing } from "@/lib/types";

export default function Home() {
  const { t, language } = useLanguage();
  const [activityView, setActivityView] = useState<"list" | "grid">("list");
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | "all">("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<ActivitySubcategory | "all">("all");
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      setActivityLoading(true);
      try {
        const [listingsResponse, jobsResponse, marketplaceResponse] = await Promise.all([
          supabase
            .from("listings")
            .select("id,title,description,city,state,price,listing_type,created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("job_listings")
            .select("id,title,description,city,state,is_remote,listing_type,company_name,created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("marketplace_listings")
            .select("id,title,description,city,state,price,is_negotiable,created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(6),
        ]);

        const listings = (listingsResponse.data || []) as Listing[];
        const jobs = (jobsResponse.data || []) as JobListing[];
        const marketplace = (marketplaceResponse.data || []) as MarketplaceListing[];

        const mappedItems: ActivityItem[] = [
          ...listings.map((listing) => ({
            id: `listing-${listing.id}`,
            category: "realEstate",
            subcategory: listing.listing_type,
            title: listing.title,
            summary: listing.description,
            location: formatLocation(listing.city, listing.state),
            timestamp: listing.created_at,
            detail: formatPrice(listing.price, language),
            cta: t("home.activityStream.cta.realEstate"),
            href: `/emlak/ilan/${listing.id}`,
          })),
          ...jobs.map((job) => ({
            id: `job-${job.id}`,
            category: "jobs",
            subcategory: job.listing_type,
            title: job.title,
            summary: job.description,
            location: job.is_remote
              ? t("home.activityStream.remote")
              : formatLocation(job.city, job.state),
            timestamp: job.created_at,
            detail: job.company_name || t("home.activityStream.independent"),
            cta: t("home.activityStream.cta.jobs"),
            href: `/is/ilan/${job.id}`,
          })),
          ...marketplace.map((listing) => ({
            id: `marketplace-${listing.id}`,
            category: "marketplace",
            subcategory: null,
            title: listing.title,
            summary: listing.description,
            location: formatLocation(listing.city, listing.state),
            timestamp: listing.created_at,
            detail: formatPrice(listing.price, language),
            cta: t("home.activityStream.cta.marketplace"),
            href: `/alisveris/ilan/${listing.id}`,
          })),
        ];

        mappedItems.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        setActivityItems(mappedItems);
      } catch (error) {
        console.error("Error fetching activity stream:", error);
        setActivityItems([]);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivity();
  }, [language, t]);

  const subcategoryFilters = useMemo(() => {
    if (selectedCategory === "realEstate") {
      return [
        { id: "all", label: t("home.activityStream.subfilters.realEstate.all") },
        { id: "rent", label: t("home.activityStream.subfilters.realEstate.rent") },
        { id: "sale", label: t("home.activityStream.subfilters.realEstate.sale") },
        { id: "roommate", label: t("home.activityStream.subfilters.realEstate.roommate") },
      ];
    }
    if (selectedCategory === "jobs") {
      return [
        { id: "all", label: t("home.activityStream.subfilters.jobs.all") },
        { id: "seeking_job", label: t("home.activityStream.subfilters.jobs.seeking_job") },
        { id: "hiring", label: t("home.activityStream.subfilters.jobs.hiring") },
      ];
    }
    return [];
  }, [selectedCategory, t]);

  useEffect(() => {
    setSelectedSubcategory("all");
  }, [selectedCategory]);

  const filteredItems = activityItems.filter((item) => {
    const categoryMatch = selectedCategory === "all" || item.category === selectedCategory;
    const subcategoryMatch =
      selectedSubcategory === "all" || item.subcategory === selectedSubcategory;
    return categoryMatch && subcategoryMatch;
  });

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

          {/* Activity Stream Section */}
          <section className="py-20 bg-[var(--color-surface-sunken)]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-8">
                <div className="text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-ink)] mb-4">
                    {t("home.activityStream.title")}
                  </h2>
                  <p className="text-lg text-[var(--color-ink-secondary)] max-w-2xl">
                    {t("home.activityStream.subtitle")}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-light)] bg-white/80 p-1 shadow-sm self-center sm:self-auto">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                      activityView === "list"
                        ? "bg-[var(--color-ink)] text-white"
                        : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                    }`}
                    onClick={() => setActivityView("list")}
                    aria-pressed={activityView === "list"}
                  >
                    {t("home.activityStream.listView")}
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                      activityView === "grid"
                        ? "bg-[var(--color-ink)] text-white"
                        : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                    }`}
                    onClick={() => setActivityView("grid")}
                    aria-pressed={activityView === "grid"}
                  >
                    {t("home.activityStream.gridView")}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between mb-8">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: "all", label: t("home.activityStream.filters.all") },
                    { id: "realEstate", label: t("home.activityStream.filters.realEstate") },
                    { id: "jobs", label: t("home.activityStream.filters.jobs") },
                    { id: "marketplace", label: t("home.activityStream.filters.marketplace") },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        selectedCategory === filter.id
                          ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white shadow-sm"
                          : "border-[var(--color-border-light)] text-[var(--color-ink-secondary)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
                      }`}
                      onClick={() => setSelectedCategory(filter.id as ActivityCategory | "all")}
                      aria-pressed={selectedCategory === filter.id}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-light)] bg-white/80 p-1 shadow-sm self-center sm:self-auto">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                      activityView === "list"
                        ? "bg-[var(--color-ink)] text-white"
                        : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                    }`}
                    onClick={() => setActivityView("list")}
                    aria-pressed={activityView === "list"}
                  >
                    {t("home.activityStream.listView")}
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                      activityView === "grid"
                        ? "bg-[var(--color-ink)] text-white"
                        : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                    }`}
                    onClick={() => setActivityView("grid")}
                    aria-pressed={activityView === "grid"}
                  >
                    {t("home.activityStream.gridView")}
                  </button>
                </div>
              </div>

              {subcategoryFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-10">
                  {subcategoryFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition ${
                        selectedSubcategory === filter.id
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                          : "border-[var(--color-border-light)] text-[var(--color-ink-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      }`}
                      onClick={() =>
                        setSelectedSubcategory(filter.id as ActivitySubcategory | "all")
                      }
                      aria-pressed={selectedSubcategory === filter.id}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}

              {activityLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="rounded-2xl border border-[var(--color-border-light)] bg-white/80 p-10 text-center text-[var(--color-ink-secondary)]">
                  <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
                    {t("home.activityStream.emptyTitle")}
                  </h3>
                  <p className="text-sm">{t("home.activityStream.emptyDescription")}</p>
                </div>
              ) : (
                <div
                  className={
                    activityView === "grid"
                      ? "grid gap-6 md:grid-cols-2"
                      : "space-y-4"
                  }
                >
                  {filteredItems.map((item) => (
                    <ActivityCard
                      key={item.id}
                      item={item}
                      view={activityView}
                      categoryLabel={t(`home.activityStream.categories.${item.category}`)}
                      subcategoryLabel={
                        item.subcategory
                          ? t(`home.activityStream.subcategoryLabels.${item.subcategory}`)
                          : null
                      }
                      timestampLabel={formatRelativeTime(item.timestamp, language)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

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

              <div className="space-y-4">
                {TRENDING_EVENTS.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
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

const CATEGORY_ICONS: Record<ActivityItem["category"], LucideIcon> = {
  realEstate: Building2,
  jobs: Briefcase,
  marketplace: ShoppingBag,
};

function ActivityCard({
  item,
  view,
  categoryLabel,
  subcategoryLabel,
  timestampLabel,
}: {
  item: ActivityItem;
  view: "list" | "grid";
  categoryLabel: string;
  subcategoryLabel: string | null;
  timestampLabel: string;
}) {
  const Icon = CATEGORY_ICONS[item.category];

  return (
    <Link
      href={item.href}
      className={`group rounded-2xl border border-[var(--color-border-light)] bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(15,23,42,0.12)] ${
        view === "list" ? "flex flex-col gap-4 sm:flex-row sm:items-center" : "flex flex-col gap-4"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)]">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-[var(--color-border-light)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-ink-secondary)]">
              {categoryLabel}
            </span>
            {subcategoryLabel && (
              <span className="inline-flex items-center rounded-full border border-[var(--color-border-light)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-ink-secondary)]">
                {subcategoryLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-secondary)]">
            <Clock className="h-4 w-4" />
            {timestampLabel}
          </div>
        </div>
      </div>
      <div className={view === "list" ? "flex-1" : ""}>
        <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2 group-hover:text-[var(--color-primary)] transition">
          {item.title}
        </h3>
        <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed mb-4 line-clamp-2">
          {item.summary || "\u00A0"}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-ink-secondary)]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {item.location}
          </span>
          <span className="inline-flex items-center gap-1">{item.detail}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink-secondary)]">
        <span>{item.cta}</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

type ActivityCategory = "realEstate" | "jobs" | "marketplace";
type ActivitySubcategory = "rent" | "sale" | "roommate" | "seeking_job" | "hiring" | null;

type ActivityItem = {
  id: string;
  category: ActivityCategory;
  subcategory: ActivitySubcategory;
  title: string;
  summary: string;
  location: string;
  timestamp: string;
  detail: string;
  cta: string;
  href: string;
};

function formatLocation(city?: string | null, state?: string | null) {
  if (!city && !state) return "-";
  if (city && state) return `${city}, ${state}`;
  return city || state || "-";
}

function formatPrice(price: number | null | undefined, locale: "tr" | "en") {
  if (price === null || price === undefined) return "-";
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatRelativeTime(isoDate: string, locale: "tr" | "en") {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    numeric: "auto",
  });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(-diffMinutes, "minute");
  }
  if (Math.abs(diffHours) < 24) {
    return rtf.format(-diffHours, "hour");
  }
  if (Math.abs(diffDays) < 7) {
    return rtf.format(-diffDays, "day");
  }
  return date.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function EventRow({ event }: { event: TrendingEvent }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-center gap-6 p-4 rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-sunken)] transition-all duration-200 group"
    >
      {/* Date */}
      <div className="flex-shrink-0 w-14 text-center">
        <div className="text-xs font-medium text-[var(--color-primary)]">{event.month}</div>
        <div className="text-2xl font-semibold text-[var(--color-ink)]">{event.day}</div>
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
            {event.location}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {event.attendees} katılımcı
          </span>
        </div>
      </div>

      {/* Arrow */}
      <ArrowRight className="h-5 w-5 text-[var(--color-ink-tertiary)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

// Types & Data

interface TrendingEvent {
  id: number;
  title: string;
  day: string;
  month: string;
  location: string;
  category: string;
  attendees: number;
}

interface Testimonial {
  name: string;
  location: string;
  text: string;
}

const TRENDING_EVENTS: TrendingEvent[] = [
  {
    id: 1,
    title: "NYC Turkish Coffee & Networking",
    day: "28",
    month: "OCA",
    location: "Manhattan, NY",
    category: "Sosyal",
    attendees: 24,
  },
  {
    id: 2,
    title: "Bay Area Tech Meetup",
    day: "02",
    month: "ŞUB",
    location: "San Francisco, CA",
    category: "Kariyer",
    attendees: 45,
  },
  {
    id: 3,
    title: "LA Hiking & Brunch",
    day: "05",
    month: "ŞUB",
    location: "Griffith Park, LA",
    category: "Spor",
    attendees: 18,
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Mehmet Şahin",
    location: "Boston, MA",
    text: "amerikala sayesinde Boston'daki Türk topluluğunu buldum. Artık hafta sonları yalnız geçmiyor!",
  },
];
