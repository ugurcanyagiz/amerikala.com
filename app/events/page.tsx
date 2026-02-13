"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { 
  Event, 
  EventCategory,
  EVENT_CATEGORY_LABELS, 
  EVENT_CATEGORY_ICONS,
  EVENT_CATEGORY_COLORS,
  US_STATES,
  US_STATES_MAP 
} from "@/lib/types";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { 
  Plus, 
  MapPin,
  Calendar,
  Users,
  Clock,
  Search,
  Loader2,
  ChevronRight,
  Globe,
  DollarSign,
  CalendarDays,
  Filter,
  SlidersHorizontal,
  Sparkles,
  TrendingUp
} from "lucide-react";

export default function EventsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "all">("all");
  const [selectedState, setSelectedState] = useState<string>(searchParams.get("state") || "all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  const formatTime = (time?: string | null) => {
    if (!time) return "Saat belirtilmedi";
    return time.slice(0, 5);
  };

  // Fetch approved events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const queryBuild = (selectText: string) => {
          let query = supabase
            .from("events")
            .select(selectText)
            .eq("status", "approved")
            .gte("event_date", new Date().toISOString().split("T")[0])
            .order("event_date", { ascending: true });

          // Filter by state
          if (selectedState !== "all") {
            query = query.eq("state", selectedState);
          }

          // Filter by category
          if (selectedCategory !== "all") {
            query = query.eq("category", selectedCategory);
          }

          // Filter by date
          const today = new Date();
          if (dateFilter === "today") {
            query = query.eq("event_date", today.toISOString().split("T")[0]);
          } else if (dateFilter === "week") {
            const weekLater = new Date(today);
            weekLater.setDate(weekLater.getDate() + 7);
            query = query.lte("event_date", weekLater.toISOString().split("T")[0]);
          } else if (dateFilter === "month") {
            const monthLater = new Date(today);
            monthLater.setMonth(monthLater.getMonth() + 1);
            query = query.lte("event_date", monthLater.toISOString().split("T")[0]);
          }

          return query;
        };

        const selectWithFk = `
          *,
          organizer:profiles!events_organizer_id_fkey (id, username, first_name, last_name, full_name, avatar_url),
          creator:profiles!events_created_by_fkey (id, username, first_name, last_name, full_name, avatar_url)
        `;
        const selectLegacy = `
          *,
          organizer:organizer_id (id, username, first_name, last_name, full_name, avatar_url),
          creator:created_by (id, username, first_name, last_name, full_name, avatar_url)
        `;

        const resultWithFk = await queryBuild(selectWithFk);
        const { data, error } = resultWithFk.error ? await queryBuild(selectLegacy) : resultWithFk;

        if (error) {
          console.error("Error fetching events:", error);
        } else {
          setEvents(((data as unknown as Event[] | null) || []));
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedState, selectedCategory, dateFilter]);

  // Filter events by search
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    
    const query = searchQuery.toLowerCase();
    return events.filter(event => 
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.city.toLowerCase().includes(query) ||
      event.location_name.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

  // Featured events (first 3)
  const featuredEvents = filteredEvents.slice(0, 3);
  const regularEvents = filteredEvents.slice(3);

  // Categories for filter
  const categories: { value: EventCategory | "all"; label: string; icon?: string }[] = [
    { value: "all", label: "Tümü" },
    ...Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => ({
      value: value as EventCategory,
      label,
      icon: EVENT_CATEGORY_ICONS[value as EventCategory]
    }))
  ];

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase(),
      weekday: date.toLocaleDateString("tr-TR", { weekday: "short" }),
      full: date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
    };
  };

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="ak-shell ak-shell-wide py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Calendar className="text-red-500" />
                  Etkinlikler
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Yaklaşan {filteredEvents.length} etkinlik bulundu
                </p>
              </div>
              
              {user ? (
                <Link href="/meetups/create">
                  <Button variant="primary" className="gap-2">
                    <Plus size={20} />
                    Etkinlik Oluştur
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="outline" className="gap-2">
                    Etkinlik oluşturmak için giriş yapın
                  </Button>
                </Link>
              )}
            </div>

            {/* Search & Quick Filters */}
            <div className="mb-6 space-y-4">
              {/* Search Bar */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                  <input
                    type="text"
                    placeholder="Etkinlik, konum veya organizatör ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-lg"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <SlidersHorizontal size={20} />
                  Filtreler
                </Button>
              </div>

              {/* Date Quick Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "Tüm Tarihler" },
                  { value: "today", label: "Bugün" },
                  { value: "week", label: "Bu Hafta" },
                  { value: "month", label: "Bu Ay" },
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setDateFilter(filter.value as "all" | "today" | "week" | "month")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      dateFilter === filter.value
                        ? "bg-red-500 text-white"
                        : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Extended Filters */}
              {showFilters && (
                <Card className="glass">
                  <CardContent className="p-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* State Filter */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Eyalet</label>
                        <select
                          value={selectedState}
                          onChange={(e) => setSelectedState(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="all">Tüm Eyaletler</option>
                          {US_STATES.map(state => (
                            <option key={state.value} value={state.value}>
                              {state.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Category Filter */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Kategori</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value as EventCategory | "all")}
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          {categories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === cat.value
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                        : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Events List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <CalendarDays className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Etkinlik bulunamadı</h3>
                  <p className="text-neutral-500 mb-6">
                    {searchQuery || selectedCategory !== "all" || selectedState !== "all"
                      ? "Arama kriterlerinize uygun etkinlik bulunamadı."
                      : "Henüz etkinlik oluşturulmamış."}
                  </p>
                  {user && (
                    <Link href="/meetups/create">
                      <Button variant="primary" className="gap-2">
                        <Plus size={20} />
                        İlk Etkinliği Oluştur
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Featured Events */}
                {featuredEvents.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="text-yellow-500" size={20} />
                      Öne Çıkan Etkinlikler
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                      {featuredEvents.map(event => (
                        <FeaturedEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Events */}
                {regularEvents.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="text-blue-500" size={20} />
                      Tüm Etkinlikler
                    </h2>
                    <div className="space-y-3">
                      {regularEvents.map(event => (
                        <EventListCard key={event.id} event={event} formatTime={formatTime} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Featured Event Card Component
function getDisplayName(profile?: { username?: string | null; first_name?: string | null; last_name?: string | null; full_name?: string | null } | null) {
  if (!profile) return "Anonim";
  const full = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return full || profile.username || profile.full_name || "Anonim";
}

function FeaturedEventCard({ event }: { event: Event }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase()
    };
  };

  const date = formatDate(event.event_date);
  const organizer = event.organizer || (event as Event & { creator?: Event["organizer"] }).creator || null;

  return (
    <Link href={`/meetups/${event.id}`}>
      <Card className="glass overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full group">
        {/* Cover */}
        <div className="relative h-36 bg-gradient-to-br from-red-500 to-orange-500 overflow-hidden">
          {event.cover_image_url ? (
            <img 
              src={event.cover_image_url} 
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
              <img
                src="/logo.png"
                alt="No picture"
                className="h-16 w-16 object-contain opacity-90"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Date Badge */}
          <div className="absolute top-3 left-3 bg-white dark:bg-neutral-900 rounded-lg px-2 py-1 text-center shadow-lg">
            <div className="text-[10px] font-bold text-red-500">{date.month}</div>
            <div className="text-lg font-bold leading-none">{date.day}</div>
          </div>

          {/* Price Badge */}
          {!event.is_free && (
            <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
              ${event.price}
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${EVENT_CATEGORY_COLORS[event.category]}`}>
            {EVENT_CATEGORY_ICONS[event.category]} {EVENT_CATEGORY_LABELS[event.category]}
          </div>
          
          <h3 className="font-bold line-clamp-2 mb-2 group-hover:text-red-500 transition-colors">
            {event.title}
          </h3>
          
          <div className="space-y-1.5 text-xs text-neutral-500">
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>{event.start_time ? event.start_time.slice(0, 5) : "Saat belirtilmedi"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {event.is_online ? <Globe size={14} /> : <MapPin size={14} />}
              <span className="truncate">
                {event.is_online ? "Online" : `${event.city}, ${event.state}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={14} />
              <span>{event.current_attendees} katılımcı · {getDisplayName(organizer)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Event List Card Component
function EventListCard({ event, formatTime }: { event: Event; formatTime: (time?: string | null) => string }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("tr-TR", { month: "short" }),
      weekday: date.toLocaleDateString("tr-TR", { weekday: "short" })
    };
  };

  const date = formatDate(event.event_date);
  const organizer = event.organizer || (event as Event & { creator?: Event["organizer"] }).creator || null;

  return (
    <Link href={`/meetups/${event.id}`}>
      <Card className="glass hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Date Column */}
            <div className="flex-shrink-0 w-16 text-center">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                <div className="text-xs text-red-500 font-medium">{date.weekday}</div>
                <div className="text-2xl font-bold">{date.day}</div>
                <div className="text-xs text-neutral-500">{date.month}</div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${EVENT_CATEGORY_COLORS[event.category]}`}>
                    {EVENT_CATEGORY_ICONS[event.category]} {EVENT_CATEGORY_LABELS[event.category]}
                  </div>
                  <h3 className="font-bold text-lg group-hover:text-red-500 transition-colors line-clamp-1">
                    {event.title}
                  </h3>
                  <p className="text-sm text-neutral-500 line-clamp-1 mt-1">
                    {event.description}
                  </p>
                </div>

                {/* Cover Thumbnail */}
                <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden hidden sm:block bg-neutral-100 dark:bg-neutral-900">
                  {event.cover_image_url ? (
                    <img
                      src={event.cover_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src="/logo.png"
                      alt="No picture"
                      className="w-full h-full object-contain p-3 opacity-90"
                    />
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-neutral-500">
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  <span>{formatTime(event.start_time)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {event.is_online ? <Globe size={16} /> : <MapPin size={16} />}
                  <span>{event.is_online ? "Online" : `${event.location_name}, ${event.city}`}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{event.current_attendees} katılımcı · {getDisplayName(organizer)}</span>
                </div>
                {!event.is_free && (
                  <Badge variant="success" size="sm">${event.price}</Badge>
                )}
                {event.is_free && (
                  <Badge variant="default" size="sm">Ücretsiz</Badge>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 flex items-center">
              <ChevronRight size={24} className="text-neutral-300 group-hover:text-red-500 transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
