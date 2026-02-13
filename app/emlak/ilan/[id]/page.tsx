"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  Listing,
  LISTING_TYPE_LABELS,
  LISTING_TYPE_ICONS,
  LISTING_TYPE_COLORS,
  PROPERTY_TYPE_LABELS,
  PET_POLICY_OPTIONS,
  PARKING_OPTIONS,
  LAUNDRY_OPTIONS,
  LEASE_TERM_OPTIONS,
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
  Bed,
  Bath,
  Square,
  Calendar,
  Phone,
  Mail,
  Heart,
  Share2,
  Flag,
  Loader2,
  Home,
  DollarSign,
  Car,
  PawPrint,
  Shirt,
  Users,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch listing
  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("listings")
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
          .from("listings")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("id", listingId);

        // Check if favorited
        if (user) {
          const { data: favData } = await supabase
            .from("listing_favorites")
            .select("*")
            .eq("listing_id", listingId)
            .eq("user_id", user.id)
            .single();

          setIsFavorite(!!favData);
        }
      } catch (err: any) {
        console.error("Error fetching listing:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId, user]);

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from("listing_favorites")
          .delete()
          .eq("listing_id", listingId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("listing_favorites")
          .insert({ listing_id: listingId, user_id: user.id });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format date
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Home className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">İlan Bulunamadı</h2>
            <p className="text-neutral-500 mb-6">{error || "Bu ilan mevcut değil veya kaldırılmış olabilir."}</p>
            <Link href="/emlak">
              <Button variant="primary">Emlak İlanlarına Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const owner = listing.user as any;
  const images = listing.images || [];
  const amenities = listing.amenities || [];

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
                  <div className="relative aspect-[16/10] bg-neutral-200 dark:bg-neutral-800">
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
                        <Home className="w-20 h-20 text-neutral-400" />
                      </div>
                    )}

                    {/* Type Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${LISTING_TYPE_COLORS[listing.listing_type]}`}>
                        {LISTING_TYPE_ICONS[listing.listing_type]} {LISTING_TYPE_LABELS[listing.listing_type]}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={toggleFavorite}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isFavorite ? "bg-red-500 text-white" : "bg-white/90 text-neutral-600 hover:bg-white"
                        }`}
                      >
                        <Heart size={20} className={isFavorite ? "fill-current" : ""} />
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
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
                        <div className="flex items-center gap-2 text-neutral-500">
                          <MapPin size={18} />
                          <span>
                            {listing.address}, {listing.city}, {US_STATES_MAP[listing.state] || listing.state}
                            {listing.zip_code && ` ${listing.zip_code}`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-emerald-600">
                          {formatPrice(listing.price)}
                          {listing.listing_type === "rent" && <span className="text-lg font-normal text-neutral-500">/ay</span>}
                        </div>
                        {listing.deposit && (
                          <div className="text-sm text-neutral-500">
                            Depozito: {formatPrice(listing.deposit)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Bed className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm text-neutral-500">Oda</div>
                          <div className="font-semibold">{listing.bedrooms}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                          <Bath className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div>
                          <div className="text-sm text-neutral-500">Banyo</div>
                          <div className="font-semibold">{listing.bathrooms}</div>
                        </div>
                      </div>
                      {listing.sqft && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Square className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm text-neutral-500">Alan</div>
                            <div className="font-semibold">{listing.sqft} sqft</div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <Home className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-sm text-neutral-500">Tip</div>
                          <div className="font-semibold text-sm">{PROPERTY_TYPE_LABELS[listing.property_type]}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold mb-4">Açıklama</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed">
                      {listing.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Details */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold mb-4">Detaylar</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {listing.available_date && (
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-neutral-400" />
                          <div>
                            <div className="text-sm text-neutral-500">Müsait Tarih</div>
                            <div className="font-medium">{formatDate(listing.available_date)}</div>
                          </div>
                        </div>
                      )}
                      {listing.lease_term && (
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-neutral-400" />
                          <div>
                            <div className="text-sm text-neutral-500">Kira Süresi</div>
                            <div className="font-medium">
                              {LEASE_TERM_OPTIONS.find(o => o.value === listing.lease_term)?.label || listing.lease_term}
                            </div>
                          </div>
                        </div>
                      )}
                      {listing.pet_policy && (
                        <div className="flex items-center gap-3">
                          <PawPrint className="w-5 h-5 text-neutral-400" />
                          <div>
                            <div className="text-sm text-neutral-500">Evcil Hayvan</div>
                            <div className="font-medium">
                              {PET_POLICY_OPTIONS.find(o => o.value === listing.pet_policy)?.label || listing.pet_policy}
                            </div>
                          </div>
                        </div>
                      )}
                      {listing.parking && (
                        <div className="flex items-center gap-3">
                          <Car className="w-5 h-5 text-neutral-400" />
                          <div>
                            <div className="text-sm text-neutral-500">Otopark</div>
                            <div className="font-medium">
                              {PARKING_OPTIONS.find(o => o.value === listing.parking)?.label || listing.parking}
                            </div>
                          </div>
                        </div>
                      )}
                      {listing.laundry && (
                        <div className="flex items-center gap-3">
                          <Shirt className="w-5 h-5 text-neutral-400" />
                          <div>
                            <div className="text-sm text-neutral-500">Çamaşır</div>
                            <div className="font-medium">
                              {LAUNDRY_OPTIONS.find(o => o.value === listing.laundry)?.label || listing.laundry}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-neutral-400" />
                        <div>
                          <div className="text-sm text-neutral-500">Faturalar</div>
                          <div className="font-medium">
                            {listing.utilities_included ? "Dahil" : "Hariç"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Amenities */}
                {amenities.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-lg font-bold mb-4">Özellikler</h2>
                      <div className="flex flex-wrap gap-2">
                        {amenities.map((amenity: string) => (
                          <Badge key={amenity} variant="default" size="lg" className="gap-1.5">
                            <CheckCircle size={14} />
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Owner Card */}
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
                          {owner?.created_at && `Üye: ${formatDate(owner.created_at)}`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {listing.show_email && listing.contact_email && (
                        <a
                          href={`mailto:${listing.contact_email}`}
                          className="flex items-center gap-3 w-full p-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                        >
                          <Mail size={20} />
                          E-posta Gönder
                        </a>
                      )}

                      {listing.show_phone && listing.contact_phone && (
                        <a
                          href={`tel:${listing.contact_phone}`}
                          className="flex items-center gap-3 w-full p-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
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

                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center justify-between text-sm text-neutral-500">
                        <span>İlan No: {listing.id.slice(0, 8)}</span>
                        <span>{listing.view_count || 0} görüntülenme</span>
                      </div>
                      <div className="text-sm text-neutral-500 mt-2">
                        Yayın: {formatDate(listing.created_at)}
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
