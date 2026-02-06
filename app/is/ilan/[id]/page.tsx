"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Building,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  Share2,
  Flag,
  Loader2,
  CheckCircle,
  Calendar,
  Users,
} from "lucide-react";

export default function JobListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const listingId = params.id as string;

  const [listing, setListing] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("job_listings")
          .select(`
            *,
            user:user_id (id, username, full_name, avatar_url, created_at)
          `)
          .eq("id", listingId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("İlan bulunamadı");

        setListing(data);

        // Increment view count
        await supabase
          .from("job_listings")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("id", listingId);
      } catch (err: any) {
        console.error("Error fetching listing:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  const formatSalary = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return "Belirtilmemiş";
    const suffix = type === "hourly" ? "/saat" : "/yıl";
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}${suffix}`;
    }
    if (min) return `$${min.toLocaleString()}+${suffix}`;
    if (max) return `$${max.toLocaleString()}'e kadar${suffix}`;
    return "Belirtilmemiş";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Briefcase className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">İlan Bulunamadı</h2>
            <p className="text-neutral-500 mb-6">{error || "Bu ilan mevcut değil."}</p>
            <Link href="/is">
              <Button variant="primary">İş İlanlarına Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const owner = listing.user as any;
  const skills = listing.skills || [];
  const benefits = listing.benefits || [];

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Geri Dön</span>
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Header Card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-3xl">
                        {JOB_CATEGORY_ICONS[listing.category]}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant={listing.listing_type === "hiring" ? "success" : "info"}>
                            {JOB_LISTING_TYPE_LABELS[listing.listing_type]}
                          </Badge>
                          <Badge variant="default">
                            {JOB_TYPE_LABELS[listing.job_type]}
                          </Badge>
                          {listing.is_remote && (
                            <Badge variant="default" className="gap-1">
                              <Globe size={12} />
                              Remote
                            </Badge>
                          )}
                        </div>
                        <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
                        {listing.company_name && (
                          <div className="flex items-center gap-2 text-neutral-600">
                            <Building size={18} />
                            <span className="font-medium">{listing.company_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        <span>{listing.city}, {US_STATES_MAP[listing.state] || listing.state}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} />
                        <span>{formatSalary(listing.salary_min, listing.salary_max, listing.salary_type)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>{formatDate(listing.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold mb-4">İlan Detayı</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed">
                      {listing.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Skills */}
                {skills.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold mb-4">Aranan Yetenekler</h2>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="default" size="lg">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Benefits */}
                {benefits.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold mb-4">Yan Haklar</h2>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {benefits.map((benefit: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="sticky top-24">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar
                        src={owner?.avatar_url}
                        fallback={owner?.full_name || owner?.username || "U"}
                        size="lg"
                      />
                      <div>
                        <h3 className="font-bold">{owner?.full_name || owner?.username || "Kullanıcı"}</h3>
                        <p className="text-sm text-neutral-500">
                          {listing.listing_type === "hiring" ? "İşveren" : "İş Arayan"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {listing.contact_email && (
                        <a
                          href={`mailto:${listing.contact_email}`}
                          className="flex items-center gap-3 w-full p-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                        >
                          <Mail size={20} />
                          E-posta Gönder
                        </a>
                      )}

                      {listing.contact_phone && (
                        <a
                          href={`tel:${listing.contact_phone}`}
                          className="flex items-center gap-3 w-full p-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
                        >
                          <Phone size={20} />
                          {listing.contact_phone}
                        </a>
                      )}

                      {listing.website_url && (
                        <a
                          href={listing.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <ExternalLink size={20} />
                          Web Sitesi
                        </a>
                      )}
                    </div>

                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center justify-between text-sm text-neutral-500">
                        <span>Kategori</span>
                        <span>{JOB_CATEGORY_LABELS[listing.category]}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-neutral-500 mt-2">
                        <span>Görüntülenme</span>
                        <span>{listing.view_count || 0}</span>
                      </div>
                    </div>

                    <button className="flex items-center justify-center gap-2 w-full mt-4 p-2 text-sm text-neutral-500 hover:text-red-500 transition-colors">
                      <Flag size={16} />
                      İlanı Şikayet Et
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
