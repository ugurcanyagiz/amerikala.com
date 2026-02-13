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
} from "@/lib/types";
import Sidebar from "../components/Sidebar";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import {
  Plus,
  MapPin,
  Calendar,
  Users,
  Clock,
  ChevronRight,
  Globe,
  Loader2,
  CalendarDays,
  UsersRound,
  ArrowRight,
} from "lucide-react";

export default function MeetupsPage() {
  const { user } = useAuth();

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [popularGroups, setPopularGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ events: 0, groups: 0, members: 0 });

  const resolveDisplayName = (profile?: {
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
  } | null) => {
    if (!profile) return "Anonim";
    const full = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
    return full || profile.username || profile.full_name || "Anonim";
  };

  const formatTime = (time?: string | null) => {
    if (!time) return "Saat belirtilmedi";
    return time.slice(0, 5);
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch upcoming events
        const eventSelectWithFk = `
            *,
            organizer:profiles!events_organizer_id_fkey (id, username, first_name, last_name, full_name, avatar_url)
          `;
        const eventSelectLegacy = `
            *,
            organizer:organizer_id (id, username, first_name, last_name, full_name, avatar_url)
          `;

        const eventResultWithFk = await supabase
          .from("events")
          .select(eventSelectWithFk)
          .eq("status", "approved")
          .gte("event_date", new Date().toISOString().split("T")[0])
          .order("event_date", { ascending: true })
          .limit(4);

        const eventResult = eventResultWithFk.error
          ? await supabase
              .from("events")
              .select(eventSelectLegacy)
              .eq("status", "approved")
              .gte("event_date", new Date().toISOString().split("T")[0])
              .order("event_date", { ascending: true })
              .limit(4)
          : eventResultWithFk;

        setUpcomingEvents((eventResult.data as Event[] | null) || []);

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
          members: 0
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
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-surface)]">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Hero Section - Clean & Minimal */}
            <section className="text-center mb-16">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-ink)] mb-4">
                Topluluğunu Bul, Buluşmalara Katıl
              </h1>
              <p className="text-lg text-[var(--color-ink-secondary)] max-w-2xl mx-auto mb-8">
                Amerika&apos;daki Türk topluluğuyla tanış. Etkinliklere katıl, gruplara üye ol,
                yeni insanlarla bağlantı kur.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
                <Link href="/meetups/create">
                  <Button variant="primary" size="lg" className="gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Etkinlik Oluştur
                  </Button>
                </Link>
                <Link href="/groups/create">
                  <Button variant="outline" size="lg" className="gap-2">
                    <UsersRound className="h-5 w-5" />
                    Grup Oluştur
                  </Button>
                </Link>
              </div>

              {/* Stats - Inline */}
              <div className="flex items-center justify-center gap-8 sm:gap-12 pt-8 border-t border-[var(--color-border-light)]">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-[var(--color-ink)]">{stats.events}</div>
                  <div className="text-sm text-[var(--color-ink-secondary)]">Etkinlik</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-[var(--color-ink)]">{stats.groups}</div>
                  <div className="text-sm text-[var(--color-ink-secondary)]">Grup</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-[var(--color-ink)]">50+</div>
                  <div className="text-sm text-[var(--color-ink-secondary)]">Şehir</div>
                </div>
              </div>
            </section>

            {/* Quick Access Cards */}
            <section className="grid sm:grid-cols-2 gap-6 mb-16">
              {/* Events Card */}
              <Link href="/events">
                <Card variant="interactive" padding="md" className="h-full">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-xl bg-[var(--color-primary-subtle)] flex items-center justify-center">
                        <CalendarDays className="h-6 w-6 text-[var(--color-primary)]" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-[var(--color-ink-tertiary)] group-hover:text-[var(--color-primary)] transition-colors" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
                      Etkinlikler
                    </h2>
                    <p className="text-sm text-[var(--color-ink-secondary)] mb-4">
                      Yaklaşan etkinlikleri keşfet, toplantılara katıl ve kendi etkinliğini oluştur.
                    </p>
                    <span className="text-sm text-[var(--color-primary)] font-medium">
                      {stats.events} aktif etkinlik
                    </span>
                  </CardContent>
                </Card>
              </Link>

              {/* Groups Card */}
              <Link href="/groups">
                <Card variant="interactive" padding="md" className="h-full">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-xl bg-[var(--color-info-light)] flex items-center justify-center">
                        <UsersRound className="h-6 w-6 text-[var(--color-info)]" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-[var(--color-ink-tertiary)] group-hover:text-[var(--color-info)] transition-colors" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
                      Gruplar
                    </h2>
                    <p className="text-sm text-[var(--color-ink-secondary)] mb-4">
                      İlgi alanlarına göre grupları keşfet, topluluklara katıl ve yeni insanlarla tanış.
                    </p>
                    <span className="text-sm text-[var(--color-info)] font-medium">
                      {stats.groups} aktif grup
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </section>

            {/* Content Grid */}
            <section className="grid lg:grid-cols-2 gap-12">
              {/* Upcoming Events Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[var(--color-ink)]">
                    Yaklaşan Etkinlikler
                  </h2>
                  <Link href="/events">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Tümü
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <Card variant="default" padding="md">
                    <CardContent className="p-0 text-center py-8">
                      <CalendarDays className="h-10 w-10 text-[var(--color-ink-tertiary)] mx-auto mb-3" />
                      <p className="text-[var(--color-ink-secondary)]">Yaklaşan etkinlik bulunmuyor</p>
                      <Link href="/meetups/create">
                        <Button variant="outline" size="sm" className="mt-4">
                          İlk Etkinliği Oluştur
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map(event => {
                      const date = formatDate(event.event_date);

                      return (
                        <Link key={event.id} href={`/meetups/${event.id}`}>
                          <Card variant="interactive" padding="sm">
                            <CardContent className="p-0">
                              <div className="flex items-center gap-4">
                                {/* Date */}
                                <div className="flex-shrink-0 w-12 text-center">
                                  <div className="text-xs font-medium text-[var(--color-primary)]">{date.month}</div>
                                  <div className="text-xl font-semibold text-[var(--color-ink)]">{date.day}</div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${EVENT_CATEGORY_COLORS[event.category]}`}>
                                    {EVENT_CATEGORY_ICONS[event.category]}
                                  </span>
                                  <h3 className="font-medium text-[var(--color-ink)] line-clamp-1">
                                    {event.title}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-ink-secondary)]">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTime(event.start_time)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      {event.is_online ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                      {event.is_online ? "Online" : event.city}
                                    </span>
                                    <span className="flex items-center gap-1 truncate">
                                      <Users className="h-3 w-3" />
                                      {resolveDisplayName(event.organizer)}
                                    </span>
                                  </div>
                                </div>

                                <ChevronRight className="h-5 w-5 text-[var(--color-ink-tertiary)]" />
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[var(--color-ink)]">
                    Popüler Gruplar
                  </h2>
                  <Link href="/groups">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Tümü
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--color-info)]" />
                  </div>
                ) : popularGroups.length === 0 ? (
                  <Card variant="default" padding="md">
                    <CardContent className="p-0 text-center py-8">
                      <UsersRound className="h-10 w-10 text-[var(--color-ink-tertiary)] mx-auto mb-3" />
                      <p className="text-[var(--color-ink-secondary)]">Henüz grup bulunmuyor</p>
                      <Link href="/groups/create">
                        <Button variant="outline" size="sm" className="mt-4">
                          İlk Grubu Oluştur
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {popularGroups.map(group => {
                      return (
                        <Link key={group.id} href={`/groups/${group.slug}`}>
                          <Card variant="interactive" padding="sm">
                            <CardContent className="p-0">
                              <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-[var(--color-info-light)] flex items-center justify-center overflow-hidden">
                                  {group.avatar_url ? (
                                    <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-lg">{GROUP_CATEGORY_ICONS[group.category]}</span>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${GROUP_CATEGORY_COLORS[group.category]}`}>
                                    {GROUP_CATEGORY_ICONS[group.category]}
                                  </span>
                                  <h3 className="font-medium text-[var(--color-ink)] line-clamp-1">
                                    {group.name}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-ink-secondary)]">
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {group.member_count} üye
                                    </span>
                                    <span className="flex items-center gap-1">
                                      {group.is_nationwide ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                      {group.is_nationwide ? "ABD Geneli" : group.state}
                                    </span>
                                  </div>
                                </div>

                                <ChevronRight className="h-5 w-5 text-[var(--color-ink-tertiary)]" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* CTA for logged-in users */}
            {user && (
              <section className="mt-16">
                <Card variant="default" padding="md" className="bg-[var(--color-surface-sunken)]">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[var(--color-ink)]">Topluluğa Katkıda Bulun</h3>
                        <p className="text-sm text-[var(--color-ink-secondary)]">
                          Etkinlik veya grup oluşturarak topluluğu büyüt
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Link href="/meetups/my-events">
                          <Button variant="outline" size="sm">
                            Etkinliklerim
                          </Button>
                        </Link>
                        <Link href="/groups/my-groups">
                          <Button variant="primary" size="sm">
                            Gruplarım
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
