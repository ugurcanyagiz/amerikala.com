"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import { Button } from "./components/ui/Button";
import { publicSupabase } from "@/lib/supabase/publicClient";

type HomeCategoryKey = "events" | "realEstate" | "jobs" | "marketplace";

type UnifiedAd = {
  id: string;
  title: string;
  location: string;
  href: string;
  section: HomeCategoryKey;
  createdAt: string;
  priceLabel?: string;
};

const CATEGORY_CONFIG: Record<
  HomeCategoryKey,
  {
    title: string;
    subtitle: string;
    href: string;
    icon: typeof Building2;
    badgeClass: string;
    cardClass: string;
  }
> = {
  events: {
    title: "Etkinlikler",
    subtitle: "Topluluğa katıl",
    href: "/events",
    icon: CalendarDays,
    badgeClass: "bg-sky-100 text-sky-700",
    cardClass: "from-sky-100 via-white to-cyan-50",
  },
  realEstate: {
    title: "Emlak",
    subtitle: "Yeni yaşam alanı",
    href: "/emlak",
    icon: Building2,
    badgeClass: "bg-emerald-100 text-emerald-700",
    cardClass: "from-emerald-100 via-white to-teal-50",
  },
  jobs: {
    title: "İş",
    subtitle: "Kariyer fırsatları",
    href: "/is",
    icon: BriefcaseBusiness,
    badgeClass: "bg-violet-100 text-violet-700",
    cardClass: "from-violet-100 via-white to-fuchsia-50",
  },
  marketplace: {
    title: "Alışveriş",
    subtitle: "Al - sat ilanları",
    href: "/alisveris",
    icon: ShoppingBag,
    badgeClass: "bg-amber-100 text-amber-700",
    cardClass: "from-amber-100 via-white to-orange-50",
  },
};

