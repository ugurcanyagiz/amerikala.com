"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
  Event,
  EVENT_CATEGORY_LABELS, 
  EVENT_CATEGORY_ICONS,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_COLORS
} from "@/lib/types";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { 
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock3
} from "lucide-react";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export default function MyEventsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/meetups/my-events");
    }
  }, [user, authLoading, router]);

  // Fetch my events
  useEffect(() => {
    if (!user) return;

    const fetchMyEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("organizer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, [user]);

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    if (!confirm("Bu etkinliği silmek istediğinizden emin misiniz?")) return;

    setDeletingEvent(eventId);
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("organizer_id", user.id);

      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Etkinlik silinemedi");
    } finally {
      setDeletingEvent(null);
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    if (filterStatus === "all") return true;
    return event.status === filterStatus;
  });

  // Stats
  const stats = {
    total: events.length,
    pending: events.filter(e => e.status === "pending").length,
    approved: events.filter(e => e.status === "approved").length,
    rejected: events.filter(e => e.status === "rejected").length
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="ak-page">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/meetups">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Etkinliklerim</h1>
              <p className="text-neutral-500">Oluşturduğunuz tüm etkinlikler</p>
            </div>
          </div>
          <Link href="/meetups/create">
            <Button variant="primary" className="gap-2">
              <Plus size={18} />
              Yeni Etkinlik
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setFilterStatus("all")}
            className={`p-4 rounded-xl text-left transition-all ${
              filterStatus === "all"
                ? "bg-red-500 text-white shadow-lg"
                : "bg-white dark:bg-neutral-900 hover:shadow-md"
            }`}
          >
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className={`text-sm ${filterStatus === "all" ? "text-white/80" : "text-neutral-500"}`}>
              Toplam
            </p>
          </button>

          <button
            onClick={() => setFilterStatus("pending")}
            className={`p-4 rounded-xl text-left transition-all ${
              filterStatus === "pending"
                ? "bg-yellow-500 text-white shadow-lg"
                : "bg-white dark:bg-neutral-900 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock3 size={20} className={filterStatus === "pending" ? "text-white" : "text-yellow-500"} />
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <p className={`text-sm ${filterStatus === "pending" ? "text-white/80" : "text-neutral-500"}`}>
              Beklemede
            </p>
          </button>

          <button
            onClick={() => setFilterStatus("approved")}
            className={`p-4 rounded-xl text-left transition-all ${
              filterStatus === "approved"
                ? "bg-green-500 text-white shadow-lg"
                : "bg-white dark:bg-neutral-900 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className={filterStatus === "approved" ? "text-white" : "text-green-500"} />
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
            <p className={`text-sm ${filterStatus === "approved" ? "text-white/80" : "text-neutral-500"}`}>
              Onaylı
            </p>
          </button>

          <button
            onClick={() => setFilterStatus("rejected")}
            className={`p-4 rounded-xl text-left transition-all ${
              filterStatus === "rejected"
                ? "bg-red-600 text-white shadow-lg"
                : "bg-white dark:bg-neutral-900 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-2">
              <XCircle size={20} className={filterStatus === "rejected" ? "text-white" : "text-red-500"} />
              <p className="text-2xl font-bold">{stats.rejected}</p>
            </div>
            <p className={`text-sm ${filterStatus === "rejected" ? "text-white/80" : "text-neutral-500"}`}>
              Reddedilen
            </p>
          </button>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {filterStatus === "all" 
                  ? "Henüz etkinlik oluşturmadınız" 
                  : `${EVENT_STATUS_LABELS[filterStatus as keyof typeof EVENT_STATUS_LABELS]} etkinlik yok`}
              </h3>
              <p className="text-neutral-500 mb-6">
                Topluluğunuzu bir araya getirmek için yeni bir etkinlik oluşturun.
              </p>
              <Link href="/meetups/create">
                <Button variant="primary" className="gap-2">
                  <Plus size={18} />
                  İlk Etkinliğini Oluştur
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <Card key={event.id} className="glass overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Cover */}
                    <div className="w-32 sm:w-48 bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      {event.cover_image_url ? (
                        <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{EVENT_CATEGORY_ICONS[event.category]}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${EVENT_STATUS_COLORS[event.status]}`}>
                            {EVENT_STATUS_LABELS[event.status]}
                          </span>
                          <h3 className="font-bold text-lg">{event.title}</h3>
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {event.status === "rejected" && event.rejection_reason && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 mb-3">
                          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">Red Sebebi:</p>
                            <p className="text-sm text-red-600 dark:text-red-300">{event.rejection_reason}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 text-sm text-neutral-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{formatDate(event.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>{event.start_time.slice(0, 5)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>{event.is_online ? "Online" : `${event.city}, ${event.state}`}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/meetups/${event.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye size={16} />
                            Görüntüle
                          </Button>
                        </Link>
                        
                        {event.status === "pending" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={deletingEvent === event.id}
                          >
                            {deletingEvent === event.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                            Sil
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
