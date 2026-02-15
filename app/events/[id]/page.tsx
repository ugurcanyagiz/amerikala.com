"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { ensureProfileExists } from "@/lib/supabase/ensureProfile";
import { useAuth } from "../../contexts/AuthContext";
import {
  Event,
  Profile,
  EVENT_CATEGORY_LABELS,
  EVENT_CATEGORY_ICONS,
  EVENT_CATEGORY_COLORS,
  US_STATES_MAP
} from "@/lib/types";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Share2,
  Heart,
  Bookmark,
  MessageCircle,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Mail,
  Globe,
  Loader2,
  Link as LinkIcon
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Textarea } from "../../components/ui/Textarea";

type EventWithOrganizer = Omit<Event, "organizer"> & {
  organizer?: Profile;
  creator?: Profile;
  created_by?: string | null;
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const eventId = params.id as string;

  // State
  const [event, setEvent] = useState<EventWithOrganizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAttending, setIsAttending] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [similarEvents, setSimilarEvents] = useState<Event[]>([]);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch event with organizer
        const eventWithFk = await supabase
          .from("events")
          .select(`
            *,
            organizer:profiles!events_organizer_id_fkey (id, username, first_name, last_name, full_name, avatar_url, bio),
            creator:profiles!events_created_by_fkey (id, username, first_name, last_name, full_name, avatar_url, bio)
          `)
          .eq("id", eventId)
          .single();

        const eventWithLegacy = eventWithFk.error
          ? await supabase
              .from("events")
              .select(`
                *,
                organizer:organizer_id (id, username, first_name, last_name, full_name, avatar_url, bio),
                creator:created_by (id, username, first_name, last_name, full_name, avatar_url, bio)
              `)
              .eq("id", eventId)
              .single()
          : eventWithFk;

        const eventData = eventWithLegacy.data as EventWithOrganizer | null;
        const eventError = eventWithLegacy.error;

        if (eventError) {
          if (eventError.code === "PGRST116") {
            setError("Etkinlik bulunamadı");
          } else {
            setError("Etkinlik yüklenirken bir hata oluştu");
          }
          return;
        }

        if (!eventData) {
          setError("Etkinlik verisi alınamadı");
          return;
        }

        setEvent(eventData);

        // Check if user is attending
        if (user) {
          const { data: attendeeData } = await supabase
            .from("event_attendees")
            .select("status")
            .eq("event_id", eventId)
            .eq("user_id", user.id)
            .single();

          if (attendeeData) {
            setIsAttending(attendeeData.status === "going");
          }
        }

        // Fetch similar events (same category, different event)
        const { data: similarData } = await supabase
          .from("events")
          .select("*")
          .eq("category", eventData.category)
          .eq("status", "approved")
          .neq("id", eventId)
          .gte("event_date", new Date().toISOString().split("T")[0])
          .order("event_date", { ascending: true })
          .limit(3);

        if (similarData) {
          setSimilarEvents(similarData);
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId, user]);

  // Handle attendance
  const handleJoin = async () => {
    if (!user) {
      router.push(`/login?redirect=/events/${eventId}`);
      return;
    }

    setAttendanceLoading(true);
    setAttendanceError(null);

    try {
      const { error: profileError } = await ensureProfileExists(user);
      if (profileError) {
        throw profileError;
      }

      if (isAttending) {
        const { error: deleteError } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (deleteError) {
          const { error: updateError } = await supabase
            .from("event_attendees")
            .update({ status: "not_going" })
            .eq("event_id", eventId)
            .eq("user_id", user.id);

          if (updateError) {
            throw updateError;
          }
        }
      } else {
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

            if (updateError) {
              throw updateError;
            }
          }
        }
      }

      const [{ data: attendeeData }, { count: attendeeCount, error: attendeeCountError }] = await Promise.all([
        supabase
          .from("event_attendees")
          .select("status")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("event_attendees")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId)
          .eq("status", "going"),
      ]);

      if (attendeeCountError) {
        throw attendeeCountError;
      }

      setIsAttending(attendeeData?.status === "going");

      if (event) {
        setEvent({
          ...event,
          current_attendees: attendeeCount || 0,
        });
      }
    } catch (err) {
      console.error("Error updating attendance:", err);
      setAttendanceError("Katılım işlemi tamamlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Share event
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
    }
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

  // Format time
  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </main>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="flex">
          <Sidebar />
          <main className="flex-1">
            <div className="ak-shell lg:px-8 py-8">
              <Link href="/events">
                <Button variant="ghost" className="gap-2 mb-6">
                  <ArrowLeft size={18} />
                  Etkinliklere Dön
                </Button>
              </Link>
              <Card variant="elevated">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-ink-faint mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">{error || "Etkinlik bulunamadı"}</h2>
                  <p className="text-ink-muted mb-6">
                    Bu etkinlik silinmiş veya hiç var olmamış olabilir.
                  </p>
                  <Link href="/events">
                    <Button variant="primary">Etkinliklere Dön</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const organizer = event.organizer || event.creator;
  const organizerName = [organizer?.first_name, organizer?.last_name].filter(Boolean).join(" ").trim()
    || organizer?.full_name
    || organizer?.username
    || "Anonim";

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="ak-shell lg:px-8 py-6">
            {/* Back Button */}
            <Link href="/events">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft size={18} />
                Etkinliklere Dön
              </Button>
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Hero Image */}
                <Card variant="elevated" className="overflow-hidden">
                  <div className="relative h-[320px] sm:h-[400px]">
                    {event.cover_image_url ? (
                      <img
                        src={event.cover_image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                        <span className="text-8xl">{EVENT_CATEGORY_ICONS[event.category]}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Floating Actions */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => setLiked(!liked)}
                        className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-all shadow-lg"
                        aria-label={liked ? "Beğeniyi kaldır" : "Beğen"}
                      >
                        <Heart size={20} className={liked ? "fill-red-500 text-red-500" : "text-ink"} />
                      </button>
                      <button
                        onClick={() => setSaved(!saved)}
                        className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-all shadow-lg"
                        aria-label={saved ? "Kaydedilenlerden kaldır" : "Kaydet"}
                      >
                        <Bookmark size={20} className={saved ? "fill-primary text-primary" : "text-ink"} />
                      </button>
                      <button
                        onClick={handleShare}
                        className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-all shadow-lg"
                        aria-label="Paylaş"
                      >
                        <Share2 size={20} className="text-ink" />
                      </button>
                    </div>

                    {/* Price Badge */}
                    <div className="absolute bottom-4 left-4">
                      <Badge variant={event.is_free ? "success" : "warning"} className="text-lg px-4 py-2">
                        {event.is_free ? "Ücretsiz" : `$${event.price}`}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Event Info */}
                <Card variant="elevated">
                  <CardContent className="p-6">
                    <Badge variant="outline" className={`mb-3 ${EVENT_CATEGORY_COLORS[event.category]}`}>
                      {EVENT_CATEGORY_ICONS[event.category]} {EVENT_CATEGORY_LABELS[event.category]}
                    </Badge>
                    <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

                    {/* Organizer */}
                    <div className="flex items-center gap-3 mb-6">
                      <Avatar
                        src={organizer?.avatar_url || undefined}
                        fallback={organizerName}
                        size="md"
                      />
                      <div>
                        <p className="font-semibold">Organize eden</p>
                        <p className="text-sm text-ink-muted">
                          {organizerName}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                      <p className="text-ink-muted leading-relaxed whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Location */}
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Konum</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    {event.is_online ? (
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Online Etkinlik</p>
                          {event.online_url && (
                            <a
                              href={event.online_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                            >
                              <LinkIcon size={14} />
                              Katılım linki
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{event.location_name}</p>
                          <p className="text-sm text-ink-muted">
                            {event.address && `${event.address}, `}
                            {event.city}, {US_STATES_MAP[event.state] || event.state}
                            {event.zip_code && ` ${event.zip_code}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Similar Events */}
                {similarEvents.length > 0 && (
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle>Benzer Etkinlikler</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-4">
                      {similarEvents.map((similarEvent) => (
                        <Link
                          key={similarEvent.id}
                          href={`/events/${similarEvent.id}`}
                          className="block group"
                        >
                          <div className="flex gap-3 p-3 rounded-lg hover:bg-surface-raised transition-colors">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-primary-light flex items-center justify-center">
                              {similarEvent.cover_image_url ? (
                                <img
                                  src={similarEvent.cover_image_url}
                                  alt={similarEvent.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl">{EVENT_CATEGORY_ICONS[similarEvent.category]}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm mb-1 truncate group-hover:text-primary transition-colors">
                                {similarEvent.title}
                              </h4>
                              <p className="text-xs text-ink-muted">
                                {formatDate(similarEvent.event_date)}
                              </p>
                              <p className="text-xs text-ink-muted">
                                {similarEvent.current_attendees} katılımcı
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Join Card */}
                <Card variant="elevated" className="sticky top-20">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Date & Time */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Tarih & Saat</p>
                          <p className="text-sm text-ink-muted">
                            {formatDate(event.event_date)}
                          </p>
                          <p className="text-sm text-ink-muted">
                            {formatTime(event.start_time)}
                            {event.end_time && ` - ${formatTime(event.end_time)}`}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                          {event.is_online ? (
                            <Globe className="h-5 w-5 text-red-600" />
                          ) : (
                            <MapPin className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">Konum</p>
                          <p className="text-sm text-ink-muted">
                            {event.is_online ? "Online" : `${event.city}, ${event.state}`}
                          </p>
                        </div>
                      </div>

                      {/* Attendees */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Katılımcılar</p>
                          <p className="text-sm text-ink-muted">
                            {event.current_attendees}
                            {event.max_attendees && ` / ${event.max_attendees}`} kişi
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Fiyat</p>
                          <p className="text-sm text-ink-muted">
                            {event.is_free ? "Ücretsiz" : `$${event.price}`}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant={isAttending ? "outline" : "primary"}
                        className="w-full mt-4"
                        size="lg"
                        onClick={handleJoin}
                        loading={attendanceLoading}
                        disabled={
                          attendanceLoading ||
                          (event.max_attendees !== null &&
                           event.current_attendees >= event.max_attendees &&
                           !isAttending)
                        }
                      >
                        {isAttending ? (
                          <>
                            <CheckCircle2 size={20} className="mr-2" />
                            Katılıyorsun
                          </>
                        ) : event.max_attendees !== null && event.current_attendees >= event.max_attendees ? (
                          "Kontenjan Doldu"
                        ) : (
                          "Etkinliğe Katıl"
                        )}
                      </Button>

                      {isAttending && (
                        <p className="text-xs text-center text-ink-muted">
                          Katılımdan vazgeçmek için tekrar tıkla
                        </p>
                      )}

                      {attendanceError && (
                        <p className="text-sm text-center text-red-500">{attendanceError}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Organizer Card */}
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Organizatör</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="text-center mb-4">
                      <Avatar
                        src={organizer?.avatar_url || undefined}
                        fallback={organizerName}
                        size="xl"
                        className="mx-auto mb-3"
                      />
                      <h3 className="font-bold">
                        {organizerName}
                      </h3>
                      {organizer?.bio && (
                        <p className="text-sm text-ink-muted mt-1 line-clamp-2">
                          {organizer.bio}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Link href={`/profile/${organizer?.username || organizer?.id}`}>
                        <Button variant="outline" className="w-full gap-2" size="sm">
                          <Users size={16} />
                          Profili Görüntüle
                        </Button>
                      </Link>
                    </div>
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
