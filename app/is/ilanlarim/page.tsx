"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  JobListing,
  JOB_TYPE_LABELS,
  JOB_CATEGORY_LABELS,
  JOB_CATEGORY_ICONS,
  JOB_LISTING_TYPE_LABELS,
  US_STATES_MAP,
} from "@/lib/types";
import Sidebar from "@/app/components/Sidebar";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import {
  Plus,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Briefcase,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  DollarSign,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Onay Bekliyor", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { label: "Aktif", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Reddedildi", color: "bg-red-100 text-red-700", icon: XCircle },
  filled: { label: "Dolduruldu", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  closed: { label: "Kapatıldı", color: "bg-neutral-100 text-neutral-700", icon: AlertCircle },
};

export default function IsIlanlarimPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for success message
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/is/ilanlarim");
    }
  }, [user, authLoading, router]);

  // Fetch user's job listings
  useEffect(() => {
    const fetchListings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("job_listings")
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

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;

    setDeleting(id);
    try {
      const { error } = await supabase
        .from("job_listings")
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

  const formatSalary = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return null;
    const suffix = type === "hourly" ? "/saat" : "/yıl";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}${suffix}`;
    if (min) return `$${min.toLocaleString()}+${suffix}`;
    if (max) return `$${max.toLocaleString()}'e kadar${suffix}`;
    return null;
  };

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
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="ak-shell lg:px-8 py-6">
            {/* Success Message */}
            {showSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">İlanınız başarıyla oluşturuldu!</p>
                  <p className="text-sm text-green-600 dark:text-green-500">İlanınız artık yayında.</p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link href="/is">
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">İş İlanlarım</h1>
                <p className="text-neutral-500">{listings.length} ilan bulundu</p>
              </div>
              <Link href="/is/ilan-ver">
                <Button variant="primary" className="gap-2">
                  <Plus size={20} />
                  Yeni İlan
                </Button>
              </Link>
            </div>

            {/* Listings */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : listings.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Briefcase className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Henüz ilanınız yok</h3>
                  <p className="text-neutral-500 mb-6">
                    İlk iş ilanınızı oluşturun ve binlerce kişiye ulaşın.
                  </p>
                  <Link href="/is/ilan-ver">
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
                  const salary = formatSalary(listing.salary_min, listing.salary_max, listing.salary_type);

                  return (
                    <Card key={listing.id} className="glass overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Icon */}
                          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl">
                            {JOB_CATEGORY_ICONS[listing.category]}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                                    <StatusIcon size={12} />
                                    {status?.label}
                                  </span>
                                  <Badge variant={listing.listing_type === "hiring" ? "success" : "info"} size="sm">
                                    {JOB_LISTING_TYPE_LABELS[listing.listing_type]}
                                  </Badge>
                                </div>
                                <Link href={`/is/ilan/${listing.id}`}>
                                  <h3 className="font-bold text-lg hover:text-blue-500 transition-colors line-clamp-1">
                                    {listing.title}
                                  </h3>
                                </Link>
                                {listing.company_name && (
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{listing.company_name}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-neutral-500">
                              <div className="flex items-center gap-1">
                                <MapPin size={16} />
                                <span>{listing.city}, {US_STATES_MAP[listing.state] || listing.state}</span>
                              </div>
                              {listing.is_remote && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Globe size={16} />
                                  <span>Remote</span>
                                </div>
                              )}
                              {salary && (
                                <div className="flex items-center gap-1">
                                  <DollarSign size={16} />
                                  <span>{salary}</span>
                                </div>
                              )}
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
                              <Link href={`/is/ilan/${listing.id}`}>
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
