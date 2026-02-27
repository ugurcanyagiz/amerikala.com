"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { ROLE_LABELS, ROLE_COLORS, US_STATES_MAP } from "@/lib/types";
import Sidebar from "../components/Sidebar";
import ProfileEditModal from "../components/ProfileEditModal";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { ProfileTabs } from "./[id]/components/ProfileTabs";
import { FollowersList } from "./[id]/components/FollowersList";
import { FollowingList } from "./[id]/components/FollowingList";
import { GroupsList, GroupRow } from "./[id]/components/GroupsList";
import { EventsList, EventRow } from "./[id]/components/EventsList";
import { UserListItem, ProfileTab } from "./[id]/components/types";
import { 
  Settings,
  MapPin,
  Calendar,
  Edit,
  Camera,
  Loader2,
  Shield,
  CheckCircle,
  Activity,
  RefreshCw,
  Heart,
  MessageSquare,
  UserPlus,
  PartyPopper,
  Users,
  FileText,
} from "lucide-react";

const PAGE_SIZE = 8;
const FOLLOW_COLUMNS = { from: "follower_id", to: "following_id" } as const;

type ActivityItem = {
  id: string;
  type: "like" | "comment" | "new_follower" | "event_join" | "group_join" | "post_created";
  title: string;
  description: string;
  createdAt: string;
  href: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [stats, setStats] = useState({ 
    followers: 0, 
    following: 0,
    groups: 0,
    events: 0 
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("followers");
  const [listError, setListError] = useState<string | null>(null);

  const [followers, setFollowers] = useState<UserListItem[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersSearch, setFollowersSearch] = useState("");
  const [followersOffset, setFollowersOffset] = useState(0);
  const [followersHasMore, setFollowersHasMore] = useState(false);

  const [following, setFollowing] = useState<UserListItem[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingSearch, setFollowingSearch] = useState("");
  const [followingOffset, setFollowingOffset] = useState(0);
  const [followingHasMore, setFollowingHasMore] = useState(false);

  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsOffset, setGroupsOffset] = useState(0);
  const [groupsHasMore, setGroupsHasMore] = useState(false);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsOffset, setEventsOffset] = useState(0);
  const [eventsHasMore, setEventsHasMore] = useState(false);

  const getFriendlyError = (error: { code?: string; message?: string } | null) => {
    if (!error) return null;
    if (error.code === "42501" || error.message?.includes("403")) {
      return "Bu içerik gizlilik ayarları nedeniyle görüntülenemiyor.";
    }
    if (error.message?.includes("401")) {
      return "Bu içeriği görmek için giriş yapmanız gerekiyor.";
    }
    return "Veri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.";
  };

  // Debug log
  useEffect(() => {
    console.log("ProfilePage - authLoading:", authLoading, "user:", !!user, "profile:", !!profile);
  }, [authLoading, user, profile]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("ProfilePage - No user, redirecting to login");
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Backward-compatible deep link support: /profile#<id> -> /profile/<id>
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash.replace("#", "").trim();
    if (!hash) return;

    router.replace(`/profile/${hash}`);
  }, [router]);

  // Fetch stats
  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
      try {
        const [followersResult, followingResult] = await Promise.all([
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq(FOLLOW_COLUMNS.to, user.id),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq(FOLLOW_COLUMNS.from, user.id),
        ]);

        setStats((prev) => ({
          ...prev,
          followers: followersResult.count || 0,
          following: followingResult.count || 0,
        }));

        // Fetch group memberships count - with error handling
        try {
          const { count: groupCount } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "approved");

          setStats((prev) => ({ ...prev, groups: groupCount || 0 }));
        } catch {
          // Table might not exist
        }

        // Fetch event attendances count - with error handling
        try {
          const { count: eventCount } = await supabase
            .from("event_attendees")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          setStats((prev) => ({ ...prev, events: eventCount || 0 }));
        } catch {
          // Table might not exist
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      setActivityLoading(true);

      try {
        const { data: myPosts, error: postsError } = await supabase
          .from("posts")
          .select("id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (postsError) throw postsError;

        const postIds = (myPosts || []).map((post) => post.id);

        const [likesResult, commentsResult, joinedEventsResult, joinedGroupsResult] = await Promise.all([
          postIds.length
            ? supabase.from("likes").select("post_id, user_id, created_at").in("post_id", postIds).neq("user_id", user.id)
            : Promise.resolve({ data: [], error: null }),
          postIds.length
            ? supabase.from("comments").select("id, post_id, user_id, content, created_at").in("post_id", postIds).neq("user_id", user.id)
            : Promise.resolve({ data: [], error: null }),
          supabase.from("event_attendees").select("event_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabase
            .from("group_members")
            .select("group_id, joined_at")
            .eq("user_id", user.id)
            .eq("status", "approved")
            .order("joined_at", { ascending: false })
            .limit(20),
        ]);

        if (likesResult.error) throw likesResult.error;
        if (commentsResult.error) throw commentsResult.error;

        const likes = likesResult.data || [];
        const comments = commentsResult.data || [];
        const joinedEvents = joinedEventsResult.data || [];
        const joinedGroups = joinedGroupsResult.data || [];

        const [eventRowsResult, groupRowsResult] = await Promise.all([
          joinedEvents.length
            ? supabase.from("events").select("id, title").in("id", joinedEvents.map((item) => item.event_id))
            : Promise.resolve({ data: [], error: null }),
          joinedGroups.length
            ? supabase.from("groups").select("id, name, slug").in("id", joinedGroups.map((item) => item.group_id))
            : Promise.resolve({ data: [], error: null }),
        ]);

        const eventsMap = new Map((eventRowsResult.data || []).map((item) => [item.id, item]));
        const groupsMap = new Map((groupRowsResult.data || []).map((item) => [item.id, item]));

        const { data: followerRows, error: followerError } = await supabase
          .from("follows")
          .select("follower_id, created_at")
          .eq("following_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (followerError) throw followerError;

        const followers: Array<{ user_id: string; created_at: string }> =
          ((followerRows || []) as Array<{ follower_id: string; created_at: string }>).map((row) => ({
            user_id: row.follower_id,
            created_at: row.created_at,
          }));

        const actorIds = Array.from(new Set([
          ...likes.map((item) => item.user_id),
          ...comments.map((item) => item.user_id),
          ...followers.map((item) => item.user_id),
        ]));

        const { data: actorProfiles } = actorIds.length
          ? await supabase.from("profiles").select("id, first_name, last_name, username").in("id", actorIds)
          : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null; username: string | null }> };

        const actorMap = new Map(
          (actorProfiles || []).map((item) => [item.id, [item.first_name, item.last_name].filter(Boolean).join(" ") || item.username || "Bir kullanıcı"])
        );

        const feed: ActivityItem[] = [
          ...likes.map((item) => ({
            id: `like-${item.post_id}-${item.user_id}`,
            type: "like" as const,
            title: "Gönderin beğenildi",
            description: `${actorMap.get(item.user_id) || "Bir kullanıcı"} gönderini beğendi.`,
            createdAt: item.created_at,
            href: "/feed",
          })),
          ...comments.map((item) => ({
            id: `comment-${item.id}`,
            type: "comment" as const,
            title: "Yeni yorum",
            description: `${actorMap.get(item.user_id) || "Bir kullanıcı"} gönderine yorum yaptı${item.content ? `: \"${String(item.content).slice(0, 80)}\"` : "."}`,
            createdAt: item.created_at,
            href: "/feed",
          })),
          ...followers.map((item) => ({
            id: `follower-${item.user_id}-${item.created_at}`,
            type: "new_follower" as const,
            title: "Yeni arkadaş / takipçi",
            description: `${actorMap.get(item.user_id) || "Bir kullanıcı"} seni takip etti.`,
            createdAt: item.created_at,
            href: `/profile/${item.user_id}`,
          })),
          ...joinedEvents.map((item) => ({
            id: `event-${item.event_id}-${item.created_at}`,
            type: "event_join" as const,
            title: "Etkinlik katılımı",
            description: `${eventsMap.get(item.event_id)?.title || "Bir"} etkinliğine katılım gösterdin.`,
            createdAt: item.created_at,
            href: `/events/${item.event_id}`,
          })),
          ...joinedGroups.map((item) => ({
            id: `group-${item.group_id}-${item.joined_at}`,
            type: "group_join" as const,
            title: "Yeni grup üyeliği",
            description: `${groupsMap.get(item.group_id)?.name || "Bir"} grubuna katıldın.`,
            createdAt: item.joined_at,
            href: groupsMap.get(item.group_id)?.slug ? `/groups/${groupsMap.get(item.group_id)?.slug}` : "/groups",
          })),
          ...(myPosts || []).map((post) => ({
            id: `post-${post.id}`,
            type: "post_created" as const,
            title: "Gönderi paylaştın",
            description: "Feed üzerinde yeni bir paylaşım yaptın.",
            createdAt: post.created_at,
            href: "/feed",
          })),
        ]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 12);

        setActivities(feed);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivities();
  }, [user]);

  const fetchFollowersPage = useCallback(async (offset: number, reset: boolean) => {
    if (!user?.id) return;
    setFollowersLoading(true);
    setListError(null);

    const { data: rows, error } = await supabase
      .from("follows")
      .select(FOLLOW_COLUMNS.from)
      .eq(FOLLOW_COLUMNS.to, user.id)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      setListError(getFriendlyError(error));
      setFollowersLoading(false);
      return;
    }

    const ids = ((rows as unknown as Array<Record<string, string>> | null) || []).map((row) => row[FOLLOW_COLUMNS.from]).filter(Boolean);
    if (ids.length === 0) {
      setFollowers((prev) => (reset ? [] : prev));
      setFollowersHasMore(false);
      setFollowersLoading(false);
      return;
    }

    let profileQuery = supabase.from("profiles").select("id, username, full_name, first_name, last_name, avatar_url").in("id", ids);
    if (followersSearch.trim()) {
      const q = followersSearch.trim();
      profileQuery = profileQuery.or(`username.ilike.%${q}%,full_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
    }

    const { data: profileRows, error: profilesError } = await profileQuery;
    if (profilesError) {
      setListError(getFriendlyError(profilesError));
      setFollowersLoading(false);
      return;
    }

    const map = new Map((profileRows || []).map((item) => [item.id, item as UserListItem]));
    const ordered = ids.map((pid) => map.get(pid)).filter(Boolean) as UserListItem[];
    setFollowers((prev) => (reset ? ordered : [...prev, ...ordered]));
    setFollowersOffset(offset + PAGE_SIZE);
    setFollowersHasMore(ids.length === PAGE_SIZE);
    setFollowersLoading(false);
  }, [followersSearch, user?.id]);

  const fetchFollowingPage = useCallback(async (offset: number, reset: boolean) => {
    if (!user?.id) return;
    setFollowingLoading(true);
    setListError(null);

    const { data: rows, error } = await supabase
      .from("follows")
      .select(FOLLOW_COLUMNS.to)
      .eq(FOLLOW_COLUMNS.from, user.id)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      setListError(getFriendlyError(error));
      setFollowingLoading(false);
      return;
    }

    const ids = ((rows as unknown as Array<Record<string, string>> | null) || []).map((row) => row[FOLLOW_COLUMNS.to]).filter(Boolean);
    if (ids.length === 0) {
      setFollowing((prev) => (reset ? [] : prev));
      setFollowingHasMore(false);
      setFollowingLoading(false);
      return;
    }

    let profileQuery = supabase.from("profiles").select("id, username, full_name, first_name, last_name, avatar_url").in("id", ids);
    if (followingSearch.trim()) {
      const q = followingSearch.trim();
      profileQuery = profileQuery.or(`username.ilike.%${q}%,full_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
    }

    const { data: profileRows, error: profilesError } = await profileQuery;
    if (profilesError) {
      setListError(getFriendlyError(profilesError));
      setFollowingLoading(false);
      return;
    }

    const map = new Map((profileRows || []).map((item) => [item.id, item as UserListItem]));
    const ordered = ids.map((pid) => map.get(pid)).filter(Boolean) as UserListItem[];
    setFollowing((prev) => (reset ? ordered : [...prev, ...ordered]));
    setFollowingOffset(offset + PAGE_SIZE);
    setFollowingHasMore(ids.length === PAGE_SIZE);
    setFollowingLoading(false);
  }, [followingSearch, user?.id]);

  const fetchGroupsPage = useCallback(async (offset: number, reset: boolean) => {
    if (!user?.id) return;
    setGroupsLoading(true);
    setListError(null);

    const { data: memberships, error } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      setListError(getFriendlyError(error));
      setGroupsLoading(false);
      return;
    }

    const groupIds = (memberships || []).map((item) => item.group_id);
    if (groupIds.length === 0) {
      setGroups((prev) => (reset ? [] : prev));
      setGroupsHasMore(false);
      setGroupsLoading(false);
      return;
    }

    const { data: groupsRows, error: groupsError } = await supabase
      .from("groups")
      .select("id, slug, name, description, member_count")
      .in("id", groupIds);

    if (groupsError) {
      setListError(getFriendlyError(groupsError));
      setGroupsLoading(false);
      return;
    }

    const map = new Map((groupsRows || []).map((item) => [item.id, { ...item, isMember: true } as GroupRow]));
    const ordered = groupIds.map((gid) => map.get(gid)).filter(Boolean) as GroupRow[];
    setGroups((prev) => (reset ? ordered : [...prev, ...ordered]));
    setGroupsOffset(offset + PAGE_SIZE);
    setGroupsHasMore(groupIds.length === PAGE_SIZE);
    setGroupsLoading(false);
  }, [user?.id]);

  const fetchEventsPage = useCallback(async (offset: number, reset: boolean) => {
    if (!user?.id) return;
    setEventsLoading(true);
    setListError(null);

    const { data: memberships, error } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("user_id", user.id)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      setListError(getFriendlyError(error));
      setEventsLoading(false);
      return;
    }

    const eventIds = (memberships || []).map((item) => item.event_id);
    if (eventIds.length === 0) {
      setEvents((prev) => (reset ? [] : prev));
      setEventsHasMore(false);
      setEventsLoading(false);
      return;
    }

    const { data: eventsRows, error: eventsError } = await supabase
      .from("events")
      .select("id, title, event_date, city, location_name, cover_image_url")
      .in("id", eventIds);

    if (eventsError) {
      setListError(getFriendlyError(eventsError));
      setEventsLoading(false);
      return;
    }

    const map = new Map((eventsRows || []).map((item) => [item.id, { ...item, joined: true } as EventRow]));
    const ordered = eventIds.map((eid) => map.get(eid)).filter(Boolean) as EventRow[];
    setEvents((prev) => (reset ? ordered : [...prev, ...ordered]));
    setEventsOffset(offset + PAGE_SIZE);
    setEventsHasMore(eventIds.length === PAGE_SIZE);
    setEventsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (activeTab === "groups") {
      setGroups([]);
      setGroupsOffset(0);
      fetchGroupsPage(0, true);
    }
    if (activeTab === "events") {
      setEvents([]);
      setEventsOffset(0);
      fetchEventsPage(0, true);
    }
  }, [activeTab, fetchEventsPage, fetchGroupsPage, user?.id]);

  useEffect(() => {
    if (!user?.id || activeTab !== "followers") return;
    setFollowers([]);
    setFollowersOffset(0);
    fetchFollowersPage(0, true);
  }, [activeTab, fetchFollowersPage, followersSearch, user?.id]);

  useEffect(() => {
    if (!user?.id || activeTab !== "following") return;
    setFollowing([]);
    setFollowingOffset(0);
    fetchFollowingPage(0, true);
  }, [activeTab, fetchFollowingPage, followingSearch, user?.id]);

  // Format join date
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
    } catch {
      return "—";
    }
  };

  // Get display name
  const getDisplayName = () => {
    if (!profile) return user?.email?.split('@')[0] || "Kullanıcı";
    if (profile.full_name) {
      return profile.full_name;
    }
    return profile.username || user?.email?.split('@')[0] || "Kullanıcı";
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Az önce";
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} sa önce`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString("tr-TR");
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "like":
        return <Heart size={14} className="text-pink-500" />;
      case "comment":
        return <MessageSquare size={14} className="text-indigo-500" />;
      case "new_follower":
        return <UserPlus size={14} className="text-blue-500" />;
      case "event_join":
        return <PartyPopper size={14} className="text-amber-500" />;
      case "group_join":
        return <Users size={14} className="text-emerald-500" />;
      default:
        return <FileText size={14} className="text-neutral-500" />;
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
          <p className="mt-2 text-neutral-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Not logged in - will redirect
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
          <p className="mt-2 text-neutral-500">Yönlendiriliyor...</p>
        </div>
      </div>
    );
  }

  // Profile not loaded yet - show with retry button
  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
          <p className="mt-2 text-neutral-500">Profil yükleniyor...</p>
          <div className="flex gap-2 justify-center mt-4">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => refreshProfile()}
              className="gap-2"
            >
              <RefreshCw size={16} />
              Yeniden Dene
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Sayfayı Yenile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Safe access to profile fields
  const isVerified = profile.is_verified ?? false;
  const avatarSrc = profile.avatar_url || "/logo.png";

  return (
    <div className="ak-page">
      <div className="flex">
        <Sidebar />

        <main className="flex-1">
          <div className="ak-shell lg:px-8 py-6">
            {/* PROFILE */}
            <Card className="glass mb-6">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={avatarSrc}
                      fallback={getDisplayName()}
                      size="xl"
                      className="ring-4 ring-white dark:ring-neutral-900 shadow-xl"
                    />
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:scale-110 transition-smooth shadow-lg"
                    >
                      <Camera size={16} className="text-neutral-600 dark:text-neutral-300" />
                    </button>
                    
                    {isVerified && (
                      <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white dark:ring-neutral-900">
                        <CheckCircle size={14} className="text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                            {getDisplayName()}
                          </h1>
                          
                          {profile.role && profile.role !== "user" && (
                            <Badge variant="primary" size="sm" className={ROLE_COLORS[profile.role]}>
                              <Shield size={12} className="mr-1" />
                              {ROLE_LABELS[profile.role]}
                            </Badge>
                          )}
                          
                        </div>
                        
                        <p className="text-neutral-500 dark:text-neutral-400 mb-2">
                          @{profile.username || user?.email?.split("@")[0] || "kullanici"}
                        </p>
                        
                        {profile.bio && (
                          <p className="text-neutral-700 dark:text-neutral-300 max-w-xl text-sm sm:text-base leading-relaxed">
                            {profile.bio}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="gap-2"
                          onClick={() => setIsEditModalOpen(true)}
                        >
                          <Edit size={16} />
                          <span className="hidden sm:inline">Düzenle</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push("/ayarlar")}
                        >
                          <Settings size={16} />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                      {(profile.city || profile.state) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={15} className="text-neutral-400" />
                          <span>
                            {[profile.city, profile.state && US_STATES_MAP[profile.state]].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5">
                        <Calendar size={15} className="text-neutral-400" />
                        <span>Katıldı {formatJoinDate(profile.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-neutral-200/70 dark:border-neutral-800">
                      <button onClick={() => setActiveTab("followers")} className="px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-smooth">
                        <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{stats.followers}</span>
                        <span className="text-sm text-neutral-500 ml-1">Takipçi</span>
                      </button>
                      <button onClick={() => setActiveTab("following")} className="px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-smooth">
                        <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{stats.following}</span>
                        <span className="text-sm text-neutral-500 ml-1">Takip</span>
                      </button>
                      <button onClick={() => setActiveTab("groups")} className="px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-smooth">
                        <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{stats.groups}</span>
                        <span className="text-sm text-neutral-500 ml-1">Grup</span>
                      </button>
                      <button onClick={() => setActiveTab("events")} className="px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-smooth">
                        <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">{stats.events}</span>
                        <span className="text-sm text-neutral-500 ml-1">Etkinlik</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass mb-6">
              <CardHeader className="pb-3">
                <CardTitle>Bağlantılar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
                {listError && <p className="text-sm text-red-600">{listError}</p>}

                {activeTab === "followers" && (
                  <FollowersList
                    items={followers}
                    loading={followersLoading}
                    hasMore={followersHasMore}
                    search={followersSearch}
                    onSearchChange={setFollowersSearch}
                    onLoadMore={() => fetchFollowersPage(followersOffset, false)}
                  />
                )}

                {activeTab === "following" && (
                  <FollowingList
                    items={following}
                    loading={followingLoading}
                    hasMore={followingHasMore}
                    search={followingSearch}
                    onSearchChange={setFollowingSearch}
                    onLoadMore={() => fetchFollowingPage(followingOffset, false)}
                  />
                )}

                {activeTab === "groups" && (
                  <GroupsList
                    items={groups}
                    loading={groupsLoading}
                    hasMore={groupsHasMore}
                    onLoadMore={() => fetchGroupsPage(groupsOffset, false)}
                  />
                )}

                {activeTab === "events" && (
                  <EventsList
                    items={events}
                    loading={eventsLoading}
                    hasMore={eventsHasMore}
                    onLoadMore={() => fetchEventsPage(eventsOffset, false)}
                  />
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="space-y-6">
                <Card className="glass">
                  <CardContent className="p-6 space-y-6">
                    {activityLoading ? (
                      <div className="text-center py-8 text-neutral-500">Aktiviteler yükleniyor...</div>
                    ) : activities.length === 0 ? (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                        <h3 className="font-semibold text-lg mb-1">Aktivite geçmişi</h3>
                        <p className="text-neutral-500 text-sm">Henüz görüntülenecek aktivite bulunmuyor.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activities.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => router.push(item.href)}
                            className="w-full text-left flex items-start gap-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-3 bg-white/70 dark:bg-neutral-900/40 hover:bg-neutral-100/80 dark:hover:bg-neutral-900 transition-smooth"
                          >
                            <div className="mt-0.5 h-7 w-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                              {getActivityIcon(item.type)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{item.title}</p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
                            </div>
                            <span className="text-xs text-neutral-500">{getRelativeTime(item.createdAt)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Profile Modal */}
      {profile && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onSave={refreshProfile}
        />
      )}
    </div>
  );
}
