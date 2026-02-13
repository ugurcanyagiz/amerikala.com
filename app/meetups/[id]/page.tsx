"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
  Event,
  EventAttendee,
  EVENT_CATEGORY_LABELS, 
  EVENT_CATEGORY_ICONS,
  EVENT_CATEGORY_COLORS,
  US_STATES_MAP
} from "@/lib/types";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Modal } from "@/app/components/ui/Modal";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  DollarSign,
  Share2,
  Heart,
  Loader2,
  CheckCircle2,
  ExternalLink,
  UserPlus,
  UserMinus,
  Copy,
  Twitter,
  Facebook,
  MessageCircle
} from "lucide-react";

type BasicProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  profession: string | null;
};

type EventComment = {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: BasicProfile | BasicProfile[] | null;
};

type LegacyEventRecord = Record<string, unknown> & {
  organizer_id?: string | null;
  created_by?: string | null;
  organizer?: BasicProfile | BasicProfile[] | null;
  creator?: BasicProfile | BasicProfile[] | null;
};

type MeetupEventDetail = Omit<Event, "organizer"> & {
  organizer?: BasicProfile | null;
  created_by?: string | null;
};

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();

  const [event, setEvent] = useState<MeetupEventDetail | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<BasicProfile | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const ATTENDEE_PROFILE_SELECT_FULL = "id, username, full_name, first_name, last_name, avatar_url";
  const ATTENDEE_PROFILE_SELECT_MINIMAL = "id, username, full_name, avatar_url";

  const resolveProfile = (profile?: BasicProfile | BasicProfile[] | null) => {
    if (!profile) return null;
    return Array.isArray(profile) ? profile[0] || null : profile;
  };

  const isAbortLikeError = (error: unknown) => {
    if (!error || typeof error !== "object") return false;
    const message = "message" in error ? String((error as { message?: string }).message || "") : "";
    const details = "details" in error ? String((error as { details?: string }).details || "") : "";
    const code = "code" in error ? String((error as { code?: string }).code || "") : "";
    const combined = `${message} ${details} ${code}`.toLowerCase();
    return combined.includes("aborted") || combined.includes("aborterror");
  };

  const fetchProfilesByIds = useCallback(async (userIds: string[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    if (uniqueIds.length === 0) return new Map<string, BasicProfile>();

    const runProfileQuery = async (selectFields: string) => {
      return supabase
        .from("profiles")
        .select(selectFields)
        .in("id", uniqueIds);
    };

    let { data, error } = await runProfileQuery(ATTENDEE_PROFILE_SELECT_FULL);

    if (error) {
      const fallback = await runProfileQuery(ATTENDEE_PROFILE_SELECT_MINIMAL);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      if (!isAbortLikeError(error)) {
        console.error("fetchProfilesByIds failed:", error);
      }
      return new Map<string, BasicProfile>();
    }

    const profileMap = new Map<string, BasicProfile>();
    ((data as BasicProfile[] | null) || []).forEach((profile) => {
      if (profile.id) {
        profileMap.set(profile.id, profile);
      }
    });

    return profileMap;
  }, []);

  const normalizeAttendees = (rows: Array<Record<string, unknown>> | null) => {
    return (rows || []).map((row) => {
      const profile = resolveProfile(row.profile as BasicProfile | BasicProfile[] | null | undefined);

      const eventIdValue = typeof row.event_id === "string" ? row.event_id : "";
      const userIdValue = typeof row.user_id === "string" ? row.user_id : "";
      const statusValue = typeof row.status === "string" ? row.status : "going";
      const createdAtValue = typeof row.created_at === "string" ? row.created_at : new Date().toISOString();

      return {
        event_id: eventIdValue,
        user_id: userIdValue,
        status: statusValue as EventAttendee["status"],
        created_at: createdAtValue,
        profile: profile
          ? {
              id: profile.id || "",
              username: profile.username ?? null,
              full_name: profile.full_name ?? null,
              first_name: profile.first_name ?? null,
              last_name: profile.last_name ?? null,
              avatar_url: profile.avatar_url ?? null,
              bio: profile.bio ?? null,
              city: profile.city ?? null,
              state: profile.state ?? null,
              profession: profile.profession ?? null,
            }
          : null,
      } as EventAttendee;
    });
  };

  const fetchAttendees = useCallback(async () => {
    const profileSelect = "id, username, full_name, first_name, last_name, avatar_url, bio, city, state, profession";

    const withProfileResult = await supabase
      .from("event_attendees")
      .select(`event_id, user_id, status, created_at, profile:user_id (${profileSelect})`)
      .eq("event_id", eventId)
      .eq("status", "going");

    const fallbackResult = withProfileResult.error
      ? await supabase
          .from("event_attendees")
          .select("event_id, user_id, status, created_at")
          .eq("event_id", eventId)
          .eq("status", "going")
      : null;

    const error = withProfileResult.error ? fallbackResult?.error ?? withProfileResult.error : null;

    if (error) {
      if (!isAbortLikeError(error)) {
        console.error("fetchAttendees failed:", error);
      }
      return;
    }

    const attendeeRows = ((withProfileResult.error ? fallbackResult?.data : withProfileResult.data) as Array<Record<string, unknown>> | null) || [];
    const rowsWithProfile = attendeeRows.filter((row) => resolveProfile(row.profile as BasicProfile | BasicProfile[] | null));

    const normalizedRows = rowsWithProfile.length === attendeeRows.length
      ? attendeeRows
      : (() => {
          const profileMapPromise = fetchProfilesByIds(
            attendeeRows.map((row) => (typeof row.user_id === "string" ? row.user_id : "")).filter(Boolean)
          );
          return profileMapPromise.then((profileMap) =>
            attendeeRows.map((row) => ({
              ...row,
              profile:
                resolveProfile(row.profile as BasicProfile | BasicProfile[] | null)
                || profileMap.get((row.user_id as string) || "")
                || null,
            }))
          );
        })();

    const list = normalizeAttendees(Array.isArray(normalizedRows) ? normalizedRows : await normalizedRows);

    setAttendees(list);

    if (user) {
      setAttending(list.some((item) => item.user_id === user.id));
    }
  }, [eventId, user, fetchProfilesByIds]);

  // Fetch event
  useEffect(() => {
    let isActive = true;

    const fetchEvent = async () => {
      setLoading(true);
      try {
        const eventSelectWithBothRelations = `
            *,
            organizer:organizer_id (${ATTENDEE_PROFILE_SELECT_FULL}, bio, city, state, profession),
            creator:created_by (${ATTENDEE_PROFILE_SELECT_FULL}, bio, city, state, profession)
          `;
        const eventSelectWithOrganizerOnly = `
            *,
            organizer:organizer_id (${ATTENDEE_PROFILE_SELECT_FULL}, bio, city, state, profession)
          `;

        let eventData: LegacyEventRecord | null = null;
        let eventError: unknown = null;

        const eventWithBothRelations = await supabase
          .from("events")
          .select(eventSelectWithBothRelations)
          .eq("id", eventId)
          .single();

        if (!eventWithBothRelations.error && eventWithBothRelations.data) {
          eventData = eventWithBothRelations.data as LegacyEventRecord;
        } else {
          const eventWithOrganizerOnly = await supabase
            .from("events")
            .select(eventSelectWithOrganizerOnly)
            .eq("id", eventId)
            .single();

          if (!eventWithOrganizerOnly.error && eventWithOrganizerOnly.data) {
            eventData = eventWithOrganizerOnly.data as LegacyEventRecord;
          } else {
            const eventWithoutRelations = await supabase
              .from("events")
              .select("*")
              .eq("id", eventId)
              .single();

            if (!eventWithoutRelations.error && eventWithoutRelations.data) {
              eventData = eventWithoutRelations.data as LegacyEventRecord;
            } else {
              eventError = eventWithoutRelations.error || eventWithOrganizerOnly.error || eventWithBothRelations.error;
            }
          }
        }

        if (eventError) {
          throw eventError;
        }

        if (!eventData) {
          throw new Error("Event data missing");
        }

        {
          const eventRecordForOrganizer = eventData as LegacyEventRecord;
          const eventRow = eventData as unknown as MeetupEventDetail;
          const organizerProfileFromJoinedData =
            resolveProfile(eventRecordForOrganizer.organizer)
            || resolveProfile(eventRecordForOrganizer.creator);
          const organizerUserId =
            (typeof eventRecordForOrganizer.organizer_id === "string" && eventRecordForOrganizer.organizer_id)
            || (typeof eventRecordForOrganizer.created_by === "string" && eventRecordForOrganizer.created_by)
            || "";

          const organizerProfilesById = organizerProfileFromJoinedData || !organizerUserId
            ? new Map<string, BasicProfile>()
            : await fetchProfilesByIds([organizerUserId]);

          if (isActive) {
            setEvent({
              ...eventRow,
              organizer: organizerProfileFromJoinedData || organizerProfilesById.get(organizerUserId) || undefined,
            });
          }
        }

        await fetchAttendees();

        const { data: commentsData, error: commentsError } = await supabase
          .from("event_comments")
          .select("id, event_id, user_id, content, created_at")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (commentsError) {
          if (isActive && !isAbortLikeError(commentsError)) {
            setCommentError("Yorumlar şu an yüklenemedi.");
          }
        } else {
          const commentRows = (commentsData as EventComment[] | null) || [];
          const commentProfileMap = await fetchProfilesByIds(commentRows.map((comment) => comment.user_id));
          if (isActive) {
            setComments(
              commentRows.map((comment) => ({
                ...comment,
                profile: commentProfileMap.get(comment.user_id) || null,
              }))
            );
            setCommentError(null);
          }
        }

      } catch (error) {
        if (!isAbortLikeError(error)) {
          console.error("Error fetching event:", error);
        }
        if (isActive) {
          setEvent(null);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    if (eventId) {
      fetchEvent();
    }

    return () => {
      isActive = false;
    };
  }, [eventId, fetchAttendees, fetchProfilesByIds]);

  // Handle attendance
  const handleAttendance = async () => {
    if (!user) {
      router.push(`/login?redirect=/meetups/${eventId}`);
      return;
    }

    setAttendanceLoading(true);
    setAttendanceError(null);

    try {
      if (attending) {
        // Remove attendance (fallback to status update if hard delete fails due policies)
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) {
          const { error: updateError } = await supabase
            .from("event_attendees")
            .update({ status: "not_going" })
            .eq("event_id", eventId)
            .eq("user_id", user.id);

          if (updateError) throw updateError;
        }

        await fetchAttendees();
      } else {
        // Add attendance (upsert first, then fallback insert/update for schema-policy tolerance)
        const { error: upsertError } = await supabase
          .from("event_attendees")
          .upsert(
            {
              event_id: eventId,
              user_id: user.id,
              status: "going",
            },
            {
              onConflict: "event_id,user_id",
              ignoreDuplicates: false,
            }
          );

        if (upsertError) {
          const { error: insertError } = await supabase
            .from("event_attendees")
            .insert({
              event_id: eventId,
              user_id: user.id,
              status: "going",
            });

          if (insertError) {
            const { error: updateError } = await supabase
              .from("event_attendees")
              .update({ status: "going" })
              .eq("event_id", eventId)
              .eq("user_id", user.id);

            if (updateError) throw updateError;
          }
        }

        const { data: insertedAttendee, error: attendeeFetchError } = await supabase
          .from("event_attendees")
          .select("event_id, user_id, status, created_at")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .single();

        if (attendeeFetchError) {
          await fetchAttendees();
          return;
        }

        const insertedProfileMap = await fetchProfilesByIds([user.id]);
        const normalizedAttendee = normalizeAttendees([
          {
            ...(insertedAttendee as unknown as Record<string, unknown>),
            profile: insertedProfileMap.get(user.id) || null,
          },
        ])[0];

        if (normalizedAttendee) {
          setAttending(true);
          setAttendees((prev) => {
            const filtered = prev.filter((item) => item.user_id !== user.id);
            return [...filtered, normalizedAttendee];
          });
        } else {
          await fetchAttendees();
        }
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      setAttendanceError("Katılım işlemi tamamlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const getDisplayName = (profile?: BasicProfile | BasicProfile[] | null) => {
    if (!profile) return "Anonim";
    const p = Array.isArray(profile) ? profile[0] : profile;
    if (!p) return "Anonim";
    return [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.full_name || p.username || "Anonim";
  };

  const getProfileRecord = (profile?: BasicProfile | BasicProfile[] | null) => resolveProfile(profile);

  const getUsernameLabel = (profile?: BasicProfile | BasicProfile[] | null) => {
    const p = getProfileRecord(profile);
    if (!p?.username) return "@kullanici";
    return p.username.startsWith("@") ? p.username : `@${p.username}`;
  };

  const checkFollowing = async (targetUserId: string) => {
    if (!user || user.id === targetUserId) return;
    const candidates: Array<{ from: string; to: string }> = [
      { from: "follower_id", to: "following_id" },
      { from: "user_id", to: "target_user_id" },
      { from: "user_id", to: "followed_user_id" },
    ];

    for (const pair of candidates) {
      const { data, error } = await supabase
        .from("follows")
        .select("*")
        .eq(pair.from, user.id)
        .eq(pair.to, targetUserId)
        .limit(1);

      if (!error) {
        setIsFollowing((data?.length || 0) > 0);
        return;
      }
    }

    setIsFollowing(false);
  };

  const handleToggleFollow = async () => {
    if (!user || !selectedAttendee || user.id === selectedAttendee.id) return;
    setFollowLoading(true);

    try {
      const pairs: Array<{ from: string; to: string }> = [
        { from: "follower_id", to: "following_id" },
        { from: "user_id", to: "target_user_id" },
        { from: "user_id", to: "followed_user_id" },
      ];

      if (isFollowing) {
        for (const pair of pairs) {
          const { error } = await supabase
            .from("follows")
            .delete()
            .eq(pair.from, user.id)
            .eq(pair.to, selectedAttendee.id);
          if (!error) {
            setIsFollowing(false);
            return;
          }
        }
      } else {
        for (const pair of pairs) {
          const { error } = await supabase
            .from("follows")
            .insert({ [pair.from]: user.id, [pair.to]: selectedAttendee.id });
          if (!error) {
            setIsFollowing(true);
            return;
          }
        }
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedAttendee || user.id === selectedAttendee.id) return;
    setDmLoading(true);
    try {
      const { data: myRows } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      const candidateConversationIds = ((myRows as Array<{ conversation_id: string }> | null) || []).map((row) => row.conversation_id);
      if (candidateConversationIds.length > 0) {
        const { data: otherRows } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", selectedAttendee.id)
          .in("conversation_id", candidateConversationIds);

        const existingId = (otherRows as Array<{ conversation_id: string }> | null)?.[0]?.conversation_id;
        if (existingId) {
          router.push(`/messages?conversation=${existingId}`);
          return;
        }
      }

      const conversationPayloads = [
        { is_group: false, created_by: user.id },
        { is_group: false },
        {},
      ];

      let conversationId = "";
      for (const payload of conversationPayloads) {
        const { data, error } = await supabase.from("conversations").insert(payload).select("id").single();
        if (!error && data?.id) {
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
        { conversation_id: conversationId, user_id: selectedAttendee.id },
      ]);

      router.push(`/messages?conversation=${conversationId}`);
    } finally {
      setDmLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!user || !commentInput.trim() || !attending) return;
    setCommentLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_comments")
        .insert({
          event_id: eventId,
          user_id: user.id,
          content: commentInput.trim(),
        })
        .select("id, event_id, user_id, content, created_at")
        .single();

      if (error) {
        if (!isAbortLikeError(error)) {
          setCommentError("Yorum paylaşılırken bir sorun oluştu.");
        }
        return;
      }

      if (data) {
        const commentProfileMap = await fetchProfilesByIds([user.id]);
        setComments((prev) => [
          {
            ...(data as EventComment),
            profile: commentProfileMap.get(user.id) || null,
          },
          ...prev,
        ]);
      }
      setCommentInput("");
      setCommentError(null);
    } finally {
      setCommentLoading(false);
    }
  };

  // Copy link
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", { 
      weekday: "long",
      day: "numeric", 
      month: "long",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Etkinlik Bulunamadı</h1>
          <p className="text-neutral-500 mb-4">Bu etkinlik mevcut değil veya kaldırılmış olabilir.</p>
          <Link href="/meetups">
            <Button variant="primary">Etkinliklere Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  const organizer = (event.organizer as BasicProfile | null | undefined) || null;
  const isFull = event.max_attendees && event.current_attendees >= event.max_attendees;
  const isPast = new Date(event.event_date) < new Date(new Date().toDateString());

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Cover Image */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-red-500 to-orange-500">
        {event.cover_image_url ? (
          <img 
            src={event.cover_image_url} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
            <img src="/logo.png" alt="No picture" className="h-28 w-28 object-contain opacity-90" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Link href="/meetups">
            <Button variant="secondary" size="sm" className="gap-2">
              <ArrowLeft size={18} />
              Geri
            </Button>
          </Link>
        </div>

        {/* Category Badge */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${EVENT_CATEGORY_COLORS[event.category]}`}>
            {EVENT_CATEGORY_ICONS[event.category]} {EVENT_CATEGORY_LABELS[event.category]}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Card */}
            <Card className="glass">
              <CardContent className="p-6">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4">{event.title}</h1>
                
                {/* Date & Time */}
                <div className="flex flex-wrap gap-4 text-neutral-600 dark:text-neutral-400 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-red-500" />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-red-500" />
                    <span>
                      {event.start_time.slice(0, 5)}
                      {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 text-neutral-600 dark:text-neutral-400 mb-6">
                  {event.is_online ? (
                    <>
                      <Globe size={20} className="text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Online Etkinlik</p>
                        {event.online_url && (
                          <a 
                            href={event.online_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center gap-1 mt-1"
                          >
                            Etkinlik Linkine Git
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <MapPin size={20} className="text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{event.location_name}</p>
                        {event.address && <p className="text-sm">{event.address}</p>}
                        <p className="text-sm">{event.city}, {US_STATES_MAP[event.state] || event.state} {event.zip_code}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Price */}
                {!event.is_free && (
                  <div className="flex items-center gap-2 mb-6">
                    <DollarSign size={20} className="text-green-500" />
                    <span className="text-lg font-semibold">${event.price}</span>
                    <span className="text-neutral-500">/ kişi</span>
                  </div>
                )}

                {/* Attendance Button */}
                <div className="flex flex-wrap gap-3">
                  {isPast ? (
                    <Badge variant="default" size="lg">Etkinlik Sona Erdi</Badge>
                  ) : isFull && !attending ? (
                    <Badge variant="warning" size="lg">Kontenjan Dolu</Badge>
                  ) : (
                    <Button
                      variant={attending ? "outline" : "primary"}
                      size="lg"
                      onClick={handleAttendance}
                      disabled={attendanceLoading}
                      className="gap-2"
                    >
                      {attendanceLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : attending ? (
                        <>
                          <UserMinus size={18} />
                          Katılımı İptal Et
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} />
                          Katıl
                        </>
                      )}
                    </Button>
                  )}

                  {/* Share Buttons */}
                  <Button variant="outline" size="lg" onClick={copyLink} className="gap-2">
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    {copied ? "Kopyalandı!" : "Link Kopyala"}
                  </Button>
                </div>
                {attendanceError && (
                  <p className="mt-3 text-sm text-red-500">{attendanceError}</p>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Etkinlik Hakkında</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Attendees */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users size={20} />
                    Katılımcılar
                  </span>
                  <Badge variant="primary">
                    {attendees.length}
                    {event.max_attendees && ` / ${event.max_attendees}`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendees.length === 0 ? (
                  <p className="text-neutral-500 text-center py-4">
                    Henüz katılımcı yok. İlk katılan sen ol!
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {attendees.map(attendee => {
                      const profile = getProfileRecord(attendee.profile as BasicProfile | BasicProfile[] | null);
                      return (
                        <button
                          key={attendee.user_id} 
                          onClick={() => {
                            if (profile) {
                              setSelectedAttendee(profile);
                              if (user && user.id !== profile.id) {
                                checkFollowing(profile.id);
                              }
                            }
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                        >
                          <Avatar 
                            src={profile?.avatar_url || "/logo.png"} 
                            fallback={getDisplayName(profile)} 
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{getDisplayName(profile)}</p>
                            <p className="text-xs text-neutral-500 truncate">{getUsernameLabel(profile)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle size={20} />
                  Etkinlik Aktivitesi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {attending ? (
                  <div className="space-y-2">
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 p-3 text-sm outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Katıldığın bu etkinlik hakkında bir yorum yaz..."
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleCommentSubmit}
                        disabled={commentLoading || !commentInput.trim()}
                      >
                        {commentLoading ? "Paylaşılıyor..." : "Yorum Paylaş"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    Yorum yazabilmek için önce etkinliğe katılman gerekiyor.
                  </p>
                )}

                {commentError && <p className="text-sm text-red-500">{commentError}</p>}

                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-neutral-500">Henüz yorum yok. İlk yorumu sen yaz!</p>
                  ) : (
                    comments.map((comment) => {
                      const commentProfile = getProfileRecord(comment.profile);
                      return (
                        <div key={comment.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => {
                                if (commentProfile) {
                                  setSelectedAttendee(commentProfile);
                                  if (user && user.id !== commentProfile.id) {
                                    checkFollowing(commentProfile.id);
                                  }
                                }
                              }}
                              className="flex items-center gap-2"
                            >
                              <Avatar
                                src={commentProfile?.avatar_url || "/logo.png"}
                                fallback={getDisplayName(commentProfile)}
                                size="sm"
                              />
                              <div className="text-left">
                                <p className="text-sm font-semibold">{getDisplayName(commentProfile)}</p>
                                <p className="text-xs text-neutral-500">{new Date(comment.created_at).toLocaleString("tr-TR")}</p>
                              </div>
                            </button>
                          </div>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Organizatör</CardTitle>
              </CardHeader>
              <CardContent>
                <Link 
                  href={`/profile/${organizer?.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Avatar 
                    src={organizer?.avatar_url || "/logo.png"} 
                    fallback={getDisplayName(organizer) || "O"} 
                    size="lg"
                  />
                  <div>
                    <p className="font-semibold">
                      {getDisplayName(organizer) || "Organizatör"}
                    </p>
                    <p className="text-sm text-neutral-500">{getUsernameLabel(organizer)}</p>
                  </div>
                </Link>
                {organizer?.bio && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-3 line-clamp-3">
                    {organizer.bio}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Share */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 size={18} />
                  Paylaş
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(window.location.href)}`, "_blank")}
                  >
                    <Twitter size={18} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank")}
                  >
                    <Facebook size={18} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(event.title + " - " + window.location.href)}`, "_blank")}
                  >
                    <MessageCircle size={18} />
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={copyLink}
                  >
                    {copied ? "Kopyalandı!" : "Link Kopyala"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card className="glass">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Kategori</span>
                  <span className="font-medium">{EVENT_CATEGORY_LABELS[event.category]}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Ücret</span>
                  <span className="font-medium">{event.is_free ? "Ücretsiz" : `$${event.price}`}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Kapasite</span>
                  <span className="font-medium">
                    {event.max_attendees ? `${event.current_attendees}/${event.max_attendees}` : "Sınırsız"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Konum</span>
                  <span className="font-medium">{event.is_online ? "Online" : event.state}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        open={!!selectedAttendee}
        onClose={() => setSelectedAttendee(null)}
        title={selectedAttendee ? getDisplayName(selectedAttendee) : "Profil"}
        description={selectedAttendee?.username ? `@${selectedAttendee.username}` : "Etkinlik katılımcısı"}
      >
        {selectedAttendee && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar
                src={selectedAttendee.avatar_url || "/logo.png"}
                fallback={getDisplayName(selectedAttendee)}
                size="xl"
              />
              <div>
                <p className="text-lg font-semibold">{getDisplayName(selectedAttendee)}</p>
                <p className="text-sm text-neutral-500">{selectedAttendee.profession || "Topluluk üyesi"}</p>
                <p className="text-sm text-neutral-500">
                  {[selectedAttendee.city, selectedAttendee.state].filter(Boolean).join(", ") || "Konum belirtilmemiş"}
                </p>
              </div>
            </div>

            {selectedAttendee.bio && (
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedAttendee.bio}</p>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <Button
                variant={isFollowing ? "outline" : "primary"}
                onClick={handleToggleFollow}
                disabled={!user || user.id === selectedAttendee.id || followLoading}
                className="gap-2"
              >
                <Heart size={16} />
                {isFollowing ? "Takibi Bırak" : "Arkadaş Ekle / Takip Et"}
              </Button>

              <Button
                variant="outline"
                onClick={handleSendMessage}
                disabled={!user || user.id === selectedAttendee.id || dmLoading}
                className="gap-2"
              >
                <MessageCircle size={16} />
                Özel Mesaj Gönder
              </Button>

              <Link href={`/profile/${selectedAttendee.id}`} className="sm:col-span-2">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink size={16} />
                  Profili Görüntüle
                </Button>
              </Link>

              <Link href="/groups/create" className="sm:col-span-2">
                <Button variant="outline" className="w-full gap-2">
                  <Users size={16} />
                  Birlikte Grup Oluştur
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
