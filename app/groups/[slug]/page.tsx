"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  Group,
  GroupMember,
  GROUP_CATEGORY_COLORS,
  GROUP_CATEGORY_ICONS,
  GROUP_CATEGORY_LABELS,
  MEMBER_ROLE_LABELS,
  US_STATES_MAP,
} from "@/lib/types";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Avatar } from "@/app/components/ui/Avatar";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Copy,
  Globe,
  Loader2,
  Lock,
  MapPin,
  Megaphone,
  MessageSquare,
  Save,
  Send,
  Settings,
  Shield,
  UserCog,
  UserPlus,
  UserX,
  Users,
  X,
} from "lucide-react";

type Tab = "feed" | "events" | "members" | "about" | "management";

type GroupProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type GroupPostRow = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: GroupProfile[] | GroupProfile | null;
  comments?: GroupPostCommentRow[] | null;
};

type GroupPostCommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: GroupProfile[] | GroupProfile | null;
};

type GroupPostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: GroupProfile | null;
};

type GroupPost = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: GroupProfile | null;
  comments: GroupPostComment[];
};

type GroupEvent = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  city: string;
  state: string;
  location_name: string;
  current_attendees: number;
};

type GroupMemberRow = Omit<GroupMember, "profile"> & {
  profile: GroupProfile[] | GroupProfile | null;
};

type JoinRequest = {
  id: string;
  user_id: string;
  group_id: string;
  answer: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  updated_at: string;
  user: GroupProfile | null;
};

type JoinRequestRow = Omit<JoinRequest, "user"> & {
  user: GroupProfile[] | GroupProfile | null;
};

const toSingleProfile = (profile: GroupProfile[] | GroupProfile | null): GroupProfile | null => {
  if (!profile) return null;
  return Array.isArray(profile) ? profile[0] ?? null : profile;
};

const normalizeGroupComment = (row: GroupPostCommentRow): GroupPostComment => ({
  id: row.id,
  post_id: row.post_id,
  user_id: row.user_id,
  content: row.content,
  created_at: row.created_at,
  profile: toSingleProfile(row.profile),
});

const normalizeGroupPost = (row: GroupPostRow): GroupPost => ({
  id: row.id,
  content: row.content,
  created_at: row.created_at,
  user_id: row.user_id,
  profile: toSingleProfile(row.profile),
  comments: (row.comments || []).map(normalizeGroupComment),
});

const normalizeGroupMember = (row: GroupMemberRow): GroupMember => ({
  ...row,
  profile: (toSingleProfile(row.profile) ?? undefined) as GroupMember["profile"],
});

