"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  JobListing,
  JOB_CATEGORY_LABELS,
  JOB_TYPE_LABELS,
  US_STATES_MAP,
} from "@/lib/types";
import Sidebar from "@/app/components/Sidebar";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";

type RelationshipStatus = "guest" | "self" | "none" | "pending_sent" | "pending_received" | "following";

const toErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") return fallback;

  const maybeError = error as { message?: string; details?: string; hint?: string };
  const parts = [maybeError.message, maybeError.details, maybeError.hint].filter(Boolean);
  return parts.length > 0 ? parts.join(" — ") : fallback;
};

export default function SeekerListingDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { user, role } = useAuth();
  const listingId = params.id as string;

  const [listing, setListing] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>("guest");
  const [followLoading, setFollowLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) return;

      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        let query = supabase
          .from("job_listings")
          .select("*, user:user_id (id, username, full_name, avatar_url)")
          .eq("id", listingId)
          .eq("listing_type", "seeking_job");

        if (role !== "admin") {
          if (user?.id) {
            query = query.or(`status.eq.approved,user_id.eq.${user.id}`);
          } else {
            query = query.eq("status", "approved");
          }
        }

        const { data, error: fetchError } = await query.single();

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            setNotFound(true);
            return;
          }
          throw fetchError;
        }

        if (!data) {
          setNotFound(true);
          return;
        }

        setListing(data);
      } catch (listingError: unknown) {
        console.error("Error fetching seeker listing:", listingError);
        setError(toErrorMessage(listingError, "Profil yüklenirken bir sorun oluştu."));
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId, role, user?.id]);

  useEffect(() => {
    const listingUserId = listing?.user?.id;
    if (!listingUserId) {
      setRelationshipStatus("none");
      return;
    }

    const checkRelationship = async () => {
      if (!user) {
        setRelationshipStatus("guest");
        return;
      }

      if (user.id === listingUserId) {
        setRelationshipStatus("self");
        return;
      }

      const { data: followData, error: followError } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", listingUserId)
        .limit(1);

      if (!followError && (followData?.length || 0) > 0) {
        setRelationshipStatus("following");
        return;
      }

      const { data: outgoing, error: outgoingError } = await supabase
        .from("friend_requests")
        .select("status")
        .eq("requester_id", user.id)
        .eq("receiver_id", listingUserId)
        .limit(1)
        .maybeSingle();

      if (!outgoingError && outgoing?.status === "pending") {
        setRelationshipStatus("pending_sent");
        return;
      }

      const { data: incoming, error: incomingError } = await supabase
        .from("friend_requests")
        .select("status")
        .eq("requester_id", listingUserId)
        .eq("receiver_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!incomingError && incoming?.status === "pending") {
        setRelationshipStatus("pending_received");
        return;
      }

      setRelationshipStatus("none");
    };

    checkRelationship();
  }, [listing?.user?.id, user]);

  const upsertFollow = async (targetUserId: string) => {
    if (!user) return false;
    const { error: followError } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetUserId });

    return !followError;
  };

  const deleteFollow = async (targetUserId: string) => {
    if (!user) return false;
    const { error: followError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);

    return !followError;
  };

  const handleToggleFollow = async () => {
    const listingUserId = listing?.user?.id;
    if (!listingUserId) return;

    if (!user) {
      router.push(`/login?redirect=/is/ariyorum/${listingId}`);
      return;
    }

    if (user.id === listingUserId) return;

    setFollowLoading(true);
    try {
      if (relationshipStatus === "following") {
        const removed = await deleteFollow(listingUserId);
        if (removed) setRelationshipStatus("none");
        return;
      }

      if (relationshipStatus === "pending_sent") {
        const { error: cancelError } = await supabase
          .from("friend_requests")
          .delete()
          .eq("requester_id", user.id)
          .eq("receiver_id", listingUserId)
          .eq("status", "pending");

        if (!cancelError) setRelationshipStatus("none");
        return;
      }

      if (relationshipStatus === "pending_received") {
        const { error: acceptError } = await supabase
          .from("friend_requests")
          .update({ status: "accepted", responded_at: new Date().toISOString() })
          .eq("requester_id", listingUserId)
          .eq("receiver_id", user.id)
          .eq("status", "pending");

        if (!acceptError) {
          await upsertFollow(listingUserId);
          setRelationshipStatus("following");
        }
        return;
      }

      const { error: requestError } = await supabase
        .from("friend_requests")
        .upsert(
          { requester_id: user.id, receiver_id: listingUserId, status: "pending" },
          { onConflict: "requester_id,receiver_id" }
        );

      if (!requestError) {
        setRelationshipStatus("pending_sent");
        return;
      }

      const followed = await upsertFollow(listingUserId);
      if (followed) setRelationshipStatus("following");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const listingUserId = listing?.user?.id;
    if (!listingUserId) return;

    if (!user) {
      router.push(`/login?redirect=/is/ariyorum/${listingId}`);
      return;
    }

    if (user.id === listingUserId) return;

    setDmLoading(true);
    try {
      const { data: rpcConversationId } = await supabase
        .rpc("create_direct_conversation", { target_user_id: listingUserId });

      if (rpcConversationId) {
        router.push(`/messages?conversation=${rpcConversationId}`);
        return;
      }

      const { data: myRows } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      const myConversationIds = ((myRows as Array<{ conversation_id: string }> | null) || [])
        .map((row) => row.conversation_id);

      if (myConversationIds.length > 0) {
        const { data: targetRows } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", listingUserId)
          .in("conversation_id", myConversationIds);

        const existingConversationId =
          (targetRows as Array<{ conversation_id: string }> | null)?.[0]?.conversation_id;

        if (existingConversationId) {
          router.push(`/messages?conversation=${existingConversationId}`);
          return;
        }
      }

      let conversationId = "";
      for (const payload of [{ is_group: false, created_by: user.id }, { is_group: false }, {}]) {
        const { data, error: createError } = await supabase
          .from("conversations")
          .insert(payload)
          .select("id")
          .single();

        if (!createError && data?.id) {
          conversationId = data.id as string;
          break;
        }
      }

      if (!conversationId) {
        router.push("/messages");
        return;
      }

      await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: user.id },
        { conversation_id: conversationId, user_id: listingUserId },
      ]);

      router.push(`/messages?conversation=${conversationId}`);
    } finally {
      setDmLoading(false);
    }
  };

  const getFollowButtonLabel = () => {
    if (relationshipStatus === "following") return "Takiptesin";
    if (relationshipStatus === "pending_sent") return "İstek Gönderildi";
    if (relationshipStatus === "pending_received") return "İsteği Kabul Et";
    return "Arkadaşlık İsteği Gönder";
  };

  const getFollowIcon = () => {
    if (relationshipStatus === "following") return <UserCheck size={15} />;
    if (relationshipStatus === "pending_sent") return <UserX size={15} />;
    return <UserPlus size={15} />;
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <section className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border-light)]">
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
              <Link href="/is/ariyorum">
                <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2">
                  <ArrowLeft size={16} />
                  İş Arıyorum
                </Button>
              </Link>
              <h1 className="text-3xl font-semibold text-[var(--color-ink)]">Aday Profili</h1>
              <p className="text-[var(--color-ink-secondary)] mt-1">Özgeçmiş ve iletişim detayları</p>
            </div>
          </section>

          <section className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, idx) => (
                  <Card key={idx} variant="elevated" className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 w-1/2 bg-[var(--color-surface-sunken)] rounded mb-3" />
                      <div className="h-4 w-1/3 bg-[var(--color-surface-sunken)] rounded mb-5" />
                      <div className="h-4 w-full bg-[var(--color-surface-sunken)] rounded mb-2" />
                      <div className="h-4 w-5/6 bg-[var(--color-surface-sunken)] rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : notFound ? (
              <Card variant="default">
                <CardContent className="p-12 text-center">
                  <h2 className="text-2xl font-semibold text-[var(--color-ink)] mb-3">Profil bulunamadı</h2>
                  <p className="text-[var(--color-ink-secondary)] mb-6">
                    Bu ilan kaldırılmış olabilir veya görüntüleme yetkiniz olmayabilir.
                  </p>
                  <Link href="/is/ariyorum">
                    <Button variant="primary">Listeye Dön</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : error ? (
              <Card variant="default">
                <CardContent className="p-8">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </CardContent>
              </Card>
            ) : listing ? (
              <div className="space-y-6">
                <Card variant="elevated">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <CardTitle className="text-2xl">{listing.title}</CardTitle>
                      <Badge variant="primary" size="sm">{JOB_CATEGORY_LABELS[listing.category]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex flex-wrap gap-4 text-sm text-[var(--color-ink-secondary)]">
                      <span className="flex items-center gap-1.5"><MapPin size={15} />{listing.city}, {US_STATES_MAP[listing.state] || listing.state}</span>
                      <span className="flex items-center gap-1.5"><Clock size={15} />{JOB_TYPE_LABELS[listing.job_type]}</span>
                      {listing.is_remote && <Badge variant="info" size="sm">Uzaktan Çalışmaya Uygun</Badge>}
                    </div>

                    <p className="text-[var(--color-ink-secondary)] whitespace-pre-wrap leading-relaxed">{listing.description}</p>

                    {listing.skills && listing.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {listing.skills.map((skill, index) => (
                          <Badge key={`${skill}-${index}`} variant="outline" size="sm">{skill}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={listing.user?.avatar_url || undefined}
                        fallback={listing.user?.full_name || listing.user?.username || "?"}
                        size="lg"
                      />
                      <div>
                        <p className="font-semibold text-[var(--color-ink)]">{listing.user?.full_name || listing.user?.username || "Anonim Kullanıcı"}</p>
                        {listing.user?.id && (
                          <Link href={`/profile/${listing.user.id}`} className="text-sm text-[var(--color-primary)] hover:underline">
                            Profili Görüntüle
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--color-border-light)]">
                      {listing.contact_email && (
                        <a href={`mailto:${listing.contact_email}`}>
                          <Button variant="secondary" size="sm" className="gap-2"><Mail size={15} />E-posta</Button>
                        </a>
                      )}

                      {listing.contact_phone && (
                        <a href={`tel:${listing.contact_phone}`}>
                          <Button variant="secondary" size="sm" className="gap-2"><Phone size={15} />Ara</Button>
                        </a>
                      )}

                      <Button
                        variant={relationshipStatus === "following" ? "secondary" : "primary"}
                        size="sm"
                        className="gap-2"
                        onClick={handleToggleFollow}
                        disabled={followLoading || relationshipStatus === "self"}
                      >
                        {getFollowIcon()}
                        {getFollowButtonLabel()}
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        onClick={handleSendMessage}
                        disabled={dmLoading || user?.id === listing.user?.id}
                      >
                        {dmLoading ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
                        Özel Mesaj
                      </Button>

                      {listing.user?.id && (
                        <Link href={`/profile/${listing.user.id}`}>
                          <Button variant="secondary" size="sm" className="gap-2">
                            <Briefcase size={15} />
                            Profil Görüntüle
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
