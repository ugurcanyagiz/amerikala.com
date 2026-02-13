"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  MarketplaceListing,
  MARKETPLACE_CATEGORY_LABELS,
  MARKETPLACE_CATEGORY_ICONS,
  MARKETPLACE_CONDITION_LABELS,
  MarketplaceCategory,
  US_STATES_MAP,
} from "@/lib/types";
import Sidebar from "@/app/components/Sidebar";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import {
  ShoppingBag,
  Plus,
  Package,
  MapPin,
  DollarSign,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";

export default function AlisverisIlanlarimPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Show success message if redirected from form
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/alisveris/ilanlarim");
    }
  }, [user, authLoading, router]);

  // Fetch user's listings
  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  const fetchListings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("marketplace_listings")
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

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("marketplace_listings")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setListings(listings.filter(l => l.id !== id));
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("İlan silinirken bir hata oluştu.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success" className="gap-1"><CheckCircle size={12} /> Yayında</Badge>;
      case "pending":
        return <Badge variant="warning" className="gap-1"><Clock size={12} /> Beklemede</Badge>;
      case "rejected":
        return <Badge variant="error" className="gap-1"><XCircle size={12} /> Reddedildi</Badge>;
      case "sold":
        return <Badge variant="default" className="gap-1"><Package size={12} /> Satıldı</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Success Message */}
            {showSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">İlanınız başarıyla yayınlandı!</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Artık diğer kullanıcılar ilanınızı görebilir.</p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="text-orange-500" />
                  Alışveriş İlanlarım
                </h1>
                <p className="text-neutral-500">{listings.length} ilan</p>
              </div>
              <Link href="/alisveris/ilan-ver">
                <Button variant="primary" className="gap-2 bg-orange-500 hover:bg-orange-600">
                  <Plus size={18} />
                  Yeni İlan Ver
                </Button>
              </Link>
            </div>

            {/* Listings */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : listings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Henüz ilanınız yok</h3>
                  <p className="text-neutral-500 mb-6">
                    Satmak istediğiniz ürün veya hizmetleri ilan vererek paylaşın.
                  </p>
                  <Link href="/alisveris/ilan-ver">
                    <Button variant="primary" className="gap-2 bg-orange-500 hover:bg-orange-600">
                      <Plus size={18} />
                      İlk İlanınızı Verin
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        <div className="sm:w-48 h-40 sm:h-auto bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                          {listing.images && listing.images.length > 0 ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-4xl">
                                {MARKETPLACE_CATEGORY_ICONS[listing.category]}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(listing.status)}
                                <Badge variant="outline">
                                  {MARKETPLACE_CATEGORY_ICONS[listing.category]}{" "}
                                  {MARKETPLACE_CATEGORY_LABELS[listing.category]}
                                </Badge>
                              </div>

                              <h3 className="font-bold text-lg truncate">{listing.title}</h3>

                              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-500">
                                <span className="flex items-center gap-1">
                                  <DollarSign size={16} />
                                  ${listing.price.toLocaleString()}
                                  {listing.is_negotiable && (
                                    <span className="text-orange-500 ml-1">(Pazarlık)</span>
                                  )}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin size={16} />
                                  {listing.city}, {US_STATES_MAP[listing.state] || listing.state}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={16} />
                                  {formatDate(listing.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye size={16} />
                                  {listing.view_count || 0} görüntüleme
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            <Link href={`/alisveris/ilan/${listing.id}`}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Eye size={16} />
                                Görüntüle
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleDelete(listing.id)}
                            >
                              <Trash2 size={16} />
                              Sil
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
