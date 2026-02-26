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
import UserProfileCardModal, { UserProfileCardData } from "@/app/components/UserProfileCardModal";
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
  Trash2,
} from "lucide-react";

export default function MarketplaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, role } = useAuth();
  const listingId = params.id as string;
  const isAdmin = role === "admin";

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<UserProfileCardData | null>(null);
  const [deletingListing, setDeletingListing] = useState(false);
  const [ownerActionFeedback, setOwnerActionFeedback] = useState<string | null>(null);

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

        void fetch("/api/public/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "marketplace_listings", id: listingId }),
          keepalive: true,
        }).catch((touchError) => {
          console.error("Error incrementing marketplace listing view count:", touchError);
        });
      } catch (err) {
        console.error("Error fetching listing:", err);
        const message = err instanceof Error ? err.message : "İlan yüklenirken bir hata oluştu";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  const handleDeleteListing = async () => {
    if (!user) {
      router.push(`/login?redirect=/alisveris/ilan/${listingId}`);
      return;
    }

    if (!listing || (!isAdmin && listing.user_id !== user.id)) return;
    if (!confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;

    setDeletingListing(true);
    setOwnerActionFeedback(null);

    try {
      let query = supabase
        .from("marketplace_listings")
        .delete()
        .eq("id", listing.id);

      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { error: deleteError } = await query;
      if (deleteError) throw deleteError;
      router.push("/alisveris/ilanlarim?deleted=true");
    } catch (deleteError: unknown) {
      const message = deleteError instanceof Error ? deleteError.message : "İlan silinemedi.";
      setOwnerActionFeedback(message);
    } finally {
      setDeletingListing(false);
    }
  };

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

  const owner = listing.user as {
    id?: string;
    username?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  };
  const images = listing.images || [];
  const isOwnListing = user?.id === listing.user_id;
  const canManageListing = isOwnListing || isAdmin;

  return (
    <div className="ak-page overflow-x-hidden">
      <div className="flex min-w-0">
        <Sidebar />

        <main className="flex-1 min-w-0">
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
                              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(var(--color-trust-rgb),0.5)] text-white flex items-center justify-center hover:bg-[rgba(var(--color-trust-rgb),0.7)] transition-colors"
                            >
                              <ChevronLeft size={24} />
                            </button>
                            <button
                              onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(var(--color-trust-rgb),0.5)] text-white flex items-center justify-center hover:bg-[rgba(var(--color-trust-rgb),0.7)] transition-colors"
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
                        src={owner?.avatar_url || undefined}
                        fallback={owner?.full_name || owner?.username || "U"}
                        size="lg"
                        className={owner?.id ? "cursor-pointer" : undefined}
                        onClick={() => {
                          if (!owner?.id) return;
                          setSelectedProfile({
                            id: owner.id,
                            username: owner.username,
                            full_name: owner.full_name,
                            avatar_url: owner.avatar_url,
                          });
                        }}
                      />
                      <div>
                        <button
                          type="button"
                          className="font-bold hover:underline"
                          onClick={() => {
                            if (!owner?.id) return;
                            setSelectedProfile({
                              id: owner.id,
                              username: owner.username,
                              full_name: owner.full_name,
                              avatar_url: owner.avatar_url,
                            });
                          }}
                        >
                          {owner?.full_name || owner?.username || "Kullanıcı"}
                        </button>
                        <p className="text-sm text-neutral-500">Satıcı</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {canManageListing && (
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={handleDeleteListing}
                          disabled={deletingListing}
                        >
                          {deletingListing ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                          İlanı Sil
                        </Button>
                      )}

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
                          className="flex items-center gap-3 w-full p-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors break-all"
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
                        <span className="break-all text-right">{listing.id.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Görüntülenme</span>
                        <span>{listing.view_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Yayın Tarihi</span>
                        <span className="text-right">{formatDate(listing.created_at)}</span>
                      </div>
                    </div>

                    {!canManageListing && (
                      <button className="flex items-center justify-center gap-2 w-full mt-4 p-2 text-sm text-neutral-500 hover:text-red-500 transition-colors">
                        <Flag size={16} />
                        İlanı Şikayet Et
                      </button>
                    )}

                    {ownerActionFeedback && (
                      <p className="text-sm text-red-500">{ownerActionFeedback}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <UserProfileCardModal
              profile={selectedProfile}
              open={!!selectedProfile}
              onClose={() => setSelectedProfile(null)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