export default function Home() {
  const [ads, setAds] = useState<UnifiedAd[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<HomeCategoryKey, number>>({
    events: 0,
    realEstate: 0,
    jobs: 0,
    marketplace: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomepageData = async () => {
      setLoading(true);
      try {
        const [eventsRes, realEstateRes, jobsRes, marketplaceRes] = await Promise.all([
          publicSupabase
            .from("events")
            .select("id, title, city, state, created_at", { count: "exact" })
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(8),
          publicSupabase
            .from("listings")
            .select("id, title, city, state, price, created_at", { count: "exact" })
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(8),
          publicSupabase
            .from("job_listings")
            .select("id, title, city, state, salary_min, salary_max, created_at", { count: "exact" })
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(8),
          publicSupabase
            .from("marketplace_listings")
            .select("id, title, city, state, price, created_at", { count: "exact" })
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

        if (eventsRes.error) throw eventsRes.error;
        if (realEstateRes.error) throw realEstateRes.error;
        if (jobsRes.error) throw jobsRes.error;
        if (marketplaceRes.error) throw marketplaceRes.error;

        setCategoryCounts({
          events: eventsRes.count ?? 0,
          realEstate: realEstateRes.count ?? 0,
          jobs: jobsRes.count ?? 0,
          marketplace: marketplaceRes.count ?? 0,
        });

        const unified: UnifiedAd[] = [
          ...(eventsRes.data ?? []).map((item) => ({
            id: `event-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/events/${item.id}`,
            section: "events" as const,
            createdAt: item.created_at,
            priceLabel: "Ücretsiz / biletli",
          })),
          ...(realEstateRes.data ?? []).map((item) => ({
            id: `listing-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/emlak/ilan/${item.id}`,
            section: "realEstate" as const,
            createdAt: item.created_at,
            priceLabel: formatCurrency(item.price),
          })),
          ...(jobsRes.data ?? []).map((item) => ({
            id: `job-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/is/ilan/${item.id}`,
            section: "jobs" as const,
            createdAt: item.created_at,
            priceLabel: formatSalaryRange(item.salary_min, item.salary_max),
          })),
          ...(marketplaceRes.data ?? []).map((item) => ({
            id: `market-${item.id}`,
            title: item.title,
            location: `${item.city}, ${item.state}`,
            href: `/alisveris/ilan/${item.id}`,
            section: "marketplace" as const,
            createdAt: item.created_at,
            priceLabel: formatCurrency(item.price),
          })),
        ]
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, 12);

        setAds(unified);
      } catch (error) {
        console.error("Homepage fetch error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  const featuredAds = useMemo(() => ads.slice(0, 4), [ads]);
  const latestAds = useMemo(() => ads.slice(0, 8), [ads]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f7fbff]">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <section className="relative overflow-hidden border-b border-sky-100">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#d8ecff_0%,#f7fbff_45%,#ffffff_100%)]" />
            <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-8 lg:px-12 lg:py-16">
              <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-1.5 text-xs font-semibold text-sky-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Amerikala Classifieds
                  </span>
                  <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                    İlan ver, paylaş ve topluluk içinde hızlıca görünür ol.
                  </h1>
                  <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                    Daha canlı, daha modern ve ilan odaklı yeni anasayfa düzeni: kategoriler, öne çıkan ilanlar ve en yeni içerikler tek bakışta.
                  </p>

                  <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_40px_-30px_rgba(14,116,144,0.65)]">
                    <div className="grid gap-2 md:grid-cols-[1.15fr_1fr_auto]">
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                          className="w-full border-none bg-transparent text-sm text-slate-700 outline-none"
                          placeholder="Ne arıyorsun? (ör: kiralık ev, iş, etkinlik)"
                        />
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <input className="w-full border-none bg-transparent text-sm text-slate-700 outline-none" placeholder="Konum (eyalet / şehir)" />
                      </div>
                      <Button variant="primary" className="h-11 rounded-xl px-6">
                        Ara
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/register">
                      <Button variant="primary" size="lg" className="rounded-xl">
                        Hemen İlan Ver
                      </Button>
                    </Link>
                    <Link href="/feed">
                      <Button variant="outline" size="lg" className="rounded-xl">
                        Paylaşımları Gör
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="relative h-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_22px_50px_-30px_rgba(14,116,144,0.6)] sm:h-[380px]">
                  <Image src="/amerikala.png" alt="Amerikala classified hero" fill className="object-cover" priority />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/85">Amerika’daki Türk topluluğu</p>
                    <p className="mt-1 text-xl font-semibold">Data tamamen sizde, layout yenilenmiş deneyim.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 lg:px-12">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-3xl font-bold text-slate-900">Kategoriler</h2>
              <p className="text-sm text-slate-500">Mevcut içerik yapınız korunur.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(Object.keys(CATEGORY_CONFIG) as HomeCategoryKey[]).map((key) => {
                const config = CATEGORY_CONFIG[key];
                const Icon = config.icon;
                return (
                  <Link
                    key={key}
                    href={config.href}
                    className={`group rounded-2xl border border-slate-200 bg-gradient-to-br ${config.cardClass} p-5 transition hover:-translate-y-0.5 hover:shadow-md`}
                  >
                    <span className={`inline-flex rounded-full p-3 ${config.badgeClass}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">{config.title}</h3>
                    <p className="text-sm text-slate-600">{config.subtitle}</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
                      <span>{categoryCounts[key]} aktif ilan</span>
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <AdsSection title="Öne Çıkan İlanlar" subtitle="Classified Ads düzenine uygun premium kartlar" items={featuredAds} loading={loading} />

          <section className="bg-white py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
              <div className="mb-7 flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Son İlanlar</h2>
                  <p className="text-slate-500">Emlak, iş, alışveriş ve etkinlik kategorilerinden en güncel liste.</p>
                </div>
              </div>
              <AdsGrid items={latestAds} loading={loading} />
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
  subtitle: string;
  items: UnifiedAd[];
  loading: boolean;
}) {
  return (
    <section className="bg-slate-50 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="mb-7 text-center">
          <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-slate-500">{subtitle}</p>
        </div>
        <AdsGrid items={items} loading={loading} />
      </div>
    </section>
  );
}

function AdsGrid({ items, loading }: { items: UnifiedAd[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-60 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">Henüz listelenecek ilan bulunamadı.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const meta = CATEGORY_CONFIG[item.section];
        return (
          <Link
            key={item.id}
            href={item.href}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`h-28 bg-gradient-to-r ${meta.cardClass} p-4`}>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${meta.badgeClass}`}>{meta.title}</span>
            </div>
            <div className="space-y-3 p-4">
              <h3 className="line-clamp-2 min-h-[3rem] text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {item.location}
              </p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm font-semibold text-slate-700">{item.priceLabel ?? "Detaylı bilgi"}</span>
                <span className="text-xs text-slate-500">İlana git</span>
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
