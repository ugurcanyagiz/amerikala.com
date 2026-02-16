"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { 
  Listing,
  LISTING_TYPE_LABELS,
  LISTING_TYPE_ICONS,
  LISTING_TYPE_COLORS,
  PROPERTY_TYPE_LABELS,
  US_STATES_MAP
} from "@/lib/types";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { 
  Plus, 
  MapPin,
  Bed,
  Bath,
  Square,
  ChevronRight,
  Loader2,
  Home,
  Building2,
  Heart,
  Eye,
  ArrowRight,
} from "lucide-react";

export default function EmlakPage() {
  const { user } = useAuth();
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ rent: 0, sale: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: listings } = await supabase
          .from("listings")
          .select(`*, user:user_id (id, username, full_name, avatar_url)`)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(6);

        setRecentListings(listings || []);

        const { count: rentCount } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved")
          .eq("listing_type", "rent");

        const { count: saleCount } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved")
          .eq("listing_type", "sale");

        const { count: roommateCount } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved")
          .eq("listing_type", "roommate");

        setStats({ rent: (rentCount || 0) + (roommateCount || 0), sale: saleCount || 0 });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="ak-page pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="relative py-12 lg:py-16 bg-gradient-to-b from-emerald-50 to-transparent dark:from-emerald-950/20">
        <div className="ak-shell">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-sm font-medium mb-4">
              <Building2 size={16} />
              Emlak İlanları
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Kiralık & Satılık İlanlar
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Amerika&apos;daki Türk topluluğundan güvenilir emlak ilanları.
            </p>

            <Link href={user ? "/emlak/ilan-ver" : "/login?redirect=/emlak/ilan-ver"}>
              <Button variant="primary" size="lg" className="gap-2 bg-emerald-500 hover:bg-emerald-600">
                <Plus size={20} />
                Ücretsiz İlan Ver
              </Button>
            </Link>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mt-8">
              <Link href="/emlak/kiralik" className="text-center hover:opacity-80 transition">
                <div className="text-2xl font-bold">{stats.rent}</div>
                <div className="text-sm text-neutral-500">Kiralık</div>
              </Link>
              <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
              <Link href="/emlak/satilik" className="text-center hover:opacity-80 transition">
                <div className="text-2xl font-bold">{stats.sale}</div>
                <div className="text-sm text-neutral-500">Satılık</div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="ak-shell py-8">
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/emlak/kiralik" className="group">
            <Card className="h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Home className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-blue-600 transition-colors">
                      Kiralık İlanlar
                    </h3>
                    <p className="text-sm text-neutral-500">{stats.rent} aktif ilan</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/emlak/satilik" className="group">
            <Card className="h-full hover:shadow-lg transition-all border-2 border-transparent hover:border-green-200 dark:hover:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Building2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-green-600 transition-colors">
                      Satılık İlanlar
                    </h3>
                    <p className="text-sm text-neutral-500">{stats.sale} aktif ilan</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="ak-shell pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Son İlanlar</h2>
          <Link href="/emlak/kiralik">
            <Button variant="ghost" size="sm" className="gap-1 text-emerald-600">
              Tümünü Gör <ChevronRight size={16} />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : recentListings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Home className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz ilan yok</h3>
              <p className="text-neutral-500 mb-6">İlk ilanı siz verin!</p>
              <Link href="/emlak/ilan-ver">
                <Button variant="primary" className="gap-2 bg-emerald-500 hover:bg-emerald-600">
                  <Plus size={18} /> İlan Ver
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} formatPrice={formatPrice} />
            ))}
          </div>
        )}

        {/* My Listings CTA */}
        {user && (
          <div className="mt-8 p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">İlanlarınızı Yönetin</h3>
              <p className="text-sm text-neutral-500">Verdiğiniz ilanları görüntüleyin ve düzenleyin</p>
            </div>
            <div className="flex gap-3">
              <Link href="/emlak/ilanlarim">
                <Button variant="outline">İlanlarım</Button>
              </Link>
              <Link href="/emlak/ilan-ver">
                <Button variant="primary" className="bg-emerald-500 hover:bg-emerald-600">Yeni İlan</Button>
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ListingCard({ listing, formatPrice }: { listing: Listing; formatPrice: (price: number) => string }) {
  const [liked, setLiked] = useState(false);
  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;

  return (
    <Link href={`/emlak/ilan/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer h-full">
        <div className="relative h-44 bg-neutral-200 dark:bg-neutral-800">
          {firstImage ? (
            <img src={firstImage} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Home className="w-12 h-12 text-neutral-400" />
            </div>
          )}
          
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${LISTING_TYPE_COLORS[listing.listing_type]}`}>
              {LISTING_TYPE_ICONS[listing.listing_type]} {LISTING_TYPE_LABELS[listing.listing_type]}
            </span>
          </div>

          <button
            onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-neutral-800/90 flex items-center justify-center shadow-sm"
          >
            <Heart size={16} className={liked ? "fill-red-500 text-red-500" : "text-neutral-500"} />
          </button>

          <div className="absolute bottom-3 left-3">
            <span className="text-xl font-bold text-white drop-shadow-lg">
              {formatPrice(listing.price)}
              {listing.listing_type === 'rent' && <span className="text-sm font-normal">/ay</span>}
            </span>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 line-clamp-1 group-hover:text-emerald-500 transition-colors">
            {listing.title}
          </h3>

          <div className="flex items-center gap-1 text-sm text-neutral-500 mb-3">
            <MapPin size={14} />
            <span className="truncate">{listing.city}, {US_STATES_MAP[listing.state] || listing.state}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            {listing.bedrooms > 0 && <div className="flex items-center gap-1"><Bed size={16} /><span>{listing.bedrooms}</span></div>}
            {listing.bathrooms > 0 && <div className="flex items-center gap-1"><Bath size={16} /><span>{listing.bathrooms}</span></div>}
            {listing.sqft && <div className="flex items-center gap-1"><Square size={16} /><span>{listing.sqft}</span></div>}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-xs text-neutral-500">{PROPERTY_TYPE_LABELS[listing.property_type]}</span>
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <Eye size={12} /><span>{listing.view_count}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
