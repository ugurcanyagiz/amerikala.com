"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  MarketplaceListing,
  MARKETPLACE_CATEGORY_LABELS,
  MARKETPLACE_CATEGORY_ICONS,
  MARKETPLACE_CONDITION_LABELS,
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
  ShoppingBag,
  Phone,
  Mail,
  Heart,
  Share2,
  Flag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Tag,
  Calendar,
} from "lucide-react";

export default function MarketplaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const listingId = params.id as string;

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("marketplace_listings")
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
          .from("marketplace_listings")
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
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
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ShoppingBag className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">İlan Bulunamadı</h2>
            <p className="text-neutral-500 mb-6">{error || "Bu ilan mevcut değil."}</p>
            <Link href="/alisveris">
              <Button variant="primary">Alışverişe Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const owner = listing.user as any;
  const images = listing.images || [];

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="ak-shell lg:px-8 py-6">
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
                {/* Image Gallery */}
                <Card className="overflow-hidden">
                  <div className="relative aspect-[4/3] bg-neutral-200 dark:bg-neutral-800">
                    {images.length > 0 ? (
                      <>
                        <img
                          src={images[currentImageIndex]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                            >
                              <ChevronLeft size={24} />
                            </button>
                            <button
                              onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                            >
                              <ChevronRight size={24} />
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                              {images.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentImageIndex(idx)}
                                  className={`w-2 h-2 rounded-full transition-colors ${
                                    idx === currentImageIndex ? "bg-white" : "bg-white/50"
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-20 h-20 text-neutral-400" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button className="w-10 h-10 rounded-full bg-white/90 text-neutral-600 flex items-center justify-center hover:bg-white transition-colors">
                        <Heart size={20} />
                      </button>
                      <button className="w-10 h-10 rounded-full bg-white/90 text-neutral-600 flex items-center justify-center hover:bg-white transition-colors">
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>
                </Card>

                {/* Title & Price */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="default" size="lg" className="gap-1">
                        {MARKETPLACE_CATEGORY_ICONS[listing.category]} {MARKETPLACE_CATEGORY_LABELS[listing.category]}
                      </Badge>
                      <Badge variant="info" size="lg">
                        {MARKETPLACE_CONDITION_LABELS[listing.condition]}
                      </Badge>
                      {listing.is_negotiable && (
                        <Badge variant="success" size="lg">
                          Pazarlık Yapılır
                        </Badge>
                      )}
                    </div>

                    <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>

                    <div className="flex items-center gap-2 text-neutral-500 mb-4">
                      <MapPin size={18} />
                      <span>{listing.city}, {US_STATES_MAP[listing.state] || listing.state}</span>
                    </div>

                    <div className="text-3xl font-bold text-orange-600">
                      {formatPrice(listing.price)}
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                {listing.description && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold mb-4">Açıklama</h2>
                      <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed">
                        {listing.description}
                      </p>
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
                        <p className="text-sm text-neutral-500">Satıcı</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {listing.contact_email && (
                        <a
                          href={`mailto:${listing.contact_email}`}
                          className="flex items-center gap-3 w-full p-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
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

                      {user && user.id !== listing.user_id && (
                        <Button variant="outline" className="w-full gap-2">
                          <MessageCircle size={20} />
                          Mesaj Gönder
                        </Button>
                      )}
                    </div>

                    <div className="mt-6 pt-6 border-t space-y-2 text-sm">
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>İlan No</span>
                        <span>{listing.id.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Görüntülenme</span>
                        <span>{listing.view_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Yayın Tarihi</span>
                        <span>{formatDate(listing.created_at)}</span>
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
