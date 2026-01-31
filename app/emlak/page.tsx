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
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { 
  Plus, 
  MapPin,
  Bed,
  Bath,
  Square,
  DollarSign,
  ChevronRight,
  Loader2,
  Home,
  Building2,
  Users,
  TrendingUp,
  Heart,
  Eye,
  ArrowRight,
  Sparkles,
  Search
} from "lucide-react";

export default function EmlakPage() {
  const { user } = useAuth();

  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ rent: 0, sale: 0, roommate: 0 });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch recent listings
        const { data: listings } = await supabase
          .from("listings")
          .select(`
            *,
            user:user_id (id, username, full_name, avatar_url)
          `)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(6);

        setRecentListings(listings || []);

        // Get stats
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

        setStats({
          rent: rentCount || 0,
          sale: saleCount || 0,
          roommate: roommateCount || 0
        });

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 p-8 sm:p-12 mb-8">
              <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-cyan-500/30 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                      Emlak İlanları
                    </h1>
                    <p className="text-white/80 text-lg max-w-xl">
                      Amerika&apos;daki Türk topluluğundan kiralık, satılık evler ve ev arkadaşı ilanları.
                      Güvenilir ilanlar, kolay iletişim.
                    </p>
                  </div>
                  
                  <Link href="/emlak/ilan-ver">
                    <Button variant="secondary" size="lg" className="gap-2 w-full sm:w-auto">
                      <Plus size={20} />
                      Ücretsiz İlan Ver
                    </Button>
                  </Link>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <Link href="/emlak/kiralik" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-colors">
                    <div className="text-3xl font-bold text-white">{stats.rent}</div>
                    <div className="text-white/70 text-sm">Kiralık</div>
                  </Link>
                  <Link href="/emlak/satilik" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-colors">
                    <div className="text-3xl font-bold text-white">{stats.sale}</div>
                    <div className="text-white/70 text-sm">Satılık</div>
                  </Link>
                  <Link href="/emlak/ev-arkadasi" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-colors">
                    <div className="text-3xl font-bold text-white">{stats.roommate}</div>
                    <div className="text-white/70 text-sm">Ev Arkadaşı</div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Category Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {/* Kiralık */}
              <Link href="/emlak/kiralik">
                <Card className="glass group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 group-hover:from-blue-500/10 group-hover:to-blue-600/10 transition-colors" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <Home className="w-7 h-7 text-white" />
                      </div>
                      <Badge variant="info" size="lg">{stats.rent} ilan</Badge>
                    </div>
                    <h2 className="text-xl font-bold mb-2 group-hover:text-blue-500 transition-colors">
                      Kiralık İlanlar
                    </h2>
                    <p className="text-neutral-500 text-sm mb-4">
                      Daire, ev, stüdyo ve daha fazla kiralık seçenek.
                    </p>
                    <div className="flex items-center text-blue-500 font-medium text-sm">
                      İlanları Gör
                      <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Satılık */}
              <Link href="/emlak/satilik">
                <Card className="glass group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 group-hover:from-green-500/10 group-hover:to-emerald-600/10 transition-colors" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <Building2 className="w-7 h-7 text-white" />
                      </div>
                      <Badge variant="success" size="lg">{stats.sale} ilan</Badge>
                    </div>
                    <h2 className="text-xl font-bold mb-2 group-hover:text-green-500 transition-colors">
                      Satılık İlanlar
                    </h2>
                    <p className="text-neutral-500 text-sm mb-4">
                      Yatırım fırsatları ve satılık gayrimenkuller.
                    </p>
                    <div className="flex items-center text-green-500 font-medium text-sm">
                      İlanları Gör
                      <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Ev Arkadaşı */}
              <Link href="/emlak/ev-arkadasi">
                <Card className="glass group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-600/5 group-hover:from-purple-500/10 group-hover:to-violet-600/10 transition-colors" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      <Badge variant="default" size="lg">{stats.roommate} ilan</Badge>
                    </div>
                    <h2 className="text-xl font-bold mb-2 group-hover:text-purple-500 transition-colors">
                      Ev Arkadaşı
                    </h2>
                    <p className="text-neutral-500 text-sm mb-4">
                      Ev arıyorum veya ev arkadaşı arıyorum ilanları.
                    </p>
                    <div className="flex items-center text-purple-500 font-medium text-sm">
                      İlanları Gör
                      <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Recent Listings */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="text-yellow-500" size={24} />
                  Son Eklenen İlanlar
                </h2>
                <Link href="/emlak/kiralik">
                  <Button variant="ghost" className="gap-1">
                    Tümünü Gör
                    <ChevronRight size={18} />
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : recentListings.length === 0 ? (
                <Card className="glass">
                  <CardContent className="p-12 text-center">
                    <Home className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Henüz ilan yok</h3>
                    <p className="text-neutral-500 mb-6">İlk ilanı siz verin!</p>
                    <Link href="/emlak/ilan-ver">
                      <Button variant="primary" className="gap-2">
                        <Plus size={18} />
                        İlan Ver
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentListings.map(listing => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>

            {/* CTA Section */}
            {user && (
              <Card className="glass bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 text-white overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">İlanlarınızı Yönetin</h3>
                        <p className="text-white/70 text-sm">Verdiğiniz ilanları görüntüleyin ve düzenleyin</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link href="/emlak/ilanlarim">
                        <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                          İlanlarım
                        </Button>
                      </Link>
                      <Link href="/emlak/ilan-ver">
                        <Button variant="secondary">
                          Yeni İlan
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Listing Card Component
function ListingCard({ listing }: { listing: Listing }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;

  return (
    <Link href={`/emlak/ilan/${listing.id}`}>
      <Card className="glass overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group h-full">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800">
          {firstImage ? (
            <img 
              src={firstImage} 
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Home className="w-12 h-12 text-neutral-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${LISTING_TYPE_COLORS[listing.listing_type]}`}>
              {LISTING_TYPE_ICONS[listing.listing_type]} {LISTING_TYPE_LABELS[listing.listing_type]}
            </span>
          </div>

          {/* Price */}
          <div className="absolute bottom-3 left-3">
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              {formatPrice(listing.price)}
              {listing.listing_type === 'rent' && <span className="text-sm font-normal">/ay</span>}
            </span>
          </div>

          {/* Favorite Button */}
          <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-lg">
            <Heart size={16} className="text-neutral-600 hover:text-red-500" />
          </button>
        </div>

        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-emerald-500 transition-colors">
            {listing.title}
          </h3>

          <div className="flex items-center gap-1 text-sm text-neutral-500 mb-3">
            <MapPin size={14} />
            <span className="truncate">{listing.city}, {US_STATES_MAP[listing.state] || listing.state}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            {listing.bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed size={16} />
                <span>{listing.bedrooms}</span>
              </div>
            )}
            {listing.bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath size={16} />
                <span>{listing.bathrooms}</span>
              </div>
            )}
            {listing.sqft && (
              <div className="flex items-center gap-1">
                <Square size={16} />
                <span>{listing.sqft} sqft</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-xs text-neutral-500">
              {PROPERTY_TYPE_LABELS[listing.property_type]}
            </span>
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <Eye size={12} />
              <span>{listing.view_count}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
