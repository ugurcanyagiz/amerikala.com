"use client";

import Link from "next/link";
import {
  Calendar,
  Users,
  MapPin,
  ArrowRight,
  Building2,
  Briefcase,
  ShoppingBag,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import { Button } from "./components/ui/Button";
import { useLanguage } from "./contexts/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-surface)]">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          {/* Hero Section - Clean & Minimal */}
          <section className="relative py-20 lg:py-32">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Features Section - Clean Grid */}
          <section className="py-20 bg-[var(--color-surface-sunken)]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-ink)] mb-4">
                  {t("home.features.title")}
                </h2>
                <p className="text-lg text-[var(--color-ink-secondary)] max-w-2xl mx-auto">
                  {t("home.features.subtitle")}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureItem
                  icon={Calendar}
                  title={t("home.features.events.title")}
                  description={t("home.features.events.description")}
                  href="/meetups"
                />
                <FeatureItem
                  icon={Users}
                  title={t("home.features.groups.title")}
                  description={t("home.features.groups.description")}
                  href="/groups"
                />
                <FeatureItem
                  icon={MessageCircle}
                  title={t("home.features.chat.title")}
                  description={t("home.features.chat.description")}
                  href="/messages"
                />
                <FeatureItem
                  icon={Building2}
                  title={t("home.features.realestate.title")}
                  description={t("home.features.realestate.description")}
                  href="/emlak"
                />
                <FeatureItem
                  icon={Briefcase}
                  title={t("home.features.jobs.title")}
                  description={t("home.features.jobs.description")}
                  href="/is"
                />
                <FeatureItem
                  icon={ShoppingBag}
                  title={t("home.features.marketplace.title")}
                  description={t("home.features.marketplace.description")}
                  href="/alisveris"
                />
              </div>
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

function FeatureItem({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] hover:border-[var(--color-border)] hover:shadow-[var(--shadow-sm)] transition-all duration-200">
        <div className="h-12 w-12 rounded-xl bg-[var(--color-primary-subtle)] flex items-center justify-center mb-5 group-hover:bg-[var(--color-primary-light)] transition-colors">
          <Icon className="h-6 w-6 text-[var(--color-primary)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">{description}</p>
      </div>
    </Link>
  );
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
