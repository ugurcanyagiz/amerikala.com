"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  Listing,
  Profile,
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
import UserProfileCardModal, { UserProfileCardData } from "@/app/components/UserProfileCardModal";
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
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Send,
  ImageIcon,
} from "lucide-react";

type ListingComment = {
  id: string;
  listing_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type ListingCommentDbRow = {
  id: string;
  listing_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type CommentProfile = NonNullable<ListingComment["profile"]>;

const toErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") return fallback;

  const maybeError = error as { message?: string; details?: string; hint?: string };
  const parts = [maybeError.message, maybeError.details, maybeError.hint].filter(Boolean);
  return parts.length > 0 ? parts.join(" — ") : fallback;
};

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
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [comments, setComments] = useState<ListingComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [dmText, setDmText] = useState("");
  const [dmSending, setDmSending] = useState(false);
  const [dmFeedback, setDmFeedback] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfileCardData | null>(null);

  const enrichCommentsWithProfiles = useCallback(async (rows: ListingCommentDbRow[]): Promise<ListingComment[]> => {
    if (rows.length === 0) return [];

    const userIds = [...new Set(rows.map((row) => row.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching comment profiles:", profilesError);
    }

    const profileMap = new Map<string, CommentProfile>();
    (profilesData || []).forEach((profile) => {
      profileMap.set(profile.id as string, {
        id: profile.id as string,
        username: (profile.username as string | null) || null,
        full_name: (profile.full_name as string | null) || null,
        avatar_url: (profile.avatar_url as string | null) || null,
      });
    });

    return rows.map((row) => ({
      ...row,
      profile: profileMap.get(row.user_id) || null,
    }));
  }, []);

  const fetchListingComments = useCallback(async (targetListingId: string) => {
    const { data, error: commentsFetchError } = await supabase
      .from("listing_comments")
      .select("id, listing_id, user_id, content, created_at")
      .eq("listing_id", targetListingId)
      .order("created_at", { ascending: false });

    if (commentsFetchError) {
      throw commentsFetchError;
    }

    const commentRows = (data as ListingCommentDbRow[] | null) || [];
    const commentsWithProfiles = await enrichCommentsWithProfiles(commentRows);
    setComments(commentsWithProfiles);
  }, [enrichCommentsWithProfiles]);

  const createConversationRecord = useCallback(async () => {
    const payloads = [
      { is_group: false, created_by: user?.id },
      { is_group: false },
      {},
    ];

    for (const payload of payloads) {
      const { data, error: conversationError } = await supabase.from("conversations").insert(payload).select("id").single();
      if (!conversationError && data?.id) {
        return data.id as string;
      }
    }

    // Fallback to RPC for installations where RLS blocks direct inserts.
    const { data: rpcData, error: rpcError } = await supabase.rpc("create_direct_conversation", {
      target_user_id: listing?.user_id,
    });

    if (!rpcError && rpcData) {
      return rpcData as string;
    }

    throw new Error("Mesaj odası oluşturulamadı. Supabase conversations tablosu için insert izni gerekebilir.");
  }, [user?.id, listing?.user_id]);

  // Fetch listing
  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) return;

      setLoading(true);
      setCommentsError(null);
      try {
        const [listingResult, favoritesResult] = await Promise.all([
          supabase
            .from("listings")
            .select(`
              *,
              user:user_id (id, username, full_name, avatar_url, created_at)
            `)
            .eq("id", listingId)
            .single(),
          supabase
            .from("listing_favorites")
            .select("listing_id", { count: "exact", head: true })
            .eq("listing_id", listingId),
        ]);

        if (listingResult.error) throw listingResult.error;
        if (!listingResult.data) throw new Error("İlan bulunamadı");

        setListing(listingResult.data);
        setFavoriteCount(favoritesResult.count || 0);

        try {
          await fetchListingComments(listingId);
        } catch (commentsFetchError) {
          setCommentsError(toErrorMessage(commentsFetchError, "Yorumlar yüklenirken bir sorun oluştu."));
          console.error("Error fetching listing comments:", commentsFetchError);
        }

        // Increment view count
        await supabase
          .from("listings")
          .update({ view_count: (listingResult.data.view_count || 0) + 1 })
          .eq("id", listingId);

        // Check if favorited
        if (user) {
          const { data: favData, error: favoriteCheckError } = await supabase
            .from("listing_favorites")
            .select("listing_id")
            .eq("listing_id", listingId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (favoriteCheckError) {
            console.error("Error checking favorite status:", favoriteCheckError);
          }

          setIsFavorite(!!favData);
        }
      } catch (err: unknown) {
        console.error("Error fetching listing:", err);
        setError(err instanceof Error ? err.message : "İlan yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId, user, fetchListingComments]);

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      if (isFavorite) {
        const { error: removeError } = await supabase
          .from("listing_favorites")
          .delete()
          .eq("listing_id", listingId)
          .eq("user_id", user.id);

        if (removeError) throw removeError;
        setIsFavorite(false);
        setFavoriteCount((prev) => Math.max(0, prev - 1));
        return;
      }

      const { error: insertError } = await supabase
        .from("listing_favorites")
        .insert({ listing_id: listingId, user_id: user.id });

      if (insertError) throw insertError;
      setIsFavorite(true);
      setFavoriteCount((prev) => prev + 1);
    } catch (favoriteError) {
      console.error("Error toggling favorite:", favoriteError);
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const sharePayload = {
      title: listing?.title || "Amerikala Emlak İlanı",
      text: listing?.description?.slice(0, 120) || "Bu ilanı inceleyin.",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
        return;
      } catch {
        // User dismissed share sheet
      }
    }

    await navigator.clipboard.writeText(window.location.href);
    setDmFeedback("İlan bağlantısı panoya kopyalandı.");
    setTimeout(() => setDmFeedback(null), 2000);
  };

  const handleAddComment = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    const content = commentText.trim();
    if (!content) return;

    setCommentSending(true);
    try {
      const { data, error: insertError } = await supabase
        .from("listing_comments")
        .insert({
          listing_id: listingId,
          user_id: user.id,
          content,
        })
        .select("id, listing_id, user_id, content, created_at")
        .single();

      if (insertError) throw insertError;

      const insertedRow = data as ListingCommentDbRow;
      const enriched = await enrichCommentsWithProfiles([insertedRow]);

      setComments((prev) => [...enriched, ...prev]);
      setCommentText("");
      setCommentsError(null);
    } catch (commentError) {
      console.error("Error adding comment:", commentError);
      setCommentsError(toErrorMessage(commentError, "Yorum gönderilemedi. Lütfen tekrar deneyin."));
      try {
        await fetchListingComments(listingId);
      } catch {
        // no-op: keep existing comment list when refresh fails
      }
    } finally {
      setCommentSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!listing || listing.user_id === user.id) return;

    const content = dmText.trim();
    if (!content) return;

    setDmSending(true);
    setDmFeedback(null);

    try {
      const { data: myRows, error: myRowsError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myRowsError) throw myRowsError;

      const myIds = ((myRows as Array<{ conversation_id: string }> | null) || []).map((row) => row.conversation_id);

      let conversationId = "";
      if (myIds.length > 0) {
        const { data: otherRows, error: otherRowsError } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", listing.user_id)
          .in("conversation_id", myIds);

        if (otherRowsError) throw otherRowsError;

        conversationId = (otherRows as Array<{ conversation_id: string }> | null)?.[0]?.conversation_id || "";
      }

      const isNewConversation = !conversationId;
      if (!conversationId) {
        conversationId = await createConversationRecord();
      }

      if (isNewConversation) {
        const { error: participantError } = await supabase.from("conversation_participants").insert([
          { conversation_id: conversationId, user_id: user.id },
          { conversation_id: conversationId, user_id: listing.user_id },
        ]);

        if (participantError) throw participantError;
      }

      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      });

      if (messageError) throw messageError;

      setDmText("");
      setDmFeedback("Mesaj gönderildi. Sohbet sayfasına yönlendiriliyorsunuz...");
      setTimeout(() => {
        router.push(`/messages?conversation=${conversationId}`);
      }, 300);
    } catch (messageSendError: unknown) {
      console.error("Error sending listing owner message:", messageSendError);
      setDmFeedback(toErrorMessage(messageSendError, "Mesaj gönderilemedi. Yöneticiye conversations/messages RLS izinlerini kontrol ettirin."));
    } finally {
      setDmSending(false);
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

  const owner = listing.user as Profile | undefined;
  const images = listing.images || [];
  const amenities = listing.amenities || [];

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
                              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/65 backdrop-blur-sm text-neutral-700 flex items-center justify-center hover:bg-white transition-colors"
                            >
                              <ChevronLeft size={22} />
                            </button>
                            <button
                              onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/65 backdrop-blur-sm text-neutral-700 flex items-center justify-center hover:bg-white transition-colors"
                            >
                              <ChevronRight size={22} />
                            </button>
                          </>
                        )}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-sm font-semibold">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-neutral-400">
                          <ImageIcon className="w-14 h-14 mx-auto mb-2" />
                          <p>Fotoğraf bulunamadı</p>
                        </div>
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
                        title="İlanı beğen / takip et"
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isFavorite ? "bg-red-500 text-white" : "bg-white/90 text-neutral-600 hover:bg-white"
                        }`}
                      >
                        <Heart size={20} className={isFavorite ? "fill-current" : ""} />
                      </button>
                      <button
                        onClick={handleShare}
                        className="w-10 h-10 rounded-full bg-white/90 text-neutral-600 flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>

                  {images.length > 1 && (
                    <div className="p-3 bg-white dark:bg-neutral-900 border-t dark:border-neutral-800">
                      <div className="flex gap-2 overflow-x-auto">
                        {images.map((img, idx) => (
                          <button
                            key={`${img}-${idx}`}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`relative shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              idx === currentImageIndex ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={img} alt={`${listing.title} ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
                        <div className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-500">
                          <Heart size={14} className={isFavorite ? "text-red-500 fill-current" : ""} />
                          <span>{favoriteCount} kişi bu ilanı beğendi / takip ediyor</span>
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

                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold mb-4">Yorumlar ({comments.length})</h2>

                    <div className="mb-5">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={3}
                        placeholder="İlan hakkında yorumunuzu yazın..."
                        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-xs text-neutral-500">Yorum bırakmak için giriş yapmış olmalısınız.</p>
                        <Button onClick={handleAddComment} disabled={commentSending || !commentText.trim()} className="gap-2">
                          {commentSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                          Yorum Yap
                        </Button>
                      </div>
                    </div>

                    {commentsError && (
                      <p className="text-sm text-red-500 mb-3">{commentsError}</p>
                    )}

                    <div className="space-y-4">
                      {comments.length === 0 ? (
                        <p className="text-sm text-neutral-500">Henüz yorum yapılmamış. İlk yorumu siz yapın.</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                            <div className="flex items-start gap-3">
                              <Avatar
                                src={comment.profile?.avatar_url || undefined}
                                fallback={comment.profile?.full_name || comment.profile?.username || "U"}
                                size="sm"
                                className={comment.profile?.id ? "cursor-pointer" : undefined}
                                onClick={() => {
                                  if (!comment.profile?.id) return;
                                  setSelectedProfile({
                                    id: comment.profile.id,
                                    username: comment.profile.username,
                                    full_name: comment.profile.full_name,
                                    avatar_url: comment.profile.avatar_url,
                                  });
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <button
                                    type="button"
                                    className="font-medium text-sm truncate text-left hover:underline"
                                    onClick={() => {
                                      if (!comment.profile?.id) return;
                                      setSelectedProfile({
                                        id: comment.profile.id,
                                        username: comment.profile.username,
                                        full_name: comment.profile.full_name,
                                        avatar_url: comment.profile.avatar_url,
                                      });
                                    }}
                                  >
                                    {comment.profile?.full_name || comment.profile?.username || "Kullanıcı"}
                                  </button>
                                  <p className="text-xs text-neutral-500">{formatDate(comment.created_at)}</p>
                                </div>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Owner Card */}
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
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                            İlan sahibine direkt mesaj
                          </label>
                          <textarea
                            value={dmText}
                            onChange={(e) => setDmText(e.target.value)}
                            rows={4}
                            placeholder="Merhaba, ilanınızla ilgileniyorum..."
                            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={handleSendMessage}
                            disabled={dmSending || !dmText.trim()}
                          >
                            {dmSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            Mesaj Gönder
                          </Button>
                        </div>
                      )}

                      {!user && (
                        <Link href="/login" className="block">
                          <Button variant="outline" className="w-full gap-2">
                            <MessageCircle size={18} />
                            Mesaj göndermek için giriş yap
                          </Button>
                        </Link>
                      )}
                    </div>

                    {dmFeedback && (
                      <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{dmFeedback}</p>
                    )}

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