const normalizeJoinRequest = (row: JoinRequestRow): JoinRequest => ({
  ...row,
  user: toSingleProfile(row.user),
});

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("feed");

  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<"approved" | "pending" | "none">("none");
  const [memberRole, setMemberRole] = useState<"admin" | "moderator" | "member" | null>(null);

  const [newPost, setNewPost] = useState("");
  const [publishingPost, setPublishingPost] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [savingGroup, setSavingGroup] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    location_name: "",
    city: "",
    state: "",
  });
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [applicationQuestionDraft, setApplicationQuestionDraft] = useState("");
  const [applicationQuestionPreview, setApplicationQuestionPreview] = useState("");

  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    city: "",
    state: "",
    is_private: false,
    requires_approval: false,
  });

  const isApprovedMember = membershipStatus === "approved";
  const isAdmin = memberRole === "admin";
  const isModerator = memberRole === "admin" || memberRole === "moderator";

  const fetchGroup = useCallback(async () => {
    if (!slug) return;
    setLoading(true);

    try {
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*, creator:created_by (id, username, full_name, avatar_url)")
        .eq("slug", slug)
        .single();

      if (groupError) throw groupError;
      const questionFromDb =
        "application_question" in groupData && typeof groupData.application_question === "string"
          ? groupData.application_question
          : "";

      setGroup(groupData);
      setGroupForm({
        name: groupData.name,
        description: groupData.description,
        city: groupData.city || "",
        state: groupData.state || "",
        is_private: groupData.is_private,
        requires_approval: groupData.requires_approval,
      });
      setApplicationQuestionDraft(questionFromDb);
      setApplicationQuestionPreview(questionFromDb);

      const [membersRes, postsRes, eventsRes] = await Promise.all([
        supabase
          .from("group_members")
          .select("*, profile:user_id(id,username,full_name,avatar_url)")
          .eq("group_id", groupData.id)
          .eq("status", "approved")
          .order("joined_at", { ascending: true }),
        supabase
          .from("posts")
          .select("id, content, created_at, user_id, profile:user_id (id, username, full_name, avatar_url), comments(id, post_id, user_id, content, created_at, profile:user_id(id, username, full_name, avatar_url))")
          .eq("group_id", groupData.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("events")
          .select("id, title, description, event_date, start_time, city, state, location_name, current_attendees")
          .eq("group_id", groupData.id)
          .order("event_date", { ascending: true })
          .limit(20),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (postsRes.error) throw postsRes.error;
      if (eventsRes.error) throw eventsRes.error;

      const memberRows = membersRes.data;
      const postRows = postsRes.data;
      const eventRows = eventsRes.data;

      const normalizedMembers = ((memberRows || []) as GroupMemberRow[]).map(normalizeGroupMember);
      setMembers(normalizedMembers);
      setPosts(((postRows || []) as GroupPostRow[]).map(normalizeGroupPost));
      setEvents((eventRows || []) as GroupEvent[]);

      if (user) {
        const { data: membership } = await supabase
          .from("group_members")
          .select("role, status")
          .eq("group_id", groupData.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (membership?.status === "approved") {
          setMembershipStatus("approved");
          const role = membership.role as "admin" | "moderator" | "member";
          setMemberRole(role || "member");

          if (role === "admin" || role === "moderator") {
            const { data: requestRows } = await supabase
              .from("group_join_requests")
              .select("id, user_id, group_id, answer, status, created_at, reviewed_by, reviewed_at, rejection_reason, updated_at, user:user_id(id,username,full_name,avatar_url)")
              .eq("group_id", groupData.id)
              .eq("status", "pending")
              .order("created_at", { ascending: true });

            setJoinRequests(((requestRows || []) as JoinRequestRow[]).map(normalizeJoinRequest));
          } else {
            setJoinRequests([]);
          }
        } else if (membership?.status === "pending") {
          setMembershipStatus("pending");
          setMemberRole(null);
          setJoinRequests([]);
        } else {
          setMembershipStatus("none");
          setMemberRole(null);
          setJoinRequests([]);
        }
      }
    } catch (error) {
      console.error("fetch group error", error);
      router.push("/groups");
    } finally {
      setLoading(false);
    }
  }, [router, slug, user]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const lockedByPrivacy = useMemo(() => {
    if (!group?.is_private) return false;
    return !isApprovedMember;
  }, [group?.is_private, isApprovedMember]);

  const handleJoinGroup = async () => {
    if (!group) return;
    if (!user) {
      router.push(`/login?redirect=/groups/${slug}`);
      return;
    }

    setMembershipLoading(true);
    try {
      const needsApproval = group.requires_approval || group.is_private;
      let answer: string | null = null;

      if (needsApproval && applicationQuestionPreview) {
        const response = window.prompt(applicationQuestionPreview, "");
        if (response === null) return;
        answer = response.trim();
      }

      const status = needsApproval ? "pending" : "approved";
      const { error } = await supabase.from("group_members").upsert(
        {
          group_id: group.id,
          user_id: user.id,
          role: "member",
          status,
        },
        { onConflict: "group_id,user_id" },
      );
      if (error) throw error;

      if (needsApproval) {
        await supabase.from("group_join_requests").upsert(
          {
            group_id: group.id,
            user_id: user.id,
            answer,
            status: "pending",
          },
          { onConflict: "group_id,user_id" },
        );
        setMembershipStatus("pending");
      } else {
        setMembershipStatus("approved");
      }

      await fetchGroup();
    } catch (error) {
      console.error("join group error", error);
    } finally {
      setMembershipLoading(false);
    }
  };

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!group || !user || !newPost.trim()) return;
    setPublishingPost(true);
    setFeedError(null);

    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({ user_id: user.id, content: newPost.trim(), group_id: group.id })
        .select("id, content, created_at, user_id, profile:user_id(id,username,full_name,avatar_url), comments(id, post_id, user_id, content, created_at, profile:user_id(id,username,full_name,avatar_url))")
        .single();

      if (error) throw error;
      setPosts((prev) => [normalizeGroupPost(data as GroupPostRow), ...prev]);
      setNewPost("");
    } catch (error) {
      console.error("create group post error", error);
      const message = error instanceof Error ? error.message : "Gönderi kaydedilemedi";
      setFeedError(`Gönderi kaydedilemedi. ${message}`);
    } finally {
      setPublishingPost(false);
    }
  };


  const handleAddComment = async (postId: string) => {
    if (!user) {
      router.push(`/login?redirect=/groups/${slug}`);
      return;
    }

    const draft = (commentDrafts[postId] || "").trim();
    if (!draft) return;

    setCommentingPostId(postId);
    setFeedError(null);

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: draft,
        })
        .select("id, post_id, user_id, content, created_at, profile:user_id(id, username, full_name, avatar_url)")
        .single();

      if (error) throw error;

      const normalizedComment = normalizeGroupComment(data as GroupPostCommentRow);
      setPosts((prev) => prev.map((post) => (
        post.id === postId
          ? { ...post, comments: [...post.comments, normalizedComment] }
          : post
      )));
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("add group comment error", error);
      const message = error instanceof Error ? error.message : "Yorum kaydedilemedi";
      setFeedError(`Yorum kaydedilemedi. ${message}`);
    } finally {
      setCommentingPostId(null);
    }
  };

  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!group || !user) return;

    setCreatingEvent(true);
    try {
      const { error } = await supabase.from("events").insert({
        ...eventForm,
        group_id: group.id,
        organizer_id: user.id,
        category: "social",
        status: "approved",
        is_online: false,
        is_free: true,
        description: eventForm.description || "Grup etkinliği",
        city: eventForm.city || group.city || "",
        state: eventForm.state || group.state || "",
        invite_all_group_members: true,
      });

      if (error) throw error;
      setEventForm({ title: "", description: "", event_date: "", start_time: "", location_name: "", city: "", state: "" });
      await fetchGroup();
    } catch (error) {
      console.error("create group event error", error);
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleSaveGroupSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!group || !isModerator) return;

    setSavingGroup(true);
    try {
      const { error } = await supabase
        .from("groups")
        .update({
          name: groupForm.name.trim(),
          description: groupForm.description.trim(),
          city: groupForm.city.trim() || null,
          state: groupForm.state.trim() || null,
          is_private: groupForm.is_private,
          requires_approval: groupForm.is_private ? true : groupForm.requires_approval,
        })
        .eq("id", group.id);

      if (error) throw error;
      setApplicationQuestionPreview(applicationQuestionDraft.trim());
      await fetchGroup();
    } catch (error) {
      console.error("save group settings error", error);
    } finally {
      setSavingGroup(false);
    }
  };

  const handleRequestDecision = async (request: JoinRequest, decision: "approved" | "rejected") => {
    if (!group || !user || !isModerator) return;

    setActionLoading(`request-${request.id}-${decision}`);
    try {
      const now = new Date().toISOString();

      const { error: updateRequestError } = await supabase
        .from("group_join_requests")
        .update({
          status: decision,
          reviewed_by: user.id,
          reviewed_at: now,
          rejection_reason: decision === "rejected" ? "Başvuru reddedildi" : null,
        })
        .eq("id", request.id)
        .eq("group_id", group.id);

      if (updateRequestError) throw updateRequestError;

      if (decision === "approved") {
        const { error: upsertMemberError } = await supabase.from("group_members").upsert(
          {
            group_id: group.id,
            user_id: request.user_id,
            role: "member",
            status: "approved",
          },
          { onConflict: "group_id,user_id" },
        );
        if (upsertMemberError) throw upsertMemberError;
      } else {
        await supabase
          .from("group_members")
          .delete()
          .eq("group_id", group.id)
          .eq("user_id", request.user_id)
          .eq("status", "pending");
      }

      await fetchGroup();
    } catch (error) {
      console.error("request decision error", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (targetUserId: string, role: "member" | "moderator") => {
    if (!group || !isAdmin) return;
    if (targetUserId === group.created_by) return;

    setActionLoading(`role-${targetUserId}`);
    try {
      const { error } = await supabase
        .from("group_members")
        .update({ role })
        .eq("group_id", group.id)
        .eq("user_id", targetUserId)
        .eq("status", "approved");

      if (error) throw error;
      await fetchGroup();
    } catch (error) {
      console.error("role change error", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!group || !isModerator) return;
    if (targetUserId === group.created_by) return;

    const confirmRemove = window.confirm("Bu üyeyi gruptan çıkarmak istediğinize emin misiniz?");
    if (!confirmRemove) return;

    setActionLoading(`remove-${targetUserId}`);
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", targetUserId);

      if (error) throw error;
      await fetchGroup();
    } catch (error) {
      console.error("remove member error", error);
    } finally {
      setActionLoading(null);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
  };

  if (loading || !group) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const creator = group.creator as { username?: string | null; full_name?: string | null; avatar_url?: string | null } | undefined;
  const tabs: Tab[] = isModerator ? ["feed", "events", "members", "about", "management"] : ["feed", "events", "members", "about"];

  return (
    <div className="ak-page">
      <div className="relative h-52 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600" />

      <div className="ak-shell -mt-24 pb-12 relative z-10">
        <Card className="glass mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-start justify-between">
              <div className="flex items-start gap-4">
                <Link href="/groups">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft size={18} />
                  </Button>
                </Link>
                <Avatar src={group.avatar_url ?? undefined} fallback={group.name} size="xl" />
                <div>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${GROUP_CATEGORY_COLORS[group.category]}`}>
                    {GROUP_CATEGORY_ICONS[group.category]} {GROUP_CATEGORY_LABELS[group.category]}
                  </div>
                  <h1 className="text-2xl font-bold mt-2">{group.name}</h1>
                  <div className="flex flex-wrap gap-3 text-sm text-neutral-500 mt-1">
                    <span className="inline-flex items-center gap-1"><Users size={15} /> {group.member_count} üye</span>
                    <span className="inline-flex items-center gap-1">
                      {group.is_nationwide ? <Globe size={15} /> : <MapPin size={15} />}
                      {group.is_nationwide ? "ABD Geneli" : `${group.city}, ${US_STATES_MAP[group.state || ""] || group.state}`}
                    </span>
                    {group.is_private && <Badge variant="default" size="sm" className="gap-1"><Lock size={12} /> Özel</Badge>}
                    {isModerator && <Badge variant="warning" size="sm" className="gap-1"><Shield size={12} /> Yönetim Yetkisi</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {membershipStatus === "pending" ? (
                  <Button variant="outline" disabled>Başvuru Beklemede</Button>
                ) : isApprovedMember ? (
                  <Button variant="outline" disabled>Üyesiniz</Button>
                ) : (
                  <Button onClick={handleJoinGroup} disabled={membershipLoading} className="gap-2">
                    {membershipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus size={16} />}
                    {group.requires_approval || group.is_private ? "Katılım Başvurusu" : "Katıl"}
                  </Button>
                )}
                <Button variant="outline" onClick={copyLink} className="gap-2"><Copy size={16} /> Paylaş</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab ? "bg-blue-500 text-white" : "bg-white dark:bg-neutral-900"}`}
            >
              {tab === "feed" && "Mesaj Duvarı"}
              {tab === "events" && "Etkinlikler"}
              {tab === "members" && `Üyeler (${members.length})`}
              {tab === "about" && "Hakkında"}
              {tab === "management" && "Yönetim"}
            </button>
          ))}
        </div>

        {lockedByPrivacy ? (
          <Card className="glass">
            <CardContent className="p-10 text-center">
              <Lock className="mx-auto mb-3 text-neutral-400" />
              <h3 className="font-semibold mb-1">Bu grup dışarıya kapalıdır</h3>
              <p className="text-sm text-neutral-500">İçerikleri görmek için üyelik başvurusu gönderin.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {activeTab === "feed" && (
                <>
                  {isApprovedMember && (
                    <Card className="glass">
                      <CardContent className="p-4">
                        <form onSubmit={handleCreatePost} className="space-y-3">
                          <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent p-3"
                            rows={3}
                            placeholder="Grup duvarında paylaşım yap..."
                          />
                          <Button type="submit" disabled={publishingPost || !newPost.trim()} className="gap-2">
                            {publishingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={15} />}
                            Paylaş
                          </Button>
                        </form>
                        {feedError && (
                          <p className="text-sm text-red-600 mt-3">{feedError}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {posts.length === 0 ? (
                    <Card className="glass"><CardContent className="p-8 text-center text-neutral-500">Henüz grup paylaşımı yok.</CardContent></Card>
                  ) : (
                    posts.map((post) => (
                      <Card className="glass" key={post.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar src={post.profile?.avatar_url ?? undefined} fallback={post.profile?.full_name || post.profile?.username || "U"} size="sm" />
                            <div>
                              <p className="text-sm font-medium">{post.profile?.full_name || post.profile?.username || "Üye"}</p>
                              <p className="text-xs text-neutral-500">{new Date(post.created_at).toLocaleString("tr-TR")}</p>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap mb-4">{post.content}</p>

                          <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                            <p className="text-xs text-neutral-500">Yorumlar ({post.comments.length})</p>
                            {post.comments.length === 0 ? (
                              <p className="text-sm text-neutral-500">Henüz yorum yok.</p>
                            ) : (
                              post.comments.map((comment) => (
                                <div key={comment.id} className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Avatar src={comment.profile?.avatar_url ?? undefined} fallback={comment.profile?.full_name || comment.profile?.username || "U"} size="xs" />
                                    <p className="text-xs font-medium">{comment.profile?.full_name || comment.profile?.username || "Üye"}</p>
                                    <p className="text-[11px] text-neutral-500">{new Date(comment.created_at).toLocaleString("tr-TR")}</p>
                                  </div>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
                              ))
                            )}

                            {isApprovedMember && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleAddComment(post.id);
                                }}
                                className="flex gap-2"
                              >
                                <input
                                  value={commentDrafts[post.id] || ""}
                                  onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                  className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm"
                                  placeholder="Yorum yaz..."
                                />
                                <Button type="submit" size="sm" disabled={commentingPostId === post.id || !(commentDrafts[post.id] || "").trim()}>
                                  {commentingPostId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yorum"}
                                </Button>
                              </form>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              )}

              {activeTab === "events" && (
                <>
                  {isModerator && (
                    <Card className="glass">
                      <CardHeader><CardTitle className="text-base">Hızlı Etkinlik Oluştur (Tüm Gruba Davet)</CardTitle></CardHeader>
                      <CardContent>
                        <form onSubmit={handleCreateEvent} className="grid sm:grid-cols-2 gap-3">
                          <input className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2" placeholder="Etkinlik başlığı" value={eventForm.title} onChange={(e)=>setEventForm((p)=>({...p,title:e.target.value}))} required />
                          <input className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2" placeholder="Mekan" value={eventForm.location_name} onChange={(e)=>setEventForm((p)=>({...p,location_name:e.target.value}))} required />
                          <input type="date" className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2" value={eventForm.event_date} onChange={(e)=>setEventForm((p)=>({...p,event_date:e.target.value}))} required />
                          <input type="time" className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2" value={eventForm.start_time} onChange={(e)=>setEventForm((p)=>({...p,start_time:e.target.value}))} required />
                          <textarea className="sm:col-span-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2" placeholder="Açıklama" rows={3} value={eventForm.description} onChange={(e)=>setEventForm((p)=>({...p,description:e.target.value}))} />
                          <Button type="submit" disabled={creatingEvent || !eventForm.title || !eventForm.location_name || !eventForm.event_date || !eventForm.start_time} className="sm:col-span-2 gap-2">
                            {creatingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone size={15} />} Etkinlik Yayınla
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {events.length === 0 ? (
                    <Card className="glass"><CardContent className="p-8 text-center text-neutral-500">Yaklaşan grup etkinliği yok.</CardContent></Card>
                  ) : (
                    events.map((event) => (
                      <Card className="glass" key={event.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-semibold">{event.title}</h4>
                              <p className="text-sm text-neutral-500 mt-1">{event.description}</p>
                              <p className="text-sm mt-2 inline-flex items-center gap-1"><CalendarDays size={14} /> {new Date(event.event_date).toLocaleDateString("tr-TR")} {event.start_time}</p>
                              <p className="text-sm inline-flex items-center gap-1 ml-3"><MapPin size={14} /> {event.location_name}</p>
                            </div>
                            <Badge variant="info" size="sm">{event.current_attendees} katılımcı</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              )}

              {activeTab === "members" && (
                <Card className="glass">
                  <CardContent className="p-4 space-y-3">
                    {members.map((member) => {
                      const profile = member.profile as GroupProfile | undefined;
                      const isOwner = member.user_id === group.created_by;
                      const roleLoading = actionLoading === `role-${member.user_id}`;
                      const removeLoading = actionLoading === `remove-${member.user_id}`;

                      return (
                        <div key={member.user_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                          <div className="flex items-center gap-3">
                            <Avatar src={profile?.avatar_url ?? undefined} fallback={profile?.full_name || profile?.username || "U"} size="md" />
                            <div className="min-w-0">
                              <p className="font-medium">{profile?.full_name || profile?.username || "Üye"}</p>
                              <p className="text-sm text-neutral-500">@{profile?.username} · {MEMBER_ROLE_LABELS[member.role]}</p>
                            </div>
                          </div>

                          {isModerator && !isOwner && (
                            <div className="flex items-center gap-2">
                              {isAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={roleLoading}
                                  onClick={() => handleRoleChange(member.user_id, member.role === "moderator" ? "member" : "moderator")}
                                  className="gap-1"
                                >
                                  {roleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCog size={14} />}
                                  {member.role === "moderator" ? "Moderatörü Al" : "Moderatör Yap"}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={removeLoading}
                                onClick={() => handleRemoveMember(member.user_id)}
                                className="gap-1 text-red-600"
                              >
                                {removeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX size={14} />}
                                Gruptan Çıkar
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {activeTab === "about" && (
                <Card className="glass">
                  <CardHeader><CardTitle>Grup Hakkında</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <p className="whitespace-pre-wrap text-sm">{group.description}</p>
                    {applicationQuestionPreview && (
                      <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3 text-sm">
                        <p className="font-medium mb-1">Katılım Sorusu</p>
                        <p>{applicationQuestionPreview}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "management" && isModerator && (
                <div className="space-y-6">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2"><Settings size={16} /> Grup Ayarları</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSaveGroupSettings} className="space-y-3">
                        <input
                          value={groupForm.name}
                          onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2"
                          placeholder="Grup adı"
                          required
                        />
                        <textarea
                          value={groupForm.description}
                          onChange={(e) => setGroupForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2"
                          rows={4}
                          placeholder="Grup açıklaması"
                          required
                        />
                        <div className="grid sm:grid-cols-2 gap-3">
                          <input
                            value={groupForm.city}
                            onChange={(e) => setGroupForm((prev) => ({ ...prev, city: e.target.value }))}
                            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2"
                            placeholder="Şehir"
                          />
                          <input
                            value={groupForm.state}
                            onChange={(e) => setGroupForm((prev) => ({ ...prev, state: e.target.value }))}
                            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2"
                            placeholder="Eyalet"
                          />
                        </div>

                        <div className="space-y-2 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={groupForm.is_private}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setGroupForm((prev) => ({
                                  ...prev,
                                  is_private: checked,
                                  requires_approval: checked ? true : prev.requires_approval,
                                }));
                              }}
                            />
                            Özel grup
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={groupForm.requires_approval}
                              disabled={groupForm.is_private}
                              onChange={(e) => setGroupForm((prev) => ({ ...prev, requires_approval: e.target.checked }))}
                            />
                            Üyelik onayı gerekli
                          </label>
                        </div>

                        <textarea
                          value={applicationQuestionDraft}
                          onChange={(e) => setApplicationQuestionDraft(e.target.value)}
                          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2"
                          rows={2}
                          placeholder="Opsiyonel başvuru sorusu"
                        />
                        <p className="text-xs text-neutral-500">
                          Bu alan şu an sadece yerel olarak saklanır; mevcut veritabanı şemasına yazılmaz.
                        </p>

                        <Button type="submit" disabled={savingGroup} className="gap-2">
                          {savingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />} Değişiklikleri Kaydet
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="text-base">Üyelik Başvuruları ({joinRequests.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {joinRequests.length === 0 ? (
                        <p className="text-sm text-neutral-500">Bekleyen başvuru yok.</p>
                      ) : (
                        joinRequests.map((request) => {
                          const approveLoading = actionLoading === `request-${request.id}-approved`;
                          const rejectLoading = actionLoading === `request-${request.id}-rejected`;
                          return (
                            <div key={request.id} className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Avatar src={request.user?.avatar_url ?? undefined} fallback={request.user?.full_name || request.user?.username || "U"} size="sm" />
                                  <div>
                                    <p className="text-sm font-medium">{request.user?.full_name || request.user?.username || "Kullanıcı"}</p>
                                    <p className="text-xs text-neutral-500">@{request.user?.username}</p>
                                  </div>
                                </div>
                                <p className="text-xs text-neutral-500">{new Date(request.created_at).toLocaleString("tr-TR")}</p>
                              </div>
                              {request.answer && (
                                <p className="text-sm mt-2 rounded bg-neutral-100 dark:bg-neutral-800 p-2">“{request.answer}”</p>
                              )}
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  className="gap-1"
                                  disabled={approveLoading || rejectLoading}
                                  onClick={() => handleRequestDecision(request, "approved")}
                                >
                                  {approveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={14} />} Onayla
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-red-600"
                                  disabled={approveLoading || rejectLoading}
                                  onClick={() => handleRequestDecision(request, "rejected")}
                                >
                                  {rejectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X size={14} />} Reddet
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <Card className="glass">
                <CardHeader><CardTitle className="text-base">Kurucu</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Avatar src={creator?.avatar_url ?? undefined} fallback={creator?.full_name || creator?.username || "K"} size="lg" />
                  <div>
                    <p className="font-semibold">{creator?.full_name || creator?.username}</p>
                    <p className="text-sm text-neutral-500">@{creator?.username}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader><CardTitle className="text-base">Community Özeti</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center justify-between"><span className="text-neutral-500">Mesaj</span><span>{posts.length}</span></p>
                  <p className="flex items-center justify-between"><span className="text-neutral-500">Etkinlik</span><span>{events.length}</span></p>
                  <p className="flex items-center justify-between"><span className="text-neutral-500">Üyeler</span><span>{members.length}</span></p>
                  <p className="flex items-center justify-between"><span className="text-neutral-500">Bekleyen Başvuru</span><span>{joinRequests.length}</span></p>
                  <p className="flex items-center justify-between"><span className="text-neutral-500">Gizlilik</span><span>{group.is_private ? "Private" : "Public"}</span></p>
                  <p className="flex items-center justify-between"><span className="text-neutral-500">Moderasyon</span><span className="inline-flex items-center gap-1"><Shield size={14} /> {group.requires_approval ? "Onaylı" : "Açık"}</span></p>
                </CardContent>
              </Card>

              <Link href="/groups">
                <Button variant="outline" className="w-full"><MessageSquare size={16} className="mr-2" />Tüm Gruplara Dön</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
