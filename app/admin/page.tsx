"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { 
  Profile, 
  UserRole, 
  ROLE_LABELS, 
  ROLE_COLORS,
  Event,
  EVENT_CATEGORY_LABELS,
  EVENT_CATEGORY_ICONS,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_COLORS,
  Group,
  GROUP_CATEGORY_LABELS,
  GROUP_CATEGORY_ICONS,
  GROUP_STATUS_LABELS,
  GROUP_STATUS_COLORS,
  US_STATES_MAP
} from "@/lib/types";
import { 
  Shield, 
  Users, 
  Search, 
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Crown,
  UserCog,
  User as UserIcon,
  Calendar,
  Clock,
  MapPin,
  Eye,
  Check,
  X,
  UsersRound,
  Globe,
  Lock
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Avatar } from "@/app/components/ui/Avatar";

type Tab = "events" | "groups" | "users";

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, isAdmin, isModerator } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>("events");
  
  // Users state
  const [users, setUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [changingRole, setChangingRole] = useState<string | null>(null);
  
  // Events state
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  
  // Groups state
  const [pendingGroups, setPendingGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  
  // Common state
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<{ type: "event" | "group"; id: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check access
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isModerator) {
        router.push("/");
      }
    }
  }, [user, authLoading, isModerator, router]);

  // Fetch users
  useEffect(() => {
    if (!user || !isModerator || activeTab !== "users") return;

    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [user, isModerator, activeTab]);

  // Fetch pending events
  useEffect(() => {
    if (!user || !isModerator || activeTab !== "events") return;

    const fetchPendingEvents = async () => {
      setEventsLoading(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select(`
            *,
            organizer:organizer_id (id, username, full_name, avatar_url)
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: true });

        if (error) throw error;
        setPendingEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchPendingEvents();
  }, [user, isModerator, activeTab]);

  // Fetch pending groups
  useEffect(() => {
    if (!user || !isModerator || activeTab !== "groups") return;

    const fetchPendingGroups = async () => {
      setGroupsLoading(true);
      try {
        const { data, error } = await supabase
          .from("groups")
          .select(`
            *,
            creator:created_by (id, username, full_name, avatar_url)
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: true });

        if (error) throw error;
        setPendingGroups(data || []);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setGroupsLoading(false);
      }
    };

    fetchPendingGroups();
  }, [user, isModerator, activeTab]);

  // Change user role
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isAdmin) {
      setStatusMessage({ type: "error", text: "Sadece adminler rol değiştirebilir" });
      return;
    }

    if (userId === profile?.id) {
      setStatusMessage({ type: "error", text: "Kendi rolünüzü değiştiremezsiniz" });
      return;
    }

    setChangingRole(userId);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      setStatusMessage({ 
        type: "success", 
        text: `Kullanıcı rolü "${ROLE_LABELS[newRole]}" olarak güncellendi` 
      });
    } catch (error: unknown) {
      console.error("Error changing role:", error);
      setStatusMessage({ type: "error", text: "Rol değiştirilemedi" });
    } finally {
      setChangingRole(null);
    }
  };

  // Approve event
  const handleApproveEvent = async (eventId: string) => {
    setProcessingId(eventId);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from("events")
        .update({ 
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", eventId);

      if (error) throw error;

      setPendingEvents(prev => prev.filter(e => e.id !== eventId));
      setStatusMessage({ type: "success", text: "Etkinlik onaylandı!" });
    } catch (error) {
      console.error("Error approving event:", error);
      setStatusMessage({ type: "error", text: "Etkinlik onaylanamadı" });
    } finally {
      setProcessingId(null);
    }
  };

  // Approve group
  const handleApproveGroup = async (groupId: string) => {
    setProcessingId(groupId);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from("groups")
        .update({ 
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", groupId);

      if (error) throw error;

      setPendingGroups(prev => prev.filter(g => g.id !== groupId));
      setStatusMessage({ type: "success", text: "Grup onaylandı!" });
    } catch (error) {
      console.error("Error approving group:", error);
      setStatusMessage({ type: "error", text: "Grup onaylanamadı" });
    } finally {
      setProcessingId(null);
    }
  };

  // Reject (event or group)
  const handleReject = async () => {
    if (!showRejectModal || !rejectionReason.trim()) {
      setStatusMessage({ type: "error", text: "Lütfen red sebebi girin" });
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
          rejection_reason: rejectionReason.trim()
        })
        .eq("id", id);

      if (error) throw error;

      if (type === "event") {
        setPendingEvents(prev => prev.filter(e => e.id !== id));
      } else {
        setPendingGroups(prev => prev.filter(g => g.id !== id));
      }
      
      setShowRejectModal(null);
      setRejectionReason("");
      setStatusMessage({ type: "success", text: `${type === "event" ? "Etkinlik" : "Grup"} reddedildi` });
    } catch (error) {
      console.error("Error rejecting:", error);
      setStatusMessage({ type: "error", text: "İşlem başarısız" });
    } finally {
      setProcessingId(null);
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      u.username?.toLowerCase().includes(query) ||
      u.full_name?.toLowerCase().includes(query) ||
      u.state?.toLowerCase().includes(query)
    );
  });

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // Role icon
  const getRoleIcon = (role?: UserRole) => {
    switch (role) {
      case "admin": return <Crown className="w-4 h-4" />;
      case "moderator": return <UserCog className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  const displayName = profile?.full_name || profile?.username || user?.email?.split("@")[0] || "Admin";
  const usernameLabel = profile?.username ? `@${profile.username}` : (user?.email ?? "—");
  const roleLabel = ROLE_LABELS[profile?.role || "user"];
  const roleColor = ROLE_COLORS[profile?.role || "user"];

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  // Not authorized
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
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Paneli</h1>
            <p className="text-neutral-500">İçerik ve kullanıcı yönetimi</p>
          </div>
        </div>

        {/* Admin Profile + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 mb-8">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Admin Profili
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <Avatar
                  src={profile?.avatar_url || undefined}
                  fallback={displayName}
                  size="xl"
                  className="ring-4 ring-white dark:ring-neutral-900 shadow-lg"
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold">{displayName}</h2>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${roleColor}`}>
                      {getRoleIcon(profile?.role)}
                      {roleLabel}
                    </span>
                  </div>
                  <p className="text-neutral-500">{usernameLabel}</p>
                  <div className="flex flex-wrap gap-2 text-sm text-neutral-500">
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
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="primary" onClick={() => setActiveTab("events")} className="gap-2">
                      <Calendar size={14} />
                      Etkinlik Onayları
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab("groups")} className="gap-2">
                      <UsersRound size={14} />
                      Grup Onayları
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setActiveTab("users")} className="gap-2">
                      <Users size={14} />
                      Kullanıcılar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="glass">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Bekleyen Etkinlik</p>
                  <p className="text-2xl font-bold">{pendingEvents.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Bekleyen Grup</p>
                  <p className="text-2xl font-bold">{pendingGroups.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UsersRound className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass sm:col-span-2">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Toplam Kullanıcı</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === "events"
                ? "bg-red-500 text-white"
                : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Calendar size={18} />
            Etkinlikler
            {pendingEvents.length > 0 && (
              <Badge variant="warning" size="sm">{pendingEvents.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === "groups"
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <UsersRound size={18} />
            Gruplar
            {pendingGroups.length > 0 && (
              <Badge variant="warning" size="sm">{pendingGroups.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === "users"
                ? "bg-purple-500 text-white"
                : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Users size={18} />
            Kullanıcılar
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${
              statusMessage.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {statusMessage.text}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-4">
            {eventsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : pendingEvents.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Tüm etkinlikler onaylandı!</h3>
                  <p className="text-neutral-500">Bekleyen etkinlik bulunmuyor.</p>
                </CardContent>
              </Card>
            ) : (
              pendingEvents.map(event => {
                const organizer = event.organizer as any;
                return (
                  <Card key={event.id} className="glass">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-32 h-24 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {event.cover_image_url ? (
                            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-4xl">{EVENT_CATEGORY_ICONS[event.category]}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="warning" size="sm">{EVENT_STATUS_LABELS.pending}</Badge>
                            <Badge variant="default" size="sm">{EVENT_CATEGORY_LABELS[event.category]}</Badge>
                          </div>
                          <h3 className="font-bold text-lg">{event.title}</h3>
                          <p className="text-sm text-neutral-500 line-clamp-1">{event.description}</p>
                          
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-neutral-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(event.event_date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {event.is_online ? "Online" : `${event.city}, ${event.state}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <UserIcon size={14} />
                              {organizer?.full_name || organizer?.username}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveEvent(event.id)}
                              disabled={processingId === event.id}
                              className="gap-1"
                            >
                              {processingId === event.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              Onayla
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowRejectModal({ type: "event", id: event.id })}
                              className="gap-1 text-red-600"
                            >
                              <X size={14} />
                              Reddet
                            </Button>
                            <Link href={`/meetups/${event.id}`} target="_blank">
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Eye size={14} />
                                Önizle
                              </Button>
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

        {/* Groups Tab */}
        {activeTab === "groups" && (
          <div className="space-y-4">
            {groupsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : pendingGroups.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Tüm gruplar onaylandı!</h3>
                  <p className="text-neutral-500">Bekleyen grup bulunmuyor.</p>
                </CardContent>
              </Card>
            ) : (
              pendingGroups.map(group => {
                const creator = group.creator as any;
                return (
                  <Card key={group.id} className="glass">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {group.avatar_url ? (
                            <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl">{GROUP_CATEGORY_ICONS[group.category]}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="warning" size="sm">{GROUP_STATUS_LABELS.pending}</Badge>
                            <Badge variant="default" size="sm">{GROUP_CATEGORY_LABELS[group.category]}</Badge>
                            {group.is_private && (
                              <Badge variant="default" size="sm" className="gap-1">
                                <Lock size={10} />
                                Özel
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-lg">{group.name}</h3>
                          <p className="text-sm text-neutral-500 line-clamp-2">{group.description}</p>
                          
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-neutral-500">
                            <span className="flex items-center gap-1">
                              {group.is_nationwide ? <Globe size={14} /> : <MapPin size={14} />}
                              {group.is_nationwide ? "ABD Geneli" : `${group.city}, ${group.state}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Crown size={14} />
                              {creator?.full_name || creator?.username}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveGroup(group.id)}
                              disabled={processingId === group.id}
                              className="gap-1"
                            >
                              {processingId === group.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              Onayla
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowRejectModal({ type: "group", id: group.id })}
                              className="gap-1 text-red-600"
                            >
                              <X size={14} />
                              Reddet
                            </Button>
                            <Link href={`/groups/${group.slug}`} target="_blank">
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Eye size={14} />
                                Önizle
                              </Button>
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

        {/* Users Tab */}
        {activeTab === "users" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-sm text-neutral-500">Toplam</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === "admin").length}</p>
                    <p className="text-sm text-neutral-500">Admin</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <UserCog className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{users.filter(u => u.role === "moderator").length}</p>
                    <p className="text-sm text-neutral-500">Moderatör</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="glass">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Kullanıcı ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                  <div className="p-8 text-center text-neutral-500">
                    {searchQuery ? "Sonuç bulunamadı" : "Kullanıcı yok"}
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                          {u.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{u.full_name || u.username || "İsimsiz"}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role || 'user']}`}>
                              {getRoleIcon(u.role)}
                              {ROLE_LABELS[u.role || 'user']}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500">@{u.username || "—"}</p>
                        </div>
                      </div>

                      {isAdmin && u.id !== profile?.id && (
                        <div className="relative">
                          <select
                            value={u.role || 'user'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            disabled={changingRole === u.id}
                            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                          >
                            <option value="user">Kullanıcı</option>
                            <option value="moderator">Moderatör</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRejectModal(null)} />
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-bold mb-4">
                {showRejectModal.type === "event" ? "Etkinliği" : "Grubu"} Reddet
              </h3>
              <p className="text-neutral-500 mb-4">
                Lütfen red sebebini belirtin. Bu mesaj içerik sahibine gönderilecektir.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Red sebebi..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
              />
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason("");
                }}>
                  İptal
                </Button>
                <Button 
                  variant="primary"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || processingId === showRejectModal.id}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {processingId === showRejectModal.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Reddet"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
