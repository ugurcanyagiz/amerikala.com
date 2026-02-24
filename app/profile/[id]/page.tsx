"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Flag, Loader2, ShieldAlert, Users, Heart } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { EventRow, EventsList } from "./components/EventsList";
import { FollowersList } from "./components/FollowersList";
import { FollowingList } from "./components/FollowingList";
import { GroupRow, GroupsList } from "./components/GroupsList";
import { ProfileHeaderCard } from "./components/ProfileHeaderCard";
import { ProfileTabs } from "./components/ProfileTabs";
import { ProfileStats, ProfileTab, PublicProfile, UserListItem, getDisplayName } from "./components/types";

type FollowPair = { from: string; to: string };
const PAGE_SIZE = 8;

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

const normalizeTab = (value: string | null): ProfileTab => {
  if (value === "following" || value === "groups" || value === "events") return value;
  return "followers";
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followColumns, setFollowColumns] = useState<FollowPair | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ followers: 0, following: 0, groups: 0, events: 0 });
  const [mutuals, setMutuals] = useState({ groups: 0, events: 0 });
  const [blockedByOwner, setBlockedByOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>(normalizeTab(searchParams.get("tab")));

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

  const [listError, setListError] = useState<string | null>(null);

  const isOwner = !!user && user.id === profile?.id;
  const isRestricted = blockedByOwner || !!profile?.is_blocked;
  const canInteract = !!user && !isOwner && !isRestricted;

  const setTabInUrl = useCallback((tab: ProfileTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleTabChange = useCallback((tab: ProfileTab) => {
    setActiveTab(tab);
    setTabInUrl(tab);
  }, [setTabInUrl]);

  const handleStatClick = useCallback((tab: ProfileTab) => {
    handleTabChange(tab);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [handleTabChange]);

  useEffect(() => {
    setActiveTab(normalizeTab(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      setLoading(true);

      const baseSelect = "id, username, full_name, first_name, last_name, bio, avatar_url, city, state, is_verified, is_blocked";
      const { data: byIdData, error: byIdError } = await supabase.from("profiles").select(baseSelect).eq("id", id).single();
      if (!byIdError && byIdData) {
        setProfile(byIdData as PublicProfile);
        setLoading(false);
        return;
      }

      const { data: byUsernameData, error: byUsernameError } = await supabase.from("profiles").select(baseSelect).eq("username", id).single();
      setProfile(!byUsernameError && byUsernameData ? (byUsernameData as PublicProfile) : null);
      setLoading(false);
    };

    loadProfile();
  }, [id]);

  useEffect(() => {
    const resolveFollowColumns = async () => {
      const pairs: FollowPair[] = [
        { from: "follower_id", to: "following_id" },
        { from: "user_id", to: "target_user_id" },
        { from: "user_id", to: "followed_user_id" },
      ];

      for (const pair of pairs) {
        const { error } = await supabase.from("follows").select(`${pair.from},${pair.to}`).limit(1);
        if (!error) {
          setFollowColumns(pair);
          return;
        }
      }
      setFollowColumns(null);
    };

    resolveFollowColumns();
  }, []);

  useEffect(() => {
    const checkBlockedState = async () => {
      if (!user || !profile || user.id === profile.id) {
        setBlockedByOwner(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_id", profile.id)
        .eq("blocked_id", user.id)
        .limit(1);

      if (error && error.code !== "42P01") {
        console.error("Error checking user block:", error);
      }

      setBlockedByOwner((data?.length || 0) > 0);
    };

    checkBlockedState();
  }, [profile, user]);

  useEffect(() => {
    const loadStats = async () => {
      if (!profile?.id || !followColumns) return;

      const [followerRes, followingRes, groupRes, eventRes] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq(followColumns.to, profile.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq(followColumns.from, profile.id),
        supabase.from("group_members").select("*", { count: "exact", head: true }).eq("user_id", profile.id).eq("status", "approved"),
        supabase.from("event_attendees").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
      ]);

      setStats({
        followers: followerRes.count || 0,
        following: followingRes.count || 0,
        groups: groupRes.count || 0,
        events: eventRes.count || 0,
      });
    };

    loadStats();
  }, [followColumns, profile?.id]);

  useEffect(() => {
    const loadMutuals = async () => {
      if (!user || !profile?.id || user.id === profile.id) return;

      const [myGroupsRes, targetGroupsRes, myEventsRes, targetEventsRes] = await Promise.all([
        supabase.from("group_members").select("group_id").eq("user_id", user.id).eq("status", "approved"),
        supabase.from("group_members").select("group_id").eq("user_id", profile.id).eq("status", "approved"),
        supabase.from("event_attendees").select("event_id").eq("user_id", user.id),
        supabase.from("event_attendees").select("event_id").eq("user_id", profile.id),
      ]);

      const myGroups = new Set((myGroupsRes.data || []).map((item) => item.group_id));
      const targetGroups = (targetGroupsRes.data || []).filter((item) => myGroups.has(item.group_id));
      const myEvents = new Set((myEventsRes.data || []).map((item) => item.event_id));
      const targetEvents = (targetEventsRes.data || []).filter((item) => myEvents.has(item.event_id));

      setMutuals({ groups: targetGroups.length, events: targetEvents.length });
    };

    loadMutuals();
  }, [profile?.id, user]);

  useEffect(() => {
    const checkFollowing = async () => {
      if (!user || !profile?.id || user.id === profile.id || !followColumns) return;
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq(followColumns.from, user.id)
        .eq(followColumns.to, profile.id)
        .limit(1);

      if (!error) setIsFollowing((data?.length || 0) > 0);
    };

    checkFollowing();
  }, [followColumns, profile?.id, user]);

  const fetchFollowers = useCallback(async (reset = false) => {
    if (!profile?.id || !followColumns) return;
    const offset = reset ? 0 : followersOffset;
    setFollowersLoading(true);
    setListError(null);

    const { data: rows, error } = await supabase
      .from("follows")
      .select(followColumns.from)
      .eq(followColumns.to, profile.id)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      setListError(getFriendlyError(error));
      setFollowersLoading(false);
      return;
    }

    const ids = ((rows as Array<Record<string, string>> | null) || []).map((row) => row[followColumns.from]).filter(Boolean);
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
  }, [followersOffset, followersSearch, followColumns, profile?.id]);

  const fetchFollowing = useCallback(async (reset = false) => {
    if (!profile?.id || !followColumns) return;
    const offset = reset ? 0 : followingOffset;
    setFollowingLoading(true);
    setListError(null);

    const { data: rows, error } = await supabase
      .from("follows")
      .select(followColumns.to)
      .eq(followColumns.from, profile.id)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      setListError(getFriendlyError(error));
      setFollowingLoading(false);
      return;
    }

    const ids = ((rows as Array<Record<string, string>> | null) || []).map((row) => row[followColumns.to]).filter(Boolean);
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
  }, [followColumns, followingOffset, followingSearch, profile?.id]);

  const fetchGroups = useCallback(async (reset = false) => {
    if (!profile?.id) return;
    const offset = reset ? 0 : groupsOffset;
    setGroupsLoading(true);
    setListError(null);

    const { data: memberships, error } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", profile.id)
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

    const [groupsRes, myMembershipRes] = await Promise.all([
      supabase.from("groups").select("id, slug, name, description, member_count").in("id", groupIds),
      user ? supabase.from("group_members").select("group_id").eq("user_id", user.id).in("group_id", groupIds).eq("status", "approved") : Promise.resolve({ data: [] as Array<{ group_id: string }>, error: null }),
    ]);

    if (groupsRes.error) {
      setListError(getFriendlyError(groupsRes.error));
      setGroupsLoading(false);
      return;
    }

    const myGroupSet = new Set((myMembershipRes.data || []).map((item) => item.group_id));
    const map = new Map((groupsRes.data || []).map((item) => [item.id, { ...item, isMember: myGroupSet.has(item.id) } as GroupRow]));
    const ordered = groupIds.map((gid) => map.get(gid)).filter(Boolean) as GroupRow[];
    setGroups((prev) => (reset ? ordered : [...prev, ...ordered]));
    setGroupsOffset(offset + PAGE_SIZE);
    setGroupsHasMore(groupIds.length === PAGE_SIZE);
    setGroupsLoading(false);
  }, [groupsOffset, profile?.id, user]);

  const fetchEvents = useCallback(async (reset = false) => {
    if (!profile?.id) return;
    const offset = reset ? 0 : eventsOffset;
    setEventsLoading(true);
    setListError(null);

    const { data: memberships, error } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("user_id", profile.id)
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

    const [eventsRes, myAttendRes] = await Promise.all([
      supabase.from("events").select("id, title, event_date, city, location_name, cover_image_url").in("id", eventIds),
      user ? supabase.from("event_attendees").select("event_id").eq("user_id", user.id).in("event_id", eventIds) : Promise.resolve({ data: [] as Array<{ event_id: string }>, error: null }),
    ]);

    if (eventsRes.error) {
      setListError(getFriendlyError(eventsRes.error));
      setEventsLoading(false);
      return;
    }

    const myEventSet = new Set((myAttendRes.data || []).map((item) => item.event_id));
    const map = new Map((eventsRes.data || []).map((item) => [item.id, { ...item, joined: myEventSet.has(item.id) } as EventRow]));
    const ordered = eventIds.map((eid) => map.get(eid)).filter(Boolean) as EventRow[];
    setEvents((prev) => (reset ? ordered : [...prev, ...ordered]));
    setEventsOffset(offset + PAGE_SIZE);
    setEventsHasMore(eventIds.length === PAGE_SIZE);
    setEventsLoading(false);
  }, [eventsOffset, profile?.id, user]);

  useEffect(() => {
    if (!profile?.id || isRestricted) return;
    if (activeTab === "groups") {
      setGroups([]);
      setGroupsOffset(0);
      fetchGroups(true);
    }
    if (activeTab === "events") {
      setEvents([]);
      setEventsOffset(0);
      fetchEvents(true);
    }
  }, [activeTab, fetchEvents, fetchGroups, isRestricted, profile?.id]);


  useEffect(() => {
    if (activeTab !== "followers" || !profile?.id || isRestricted) return;
    setFollowers([]);
    setFollowersOffset(0);
    fetchFollowers(true);
  }, [activeTab, fetchFollowers, followersSearch, isRestricted, profile?.id]);

  useEffect(() => {
    if (activeTab !== "following" || !profile?.id || isRestricted) return;
    setFollowing([]);
    setFollowingOffset(0);
    fetchFollowing(true);
  }, [activeTab, fetchFollowing, followingSearch, isRestricted, profile?.id]);

  const handleToggleFollow = async () => {
    if (!user || !profile || user.id === profile.id || !followColumns) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase.from("follows").delete().eq(followColumns.from, user.id).eq(followColumns.to, profile.id);
        if (!error) {
          setIsFollowing(false);
          setStats((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
        }
      } else {
        const { error } = await supabase.from("follows").insert({ [followColumns.from]: user.id, [followColumns.to]: profile.id });
        if (!error) {
          setIsFollowing(true);
          setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
        }
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const createConversationRecord = useCallback(async (targetUserId: string) => {
    const payloads = [{ is_group: false, created_by: user?.id }, { is_group: false }, {}];
    for (const payload of payloads) {
      const { data, error } = await supabase.from("conversations").insert(payload).select("id").single();
      if (!error && data?.id) return data.id as string;
    }
    const { data: rpcData, error: rpcError } = await supabase.rpc("create_direct_conversation", { target_user_id: targetUserId });
    if (!rpcError && rpcData) return rpcData as string;
    throw new Error("Mesaj odası oluşturulamadı.");
  }, [user?.id]);

  const findOrCreateConversationWith = useCallback(async (targetUserId: string) => {
    if (!user) throw new Error("Mesaj göndermek için giriş yapmalısınız.");

    const { data: myRows, error: myRowsError } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id);
    if (myRowsError) throw myRowsError;
    const myIds = ((myRows as Array<{ conversation_id: string }> | null) || []).map((row) => row.conversation_id);

    let conversationId = "";
    if (myIds.length > 0) {
      const { data: otherRows, error: otherRowsError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", targetUserId)
        .in("conversation_id", myIds);
      if (otherRowsError) throw otherRowsError;
      conversationId = (otherRows as Array<{ conversation_id: string }> | null)?.[0]?.conversation_id || "";
    }

    const isNewConversation = !conversationId;
    if (!conversationId) conversationId = await createConversationRecord(targetUserId);

    if (isNewConversation) {
      const { error: participantError } = await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: user.id },
        { conversation_id: conversationId, user_id: targetUserId },
      ]);
      if (participantError) throw participantError;
    }

    return conversationId;
  }, [createConversationRecord, user]);

  const handleSendMessage = async () => {
    if (!canInteract || !profile) return;
    setDmLoading(true);
    try {
      const conversationId = await findOrCreateConversationWith(profile.id);
      router.push(`/messages?conversation=${conversationId}`);
    } finally {
      setDmLoading(false);
    }
  };

  const handleReportProfile = async () => {
    if (!profile || !user || user.id === profile.id) return;
    const reason = reportReason.trim();
    const details = reportDetails.trim();
    if (!reason) {
      setReportFeedback("Lütfen rapor sebebini yazın.");
      return;
    }

    setReportLoading(true);
    setReportFeedback(null);
    try {
      const { data: adminRows, error: adminsError } = await supabase.from("profiles").select("id").eq("role", "admin").limit(20);
      if (adminsError) throw adminsError;
      const adminIds = ((adminRows as Array<{ id: string }> | null) || []).map((row) => row.id).filter((adminId) => adminId && adminId !== user.id);
      if (adminIds.length === 0) throw new Error("Aktif admin bulunamadı.");

      const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/profile/${profile.id}` : `/profile/${profile.id}`;
      const reportMessage = [
        "🚨 Profil raporu",
        `Raporlanan kullanıcı: ${getDisplayName(profile)} (@${profile.username || "kullanici"})`,
        `Profil ID: ${profile.id}`,
        `Profil linki: ${profileUrl}`,
        `Raporlayan kullanıcı: ${user.email || user.id}`,
        `Sebep: ${reason}`,
        details ? `Detay: ${details}` : null,
      ].filter(Boolean).join("\n");

      for (const adminId of adminIds) {
        const conversationId = await findOrCreateConversationWith(adminId);
        const { error: messageError } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, content: reportMessage });
        if (messageError) throw messageError;
      }

      setReportReason("");
      setReportDetails("");
      setReportFeedback("Rapor admin ekibine iletildi.");
    } catch (error) {
      console.error("Error reporting profile:", error);
      setReportFeedback("Rapor gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleCopyProfile = async () => {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const aboutVisible = useMemo(() => !!profile?.bio || mutuals.groups > 0 || mutuals.events > 0, [mutuals.events, mutuals.groups, profile?.bio]);

  if (loading) {
    return <div className="min-h-[calc(100vh-65px)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-3">
            <p className="font-semibold">Profil bulunamadı</p>
            <Link href="/people"><Button>Kişilere Dön</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isRestricted) {
    return (
      <div className="ak-page overflow-x-hidden py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-5">
          <Link href="/people" className="inline-flex"><Button variant="secondary" size="sm" className="gap-2"><ArrowLeft size={16} />Kişilere Geri Dön</Button></Link>
          <Card className="glass">
            <CardContent className="p-6 text-center space-y-3">
              <p className="font-semibold">Bu profil şu anda görüntülenemiyor.</p>
              <p className="text-sm text-neutral-500">Kullanıcı gizlilik/engelleme ayarları nedeniyle bu sayfa sınırlandırılmış olabilir.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="ak-page overflow-x-hidden py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <Link href="/people" className="inline-flex">
          <Button variant="secondary" size="sm" className="gap-2"><ArrowLeft size={16} />Kişilere Geri Dön</Button>
        </Link>

        <ProfileHeaderCard
          profile={profile}
          stats={stats}
          isFollowing={isFollowing}
          followLoading={followLoading}
          dmLoading={dmLoading}
          copied={copied}
          canInteract={canInteract}
          onStatClick={handleStatClick}
          onToggleFollow={handleToggleFollow}
          onSendMessage={handleSendMessage}
          onCopyProfile={handleCopyProfile}
          onQuickMessage={() => {
            if (!user) {
              router.push("/login");
              return;
            }
            router.push(`/messages?user=${profile.id}`);
          }}
        />

        {aboutVisible && (
          <Card className="glass">
            <CardHeader><CardTitle>Hakkında</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
              {profile.bio && <p className="leading-relaxed">{profile.bio}</p>}
              {(mutuals.groups > 0 || mutuals.events > 0) && (
                <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-3 bg-white/60 dark:bg-neutral-900/40 space-y-1">
                  {mutuals.groups > 0 && <p className="flex items-center gap-2"><Users size={14} /> Ortak Grup: {mutuals.groups}</p>}
                  {mutuals.events > 0 && <p className="flex items-center gap-2"><Heart size={14} /> Ortak Etkinlik: {mutuals.events}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card ref={tabsRef} className="glass">
          <CardHeader className="pb-3"><CardTitle>Bağlantılar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />

            {listError && <p className="text-sm text-red-600">{listError}</p>}

            {activeTab === "followers" && (
              <FollowersList
                items={followers}
                loading={followersLoading}
                hasMore={followersHasMore}
                search={followersSearch}
                onSearchChange={(value) => {
                  setFollowersSearch(value);
                }}
                onLoadMore={() => fetchFollowers()}
              />
            )}

            {activeTab === "following" && (
              <FollowingList
                items={following}
                loading={followingLoading}
                hasMore={followingHasMore}
                search={followingSearch}
                onSearchChange={(value) => {
                  setFollowingSearch(value);
                }}
                onLoadMore={() => fetchFollowing()}
              />
            )}

            {activeTab === "groups" && <GroupsList items={groups} loading={groupsLoading} hasMore={groupsHasMore} onLoadMore={() => fetchGroups()} />}
            {activeTab === "events" && <EventsList items={events} loading={eventsLoading} hasMore={eventsHasMore} onLoadMore={() => fetchEvents()} />}
          </CardContent>
        </Card>

        {user && user.id !== profile.id && (
          <Card className="glass border-red-200/80 dark:border-red-900/50">
            <CardHeader><CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2"><ShieldAlert size={16} />Admin&apos;e Profil Raporla</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <input
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                placeholder="Rapor sebebi (zorunlu)"
                className="w-full rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              />
              <textarea
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                placeholder="Detaylar (opsiyonel)"
                rows={3}
                className="w-full rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
              />
              {reportFeedback && <p className={`text-sm ${reportFeedback.includes("iletildi") ? "text-green-600" : "text-red-600"}`}>{reportFeedback}</p>}
              <Button variant="outline" className="gap-2" onClick={handleReportProfile} disabled={reportLoading}><Flag size={16} />{reportLoading ? "Gönderiliyor..." : "Profili Raporla"}</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
