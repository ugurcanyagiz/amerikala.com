"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  Globe,
  Loader2,
  Lock,
  MapPin,
  RefreshCcw,
  Search,
  Shield,
  User as UserIcon,
  UserCog,
  X,
} from "lucide-react";

import { useAuth } from "@/app/contexts/AuthContext";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { supabase } from "@/lib/supabase/client";
import {
  Event,
  EVENT_CATEGORY_ICONS,
  EVENT_CATEGORY_LABELS,
  Group,
  GROUP_CATEGORY_ICONS,
  GROUP_CATEGORY_LABELS,
  Profile,
  ROLE_COLORS,
  ROLE_LABELS,
  US_STATES_MAP,
  UserRole,
} from "@/lib/types";

type Tab = "overview" | "events" | "groups" | "users";

type QueueStats = {
  totalUsers: number;
  totalAdmins: number;
  totalModerators: number;
  pendingEvents: number;
  pendingGroups: number;
};

const DEFAULT_STATS: QueueStats = {
  totalUsers: 0,
  totalAdmins: 0,
  totalModerators: 0,
  pendingEvents: 0,
  pendingGroups: 0,
};

const safeLabel = (value: string | null | undefined, fallback: string) =>
  value && value.trim() ? value : fallback;

const getRoleIcon = (role?: UserRole) => {
  switch (role) {
    case "admin":
      return <Crown className="w-4 h-4" />;
    case "moderator":
      return <UserCog className="w-4 h-4" />;
    default:
      return <UserIcon className="w-4 h-4" />;
  }
};

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, isAdmin, isModerator } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<QueueStats>(DEFAULT_STATS);

  const [users, setUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [pendingGroups, setPendingGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<{ type: "event" | "group"; id: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isModerator) {
        router.push("/");
      }
    }
  }, [authLoading, isModerator, router, user]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const loadStats = useCallback(async () => {
    if (!user || !isModerator) return;

    try {
      const [
        usersCount,
        adminsCount,
        moderatorsCount,
        eventsCount,
        groupsCount,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "moderator"),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("groups").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const hasError = [usersCount, adminsCount, moderatorsCount, eventsCount, groupsCount].some((result) => result.error);
      if (hasError) throw new Error("Stat sorgularından en az biri başarısız oldu.");

      setStats({
        totalUsers: usersCount.count ?? 0,
        totalAdmins: adminsCount.count ?? 0,
        totalModerators: moderatorsCount.count ?? 0,
        pendingEvents: eventsCount.count ?? 0,
        pendingGroups: groupsCount.count ?? 0,
      });
    } catch (error) {
      console.error("Error loading admin stats:", error);
      setStatusMessage({ type: "error", text: "İstatistikler yüklenirken bir hata oluştu." });
    }
  }, [isModerator, user]);

  const loadUsers = useCallback(async () => {
    if (!user || !isModerator) return;

    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, username, full_name, first_name, last_name, show_full_name, city, state, bio, avatar_url, cover_image_url, website, role, is_verified, follower_count, following_count, created_at, updated_at"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const normalizedUsers = (data ?? []).map((item) => ({
        ...item,
        profession: null,
        role: item.role === "admin" || item.role === "moderator" || item.role === "user" ? item.role : "user",
      })) as Profile[];

      setUsers(normalizedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      setStatusMessage({ type: "error", text: "Kullanıcı listesi yüklenemedi." });
    } finally {
      setUsersLoading(false);
    }
  }, [isModerator, user]);

  const loadPendingEvents = useCallback(async () => {
    if (!user || !isModerator) return;

    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*, organizer:organizer_id (id, username, full_name, avatar_url)")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPendingEvents((data ?? []) as Event[]);
    } catch (error) {
      console.error("Error loading events:", error);
      setStatusMessage({ type: "error", text: "Bekleyen etkinlikler yüklenemedi." });
    } finally {
      setEventsLoading(false);
    }
  }, [isModerator, user]);

  const loadPendingGroups = useCallback(async () => {
    if (!user || !isModerator) return;

    setGroupsLoading(true);
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*, creator:created_by (id, username, full_name, avatar_url)")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPendingGroups((data ?? []) as Group[]);
    } catch (error) {
      console.error("Error loading groups:", error);
      setStatusMessage({ type: "error", text: "Bekleyen gruplar yüklenemedi." });
    } finally {
      setGroupsLoading(false);
    }
  }, [isModerator, user]);

  const refreshActiveData = useCallback(async () => {
    setStatusMessage(null);
    await loadStats();

    if (activeTab === "overview" || activeTab === "users") {
      await loadUsers();
    }
    if (activeTab === "overview" || activeTab === "events") {
      await loadPendingEvents();
    }
    if (activeTab === "overview" || activeTab === "groups") {
      await loadPendingGroups();
    }
  }, [activeTab, loadPendingEvents, loadPendingGroups, loadStats, loadUsers]);

  useEffect(() => {
    if (user && isModerator) {
      refreshActiveData();
    }
  }, [user, isModerator, activeTab, refreshActiveData]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isAdmin) {
      setStatusMessage({ type: "error", text: "Sadece admin kullanıcılar rol değiştirebilir." });
      return;
    }

    if (userId === profile?.id) {
      setStatusMessage({ type: "error", text: "Kendi rolünüzü değiştiremezsiniz." });
      return;
    }

    setChangingRole(userId);
    setStatusMessage(null);

    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
      if (error) throw error;

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setStatusMessage({ type: "success", text: `Kullanıcı rolü ${ROLE_LABELS[newRole]} olarak güncellendi.` });
      await loadStats();
    } catch (error) {
      console.error("Error changing role:", error);
      setStatusMessage({ type: "error", text: "Rol güncellenemedi." });
    } finally {
      setChangingRole(null);
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    setProcessingId(eventId);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from("events")
        .update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString(), rejection_reason: null })
        .eq("id", eventId);

      if (error) throw error;

      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
      setStatusMessage({ type: "success", text: "Etkinlik onaylandı." });
      await loadStats();
    } catch (error) {
      console.error("Error approving event:", error);
      setStatusMessage({ type: "error", text: "Etkinlik onaylanamadı." });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveGroup = async (groupId: string) => {
    setProcessingId(groupId);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from("groups")
        .update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString(), rejection_reason: null })
        .eq("id", groupId);

      if (error) throw error;

      setPendingGroups((prev) => prev.filter((group) => group.id !== groupId));
      setStatusMessage({ type: "success", text: "Grup onaylandı." });
      await loadStats();
    } catch (error) {
      console.error("Error approving group:", error);
      setStatusMessage({ type: "error", text: "Grup onaylanamadı." });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectModal || !rejectionReason.trim()) {
      setStatusMessage({ type: "error", text: "Lütfen red sebebi girin." });
      return;
    }

    const { type, id } = showRejectModal;
    setProcessingId(id);
    setStatusMessage(null);

    try {
      const table = type === "event" ? "events" : "groups";
      const { error } = await supabase
        .from(table)
        .update({
          status: "rejected",
          rejection_reason: rejectionReason.trim(),
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      if (type === "event") {
        setPendingEvents((prev) => prev.filter((event) => event.id !== id));
      } else {
        setPendingGroups((prev) => prev.filter((group) => group.id !== id));
      }

      setShowRejectModal(null);
      setRejectionReason("");
      setStatusMessage({ type: "success", text: `${type === "event" ? "Etkinlik" : "Grup"} reddedildi.` });
      await loadStats();
    } catch (error) {
      console.error("Error rejecting content:", error);
      setStatusMessage({ type: "error", text: "Red işlemi başarısız oldu." });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter((item) => {
      const username = item.username?.toLowerCase() ?? "";
      const fullName = item.full_name?.toLowerCase() ?? "";
      const state = item.state?.toLowerCase() ?? "";
      return username.includes(query) || fullName.includes(query) || state.includes(query);
    });
  }, [searchQuery, users]);

  const displayName = profile?.full_name || profile?.username || user?.email?.split("@")[0] || "Admin";
  const usernameLabel = profile?.username ? `@${profile.username}` : (user?.email ?? "—");
  const roleLabel = ROLE_LABELS[profile?.role || "user"];
  const roleColor = ROLE_COLORS[profile?.role || "user"];

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user || !isModerator) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Erişim Engellendi</h1>
          <p className="text-neutral-500">Bu sayfaya erişim yetkiniz yok.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ak-page">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Kontrol Merkezi</h1>
              <p className="text-neutral-500">İçerik, kullanıcı ve moderasyon akışlarının tek ekran yönetimi</p>
            </div>
          </div>

          <Button variant="outline" className="gap-2" onClick={refreshActiveData}>
            <RefreshCcw size={16} />
            Yenile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 mb-8">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Admin Profili
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                <Avatar src={profile?.avatar_url || undefined} fallback={displayName} size="xl" className="ring-4 ring-white dark:ring-neutral-900" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold">{displayName}</h2>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${roleColor}`}>
                      {getRoleIcon(profile?.role)}
                      {roleLabel}
                    </span>
                  </div>
                  <p className="text-neutral-500">{usernameLabel}</p>
                  <div className="text-sm text-neutral-500 flex flex-wrap gap-3">
                    {profile?.city && profile?.state && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={14} />
                        {profile.city}, {US_STATES_MAP[profile.state] || profile.state}
                      </span>
                    )}
                    {profile?.created_at && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={14} />
                        Üyelik: {formatDate(profile.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Sistem Sağlığı</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-900 p-3">
                <p className="text-neutral-500">Bekleyen Etkinlik</p>
                <p className="text-xl font-bold">{stats.pendingEvents}</p>
              </div>
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-900 p-3">
                <p className="text-neutral-500">Bekleyen Grup</p>
                <p className="text-xl font-bold">{stats.pendingGroups}</p>
              </div>
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-900 p-3">
                <p className="text-neutral-500">Toplam Kullanıcı</p>
                <p className="text-xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="rounded-lg bg-neutral-100 dark:bg-neutral-900 p-3">
                <p className="text-neutral-500">Yönetici + Mod</p>
                <p className="text-xl font-bold">{stats.totalAdmins + stats.totalModerators}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: "overview", label: "Genel Bakış" },
            { key: "events", label: "Etkinlik Moderasyonu", badge: stats.pendingEvents },
            { key: "groups", label: "Grup Moderasyonu", badge: stats.pendingGroups },
            { key: "users", label: "Kullanıcı Yönetimi" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-purple-500 text-white"
                  : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {tab.label}
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <Badge variant="warning" size="sm">{tab.badge}</Badge>
              )}
            </button>
          ))}
        </div>

        {statusMessage && (
          <div
            className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${
              statusMessage.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {statusMessage.text}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass md:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Moderasyon Kuyruğu</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Etkinlik Onayı</span>
                  <Badge variant={stats.pendingEvents > 0 ? "warning" : "success"}>{stats.pendingEvents}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Grup Onayı</span>
                  <Badge variant={stats.pendingGroups > 0 ? "warning" : "success"}>{stats.pendingGroups}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="glass md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Önerilen Operasyon Akışı</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-neutral-600 dark:text-neutral-300 space-y-2">
                <p>1) Bekleyen etkinlik ve grup içeriklerini hızlıca temizleyin.</p>
                <p>2) Kullanıcı rol değişimlerini sadece doğrulanmış taleplerde uygulayın.</p>
                <p>3) Red kararlarında net gerekçe yazın ve tekrar başvuru yönlendirmesi ekleyin.</p>
                <p>4) Yoğunluk artarsa moderatör sayısını kademeli artırın.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-4">
            {eventsLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : pendingEvents.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-1">Bekleyen etkinlik yok</h3>
                  <p className="text-neutral-500">Moderasyon kuyruğu temiz görünüyor.</p>
                </CardContent>
              </Card>
            ) : (
              pendingEvents.map((event) => {
                const organizer = event.organizer;
                return (
                  <Card key={event.id} className="glass">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-32 h-24 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {event.cover_image_url ? (
                            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-4xl">{EVENT_CATEGORY_ICONS[event.category] || "📌"}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="warning" size="sm">Onay Bekliyor</Badge>
                            <Badge variant="default" size="sm">{EVENT_CATEGORY_LABELS[event.category] || "Diğer"}</Badge>
                          </div>
                          <h3 className="font-bold text-lg">{safeLabel(event.title, "Başlıksız Etkinlik")}</h3>
                          <p className="text-sm text-neutral-500 line-clamp-1">{safeLabel(event.description, "Açıklama girilmemiş")}</p>

                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-neutral-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(event.event_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {event.is_online ? "Online" : safeLabel(`${event.city || ""}, ${event.state || ""}`, "Konum yok")}
                            </span>
                            <span className="flex items-center gap-1">
                              <UserIcon size={14} />
                              {organizer?.full_name || organizer?.username || "Bilinmiyor"}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button variant="primary" size="sm" onClick={() => handleApproveEvent(event.id)} disabled={processingId === event.id}>
                              {processingId === event.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Onayla
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowRejectModal({ type: "event", id: event.id })} className="text-red-600">
                              <X size={14} /> Reddet
                            </Button>
                            <Link href={`/meetups/${event.id}`} target="_blank">
                              <Button variant="ghost" size="sm"><Eye size={14} /> Önizle</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {activeTab === "groups" && (
          <div className="space-y-4">
            {groupsLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : pendingGroups.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-1">Bekleyen grup yok</h3>
                  <p className="text-neutral-500">Grup moderasyon kuyruğu temiz görünüyor.</p>
                </CardContent>
              </Card>
            ) : (
              pendingGroups.map((group) => {
                const creator = group.creator;
                return (
                  <Card key={group.id} className="glass">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {group.avatar_url ? (
                            <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl">{GROUP_CATEGORY_ICONS[group.category] || "📌"}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="warning" size="sm">Onay Bekliyor</Badge>
                            <Badge variant="default" size="sm">{GROUP_CATEGORY_LABELS[group.category] || "Diğer"}</Badge>
                            {group.is_private && (
                              <Badge variant="outline" size="sm"><Lock size={10} /> Özel</Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-lg">{safeLabel(group.name, "Başlıksız Grup")}</h3>
                          <p className="text-sm text-neutral-500 line-clamp-2">{safeLabel(group.description, "Açıklama girilmemiş")}</p>

                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-neutral-500">
                            <span className="flex items-center gap-1">
                              {group.is_nationwide ? <Globe size={14} /> : <MapPin size={14} />}
                              {group.is_nationwide ? "ABD Geneli" : safeLabel(`${group.city || ""}, ${group.state || ""}`, "Konum yok")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Crown size={14} />
                              {creator?.full_name || creator?.username || "Bilinmiyor"}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button variant="primary" size="sm" onClick={() => handleApproveGroup(group.id)} disabled={processingId === group.id}>
                              {processingId === group.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Onayla
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowRejectModal({ type: "group", id: group.id })} className="text-red-600">
                              <X size={14} /> Reddet
                            </Button>
                            <Link href={`/groups/${group.slug}`} target="_blank">
                              <Button variant="ghost" size="sm"><Eye size={14} /> Önizle</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {activeTab === "users" && (
          <Card className="glass">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Kullanıcı ara..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {usersLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-neutral-500">{searchQuery ? "Sonuç bulunamadı" : "Kullanıcı yok"}</div>
              ) : (
                filteredUsers.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold flex items-center justify-center">
                        {(item.username?.[0] || "?").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{item.full_name || item.username || "İsimsiz"}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[item.role || "user"]}`}>
                            {getRoleIcon(item.role)}
                            {ROLE_LABELS[item.role || "user"]}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500 truncate">@{item.username || "—"}</p>
                      </div>
                    </div>

                    {isAdmin && item.id !== profile?.id && (
                      <select
                        value={item.role || "user"}
                        onChange={(event) => handleRoleChange(item.id, event.target.value as UserRole)}
                        disabled={changingRole === item.id}
                        className="pl-3 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                      >
                        <option value="user">Kullanıcı</option>
                        <option value="moderator">Moderatör</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRejectModal(null)} />
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-bold mb-3">{showRejectModal.type === "event" ? "Etkinliği" : "Grubu"} Reddet</h3>
              <p className="text-neutral-500 mb-4">Lütfen red sebebini girin. Bu bilgi içerik sahibine iletilecektir.</p>
              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Red sebebi..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectionReason("");
                  }}
                >
                  İptal
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim() || processingId === showRejectModal.id}>
                  {processingId === showRejectModal.id ? <Loader2 size={18} className="animate-spin" /> : "Reddet"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
