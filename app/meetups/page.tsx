"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { 
  Event, 
  Group,
  EVENT_CATEGORY_ICONS,
  EVENT_CATEGORY_COLORS,
  GROUP_CATEGORY_ICONS,
  GROUP_CATEGORY_COLORS,
  EVENT_CATEGORY_LABELS,
  GROUP_CATEGORY_LABELS
} from "@/lib/types";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { 
  Plus, 
  MapPin,
  Calendar,
  Users,
  Clock,
  ChevronRight,
  Globe,
  Loader2,
  Sparkles,
  TrendingUp,
  CalendarDays,
  UsersRound,
  ArrowRight,
  Zap,
  Star,
  Heart
} from "lucide-react";

export default function MeetupsPage() {
  const { user } = useAuth();

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [popularGroups, setPopularGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ events: 0, groups: 0, members: 0 });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch upcoming events
        const { data: events } = await supabase
          .from("events")
          .select(`
            *,
            organizer:organizer_id (id, username, full_name, avatar_url)
          `)
          .eq("status", "approved")
          .gte("event_date", new Date().toISOString().split("T")[0])
          .order("event_date", { ascending: true })
          .limit(4);

        setUpcomingEvents(events || []);

        // Fetch popular groups
        const { data: groups } = await supabase
          .from("groups")
          .select(`
            *,
            creator:created_by (id, username, full_name, avatar_url)
          `)
          .eq("status", "approved")
          .order("member_count", { ascending: false })
          .limit(4);

        setPopularGroups(groups || []);

        // Get stats
        const { count: eventCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved");

        const { count: groupCount } = await supabase
          .from("groups")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved");

        setStats({
          events: eventCount || 0,
          groups: groupCount || 0,
          members: 0 // Could calculate total members across groups
        });

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase(),
      weekday: date.toLocaleDateString("tr-TR", { weekday: "short" })
    };
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-orange-500 p-8 sm:p-12 mb-8">
              <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                      Topluluğunu Bul, Buluşmalara Katıl
                    </h1>
                    <p className="text-white/80 text-lg max-w-xl">
                      Amerika&apos;daki Türk topluluğuyla tanış. Etkinliklere katıl, gruplara üye ol, 
                      yeni insanlarla bağlantı kur.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/meetups/create">
                      <Button variant="secondary" size="lg" className="gap-2 w-full sm:w-auto">
                        <CalendarDays size={20} />
                        Etkinlik Oluştur
                      </Button>
                    </Link>
                    <Link href="/groups/create">
                      <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20">
                        <UsersRound size={20} />
                        Grup Oluştur
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-white">{stats.events}</div>
                    <div className="text-white/70 text-sm">Etkinlik</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-white">{stats.groups}</div>
                    <div className="text-white/70 text-sm">Grup</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-white">50+</div>
                    <div className="text-white/70 text-sm">Şehir</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access Cards */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {/* Events Card */}
              <Link href="/events">
                <Card className="glass group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 group-hover:from-red-500/10 group-hover:to-orange-500/10 transition-colors" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                        <CalendarDays className="w-7 h-7 text-white" />
                      </div>
                      <ArrowRight className="w-6 h-6 text-neutral-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h2 className="text-xl font-bold mb-2 group-hover:text-red-500 transition-colors">
                      Etkinlikler
                    </h2>
                    <p className="text-neutral-500 text-sm mb-4">
                      Yaklaşan etkinlikleri keşfet, toplantılara katıl ve kendi etkinliğini oluştur.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                        <Zap size={16} className="text-red-500" />
                        {stats.events} aktif etkinlik
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Groups Card */}
              <Link href="/groups">
                <Card className="glass group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-colors" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <UsersRound className="w-7 h-7 text-white" />
                      </div>
                      <ArrowRight className="w-6 h-6 text-neutral-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h2 className="text-xl font-bold mb-2 group-hover:text-blue-500 transition-colors">
                      Gruplar
                    </h2>
                    <p className="text-neutral-500 text-sm mb-4">
                      İlgi alanlarına göre grupları keşfet, topluluklara katıl ve yeni insanlarla tanış.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                        <Users size={16} className="text-blue-500" />
                        {stats.groups} aktif grup
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Upcoming Events Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="text-yellow-500" size={22} />
                    Yaklaşan Etkinlikler
                  </h2>
                  <Link href="/events">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Tümü
                      <ChevronRight size={16} />
                    </Button>
                  </Link>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <Card className="glass">
                    <CardContent className="p-8 text-center">
                      <CalendarDays className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                      <p className="text-neutral-500">Yaklaşan etkinlik bulunmuyor</p>
                      <Link href="/meetups/create">
                        <Button variant="outline" size="sm" className="mt-3">
                          İlk Etkinliği Oluştur
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map(event => {
                      const date = formatDate(event.event_date);
                      const organizer = event.organizer as any;
                      
                      return (
                        <Link key={event.id} href={`/meetups/${event.id}`}>
                          <Card className="glass hover:shadow-lg transition-all duration-300 group">
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {/* Date */}
                                <div className="flex-shrink-0 w-14 text-center">
                                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                                    <div className="text-[10px] font-bold text-red-500">{date.month}</div>
                                    <div className="text-xl font-bold">{date.day}</div>
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${EVENT_CATEGORY_COLORS[event.category]}`}>
                                    {EVENT_CATEGORY_ICONS[event.category]}
                                  </span>
                                  <h3 className="font-semibold group-hover:text-red-500 transition-colors line-clamp-1">
                                    {event.title}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                                    <span className="flex items-center gap-1">
                                      <Clock size={12} />
                                      {event.start_time.slice(0, 5)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      {event.is_online ? <Globe size={12} /> : <MapPin size={12} />}
                                      {event.is_online ? "Online" : event.city}
                                    </span>
                                  </div>
                                </div>

                                <ChevronRight className="text-neutral-300 group-hover:text-red-500 transition-colors" size={20} />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Popular Groups Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="text-blue-500" size={22} />
                    Popüler Gruplar
                  </h2>
                  <Link href="/groups">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Tümü
                      <ChevronRight size={16} />
                    </Button>
                  </Link>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : popularGroups.length === 0 ? (
                  <Card className="glass">
                    <CardContent className="p-8 text-center">
                      <UsersRound className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                      <p className="text-neutral-500">Henüz grup bulunmuyor</p>
                      <Link href="/groups/create">
                        <Button variant="outline" size="sm" className="mt-3">
                          İlk Grubu Oluştur
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {popularGroups.map(group => {
                      const creator = group.creator as any;
                      
                      return (
                        <Link key={group.id} href={`/groups/${group.slug}`}>
                          <Card className="glass hover:shadow-lg transition-all duration-300 group">
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {/* Avatar */}
                                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                                  {group.avatar_url ? (
                                    <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-2xl">{GROUP_CATEGORY_ICONS[group.category]}</span>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${GROUP_CATEGORY_COLORS[group.category]}`}>
                                    {GROUP_CATEGORY_ICONS[group.category]}
                                  </span>
                                  <h3 className="font-semibold group-hover:text-blue-500 transition-colors line-clamp-1">
                                    {group.name}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                                    <span className="flex items-center gap-1">
                                      <Users size={12} />
                                      {group.member_count} üye
                                    </span>
                                    <span className="flex items-center gap-1">
                                      {group.is_nationwide ? <Globe size={12} /> : <MapPin size={12} />}
                                      {group.is_nationwide ? "ABD Geneli" : group.state}
                                    </span>
                                  </div>
                                </div>

                                <ChevronRight className="text-neutral-300 group-hover:text-blue-500 transition-colors" size={20} />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Call to Action */}
            {user && (
              <Card className="glass mt-8 bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 text-white overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <Heart className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Topluluğa Katkıda Bulun</h3>
                        <p className="text-white/70 text-sm">Etkinlik veya grup oluşturarak topluluğu büyüt</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link href="/meetups/my-events">
                        <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                          Etkinliklerim
                        </Button>
                      </Link>
                      <Link href="/groups/my-groups">
                        <Button variant="secondary">
                          Gruplarım
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
