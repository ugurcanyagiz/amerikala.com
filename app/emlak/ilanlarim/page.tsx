"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  Listing,
  LISTING_TYPE_LABELS,
  LISTING_TYPE_ICONS,
  LISTING_TYPE_COLORS,
  PROPERTY_TYPE_LABELS,
  US_STATES_MAP,
} from "@/lib/types";
import Sidebar from "@/app/components/Sidebar";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import {
  Plus,
  MapPin,
  Bed,
  Bath,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Home,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Onay Bekliyor", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { label: "Aktif", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Reddedildi", color: "bg-red-100 text-red-700", icon: XCircle },
  rented: { label: "Kiralandı", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  sold: { label: "Satıldı", color: "bg-purple-100 text-purple-700", icon: CheckCircle },
  closed: { label: "Kapatıldı", color: "bg-neutral-100 text-neutral-700", icon: AlertCircle },
};

export default function MyListingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/emlak/ilanlarim");
    }
  }, [user, authLoading, router]);

  // Fetch user's listings
  useEffect(() => {
    const fetchListings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchListings();
    }
  }, [user]);

  // Delete listing
  const handleDelete = async (id: string) => {
    if (!confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;

    setDeleting(id);
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setListings(listings.filter((l) => l.id !== id));
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("İlan silinirken bir hata oluştu.");
    } finally {
      setDeleting(null);
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="ak-shell lg:px-8 py-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link href="/emlak">
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">İlanlarım</h1>
                <p className="text-neutral-500">
                  {listings.length} ilan bulundu
                </p>
              </div>
              <Link href="/emlak/ilan-ver">
                <Button variant="primary" className="gap-2">
                  <Plus size={20} />
                  Yeni İlan
                </Button>
              </Link>
            </div>

            {/* Listings */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : listings.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Home className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Henüz ilanınız yok</h3>
                  <p className="text-neutral-500 mb-6">
                    Hemen ilk ilanınızı oluşturun ve binlerce kişiye ulaşın.
                  </p>
                  <Link href="/emlak/ilan-ver">
                    <Button variant="primary" className="gap-2">
                      <Plus size={18} />
                      İlan Ver
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => {
                  const status = STATUS_CONFIG[listing.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = status?.icon || Clock;

                  return (
                    <Card key={listing.id} className="glass overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {/* Image */}
                          <div className="relative w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-neutral-200 dark:bg-neutral-800">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Home className="w-10 h-10 text-neutral-400" />
                              </div>
                            )}
                            <div className="absolute top-2 left-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${LISTING_TYPE_COLORS[listing.listing_type]}`}>
                                {LISTING_TYPE_ICONS[listing.listing_type]}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                                    <StatusIcon size={12} />
                                    {status?.label}
                                  </span>
                                </div>
                                <Link href={`/emlak/ilan/${listing.id}`}>
                                  <h3 className="font-bold text-lg hover:text-emerald-500 transition-colors line-clamp-1">
                                    {listing.title}
                                  </h3>
                                </Link>
                                <div className="flex items-center gap-1 text-sm text-neutral-500 mt-1">
                                  <MapPin size={14} />
                                  <span>{listing.city}, {US_STATES_MAP[listing.state] || listing.state}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-emerald-600">
                                  {formatPrice(listing.price)}
                                  {listing.listing_type === "rent" && (
                                    <span className="text-sm font-normal text-neutral-500">/ay</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-neutral-500">
                              <div className="flex items-center gap-1">
                                <Bed size={16} />
                                <span>{listing.bedrooms} oda</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Bath size={16} />
                                <span>{listing.bathrooms} banyo</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye size={16} />
                                <span>{listing.view_count || 0} görüntülenme</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={16} />
                                <span>{formatDate(listing.created_at)}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                              <Link href={`/emlak/ilan/${listing.id}`}>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Eye size={16} />
                                  Görüntüle
                                </Button>
                              </Link>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Edit size={16} />
                                Düzenle
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(listing.id)}
                                disabled={deleting === listing.id}
                              >
                                {deleting === listing.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                                Sil
                              </Button>
                            </div>

                            {/* Rejection Reason */}
                            {listing.status === "rejected" && listing.rejection_reason && (
                              <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                                <strong>Red Sebebi:</strong> {listing.rejection_reason}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
