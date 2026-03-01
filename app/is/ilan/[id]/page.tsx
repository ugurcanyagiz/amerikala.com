"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Textarea } from "@/app/components/ui/Textarea";
import UserProfileCardModal, { UserProfileCardData } from "@/app/components/UserProfileCardModal";
import { FavoriteButton } from "@/app/components/listings/FavoriteButton";
import { ShareButton } from "@/app/components/listings/ShareButton";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Building,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  Flag,
  Loader2,
  CheckCircle,
  Calendar,
  Send,
  MessageCircle,
  AlertTriangle,
  X,
  Trash2,
} from "lucide-react";

type ListingOwner = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at?: string | null;
} | null;

const toErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") return fallback;

  const maybeError = error as { message?: string; details?: string; hint?: string };
  const parts = [maybeError.message, maybeError.details, maybeError.hint].filter(Boolean);
  return parts.length > 0 ? parts.join(" — ") : fallback;
};

export default function JobListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, role } = useAuth();
  const listingId = params.id as string;
  const isAdmin = role === "admin";

  const [listing, setListing] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dmText, setDmText] = useState("");
  const [dmSending, setDmSending] = useState(false);
  const [dmFeedback, setDmFeedback] = useState<string | null>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfileCardData | null>(null);
  const [deletingListing, setDeletingListing] = useState(false);

  const createConversationRecord = useCallback(async (targetUserId: string) => {
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

    const { data: rpcData, error: rpcError } = await supabase.rpc("create_direct_conversation", {
      target_user_id: targetUserId,
    });

    if (!rpcError && rpcData) {
      return rpcData as string;
    }

    throw new Error("Mesaj odası oluşturulamadı. Supabase conversations tablosu için insert izni gerekebilir.");
  }, [user?.id]);

  const findOrCreateConversationWith = useCallback(async (targetUserId: string) => {
    if (!user) {
      throw new Error("Mesaj göndermek için giriş yapmalısınız.");
    }

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
        .eq("user_id", targetUserId)
        .in("conversation_id", myIds);

      if (otherRowsError) throw otherRowsError;

      conversationId = (otherRows as Array<{ conversation_id: string }> | null)?.[0]?.conversation_id || "";
    }

    const isNewConversation = !conversationId;
    if (!conversationId) {
      conversationId = await createConversationRecord(targetUserId);
    }

    if (isNewConversation) {
      const { error: participantError } = await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: user.id },
        { conversation_id: conversationId, user_id: targetUserId },
      ]);

      if (participantError) throw participantError;
    }

    return conversationId;
  }, [createConversationRecord, user]);

  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) return;

      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from("job_listings")
          .select(`
            *,
            user:user_id (id, username, full_name, avatar_url, created_at)
          `)
          .eq("id", listingId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("İlan bulunamadı");

        setListing(data);

        void fetch("/api/public/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: "job_listings", id: listingId }),
          keepalive: true,
        }).catch((touchError) => {
          console.error("Error incrementing job listing view count:", touchError);
        });
      } catch (fetchListingError: unknown) {
        console.error("Error fetching listing:", fetchListingError);
        setError(toErrorMessage(fetchListingError, "İlan yüklenirken bir sorun oluştu."));
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  const handleSendMessage = async () => {
    if (!user) {
      router.push(`/login?redirect=/is/ilan/${listingId}`);
      return;
    }

    if (!listing || listing.user_id === user.id) return;

    const content = dmText.trim();
    if (!content) {
      setDmFeedback("Lütfen bir mesaj yazın.");
      return;
    }

    setDmSending(true);
    setDmFeedback(null);

    try {
      const conversationId = await findOrCreateConversationWith(listing.user_id);

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
      setDmFeedback(toErrorMessage(messageSendError, "Mesaj gönderilemedi. Lütfen tekrar deneyin."));
    } finally {
      setDmSending(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!user) {
      router.push(`/login?redirect=/is/ilan/${listingId}`);
      return;
    }

    if (!listing || (!isAdmin && listing.user_id !== user.id)) return;
    if (!confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;

    setDeletingListing(true);
    try {
      let query = supabase
        .from("job_listings")
        .delete()
        .eq("id", listing.id);

      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { error: deleteError } = await query;
      if (deleteError) throw deleteError;
      router.push("/is/ilanlarim?deleted=true");
    } catch (deleteError: unknown) {
      setDmFeedback(toErrorMessage(deleteError, "İlan silinemedi. Lütfen tekrar deneyin."));
    } finally {
      setDeletingListing(false);
    }
  };

  const handleReportListing = async () => {
    if (!user) {
      router.push(`/login?redirect=/is/ilan/${listingId}`);
      return;
    }

    if (!listing) return;

    const reason = reportReason.trim();
    const details = reportDetails.trim();

    if (!reason) {
      setReportFeedback("Lütfen şikayet sebebini yazın.");
      return;
    }

    setReportSending(true);
    setReportFeedback(null);

    try {
      const { data: adminRows, error: adminsError } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(20);

      if (adminsError) throw adminsError;

      const adminIds = ((adminRows as Array<{ id: string }> | null) || [])
        .map((row) => row.id)
        .filter((id) => id && id !== user.id);

      if (adminIds.length === 0) {
        throw new Error("Şu anda ulaşılabilir admin bulunamadı.");
      }

      const listingUrl = typeof window !== "undefined"
        ? `${window.location.origin}/is/ilan/${listing.id}`
        : `/is/ilan/${listing.id}`;

      const reporterName = user.user_metadata?.full_name || user.email || user.id;
      const reportMessage = [
        "🚨 İş ilanı şikayeti alındı",
        `İlan: ${listing.title}`,
        `İlan ID: ${listing.id}`,
        `Link: ${listingUrl}`,
        `Şikayet eden: ${reporterName}`,
        `Sebep: ${reason}`,
        details ? `Detay: ${details}` : null,
      ].filter(Boolean).join("\n");

      for (const adminId of adminIds) {
        const conversationId = await findOrCreateConversationWith(adminId);
        const { error: messageError } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: reportMessage,
        });

        if (messageError) throw messageError;
      }

      setReportFeedback("Şikayetiniz admin ekibine iletildi. Teşekkür ederiz.");
      setReportReason("");
      setReportDetails("");
      setTimeout(() => {
        setShowReportModal(false);
        setReportFeedback(null);
      }, 1200);
    } catch (reportError: unknown) {
      console.error("Error reporting listing:", reportError);
      setReportFeedback(toErrorMessage(reportError, "Şikayet gönderilemedi. Lütfen tekrar deneyin."));
    } finally {
      setReportSending(false);
    }
  };

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

  const owner = listing.user as ListingOwner;
  const skills = listing.skills || [];
  const benefits = listing.benefits || [];
  const isOwnListing = user?.id === listing.user_id;
  const canManageListing = isOwnListing || isAdmin;

  return (
    <div className="ak-page overflow-x-hidden">
      <div className="flex min-w-0">
        <Sidebar />

        <main className="flex-1 min-w-0">
          <div className="ak-shell lg:px-8 py-6">
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
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-3xl">
                        {JOB_CATEGORY_ICONS[listing.category]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant={listing.listing_type === "hiring" ? "success" : "info"}>
                            {JOB_LISTING_TYPE_LABELS[listing.listing_type]}
                          </Badge>
                          <Badge variant="default">{JOB_TYPE_LABELS[listing.job_type]}</Badge>
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

                    <div className="flex items-center gap-2 shrink-0">
                      <FavoriteButton targetType="is" targetId={listingId} />
                      <ShareButton
                        url={typeof window !== "undefined" ? window.location.href : `${process.env.NEXT_PUBLIC_SITE_URL || ""}/is/ilan/${listingId}`}
                        title={listing.title || "Amerikala İş İlanı"}
                        text={listing.description?.slice(0, 120) || "Bu ilanı inceleyin."}
                      />
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

                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold mb-4">İlan Detayı</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed">
                      {listing.description}
                    </p>
                  </CardContent>
                </Card>

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

              <div className="space-y-6">
                <Card className="sticky top-24">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar
                        src={owner?.avatar_url ?? undefined}
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
                          {listing.listing_type === "hiring" ? "İşveren" : "İş Arayan"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {canManageListing && (
                        <Button
                          variant="secondary"
                          className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={handleDeleteListing}
                          loading={deletingListing}
                        >
                          <Trash2 size={16} />
                          İlanı Sil
                        </Button>
                      )}

                      {!canManageListing && (
                        <div className="space-y-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <MessageCircle size={16} />
                            İşverene Mesaj Gönder
                          </div>
                          <Textarea
                            value={dmText}
                            onChange={(event) => setDmText(event.target.value)}
                            placeholder="Merhaba, ilanınız hakkında bilgi almak istiyorum..."
                            rows={3}
                          />
                          <Button
                            variant="primary"
                            className="w-full gap-2"
                            onClick={handleSendMessage}
                            loading={dmSending}
                          >
                            <Send size={16} />
                            Mesaj Gönder
                          </Button>
                          {dmFeedback && <p className="text-xs text-neutral-500">{dmFeedback}</p>}
                        </div>
                      )}

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

                    {!canManageListing && (
                      <button
                        onClick={() => {
                          setReportFeedback(null);
                          setShowReportModal(true);
                        }}
                        className="flex items-center justify-center gap-2 w-full mt-4 p-2 text-sm text-neutral-500 hover:text-red-500 transition-colors"
                      >
                        <Flag size={16} />
                        İlanı Şikayet Et
                      </button>
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

      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-[rgba(var(--color-trust-rgb),0.5)] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={20} />
                  <h3 className="text-lg font-semibold">İlanı Şikayet Et</h3>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-neutral-500 hover:text-neutral-700"
                  aria-label="Kapat"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <Textarea
                  label="Şikayet Sebebi *"
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  placeholder="Örn: Yanıltıcı bilgi, spam, uygunsuz içerik..."
                  rows={3}
                />
                <Textarea
                  label="Ek Detaylar"
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                  placeholder="İsterseniz ekstra bilgi ekleyebilirsiniz."
                  rows={4}
                />

                {reportFeedback && (
                  <p className={`text-sm ${reportFeedback.includes("iletil") ? "text-green-600" : "text-red-500"}`}>
                    {reportFeedback}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    className="flex-1 min-w-0"
                    onClick={() => setShowReportModal(false)}
                    disabled={reportSending}
                  >
                    Vazgeç
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 min-w-0"
                    onClick={handleReportListing}
                    loading={reportSending}
                  >
                    Şikayeti Gönder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
