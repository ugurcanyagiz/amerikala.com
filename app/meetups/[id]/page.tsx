"use client";

import { useEffect, useState } from "react";
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

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch event
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        // Fetch event
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select(`
            *,
            organizer:organizer_id (id, username, full_name, avatar_url, bio)
          `)
          .eq("id", eventId)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);

        // Fetch attendees
        const { data: attendeesData } = await supabase
          .from("event_attendees")
          .select(`
            *,
            profile:user_id (id, username, full_name, avatar_url)
          `)
          .eq("event_id", eventId)
          .eq("status", "going");

        setAttendees(attendeesData || []);

        // Check if current user is attending
        if (user) {
          const isAttending = attendeesData?.some(a => a.user_id === user.id);
          setAttending(!!isAttending);
        }

      } catch (error) {
        console.error("Error fetching event:", error);
        router.push("/meetups");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId, user, router]);

  // Handle attendance
  const handleAttendance = async () => {
    if (!user) {
      router.push(`/login?redirect=/meetups/${eventId}`);
      return;
    }

    setAttendanceLoading(true);

    try {
      if (attending) {
        // Remove attendance
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) throw error;
        setAttending(false);
        setAttendees(prev => prev.filter(a => a.user_id !== user.id));
      } else {
        // Add attendance
        const { data, error } = await supabase
          .from("event_attendees")
          .insert({
            event_id: eventId,
            user_id: user.id,
            status: "going"
          })
          .select(`
            *,
            profile:user_id (id, username, full_name, avatar_url)
          `)
          .single();

        if (error) throw error;
        setAttending(true);
        if (data) {
          setAttendees(prev => [...prev, data]);
        }
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
    } finally {
      setAttendanceLoading(false);
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

  const organizer = event.organizer as any;
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
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl">{EVENT_CATEGORY_ICONS[event.category]}</span>
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
                  <div className="flex flex-wrap gap-3">
                    {attendees.map(attendee => {
                      const profile = attendee.profile as any;
                      return (
                        <Link 
                          key={attendee.user_id} 
                          href={`/profile/${attendee.user_id}`}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Avatar 
                            src={profile?.avatar_url} 
                            fallback={profile?.full_name || profile?.username || "U"} 
                            size="sm"
                          />
                          <span className="text-sm font-medium">
                            {profile?.full_name || profile?.username || "Anonim"}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
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
                    src={organizer?.avatar_url} 
                    fallback={organizer?.full_name || organizer?.username || "O"} 
                    size="lg"
                  />
                  <div>
                    <p className="font-semibold">
                      {organizer?.full_name || organizer?.username || "Organizatör"}
                    </p>
                    <p className="text-sm text-neutral-500">@{organizer?.username}</p>
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
    </div>
  );
}
