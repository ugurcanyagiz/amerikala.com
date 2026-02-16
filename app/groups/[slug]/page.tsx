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
  Copy,
  Globe,
  Loader2,
  Lock,
  MapPin,
  Megaphone,
  MessageSquare,
  Send,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";

type Tab = "feed" | "events" | "members" | "about";

type GroupPost = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { id: string; username: string | null; full_name: string | null; avatar_url: string | null };
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
  const [activeTab, setActiveTab] = useState<Tab>("feed");

  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<"approved" | "pending" | "none">("none");
  const [memberRole, setMemberRole] = useState<string | null>(null);

  const [newPost, setNewPost] = useState("");
  const [publishingPost, setPublishingPost] = useState(false);

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

  const isApprovedMember = membershipStatus === "approved";
  const isModerator = memberRole === "admin" || memberRole === "moderator";

  const fetchGroup = useCallback(async () => {
    if (!slug) return;
    setLoading(true);

    try {
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select(`*, creator:created_by (id, username, full_name, avatar_url)`)
        .eq("slug", slug)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      const [{ data: memberRows }, { data: postRows }, { data: eventRows }] = await Promise.all([
        supabase
          .from("group_members")
          .select(`*, profile:user_id(id,username,full_name,avatar_url)`)
          .eq("group_id", groupData.id)
          .eq("status", "approved")
          .order("joined_at", { ascending: true }),
        supabase
          .from("posts")
          .select(`id, content, created_at, user_id, profiles (id, username, full_name, avatar_url)`)
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

      setMembers((memberRows || []) as GroupMember[]);
      setPosts((postRows || []) as GroupPost[]);
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
          setMemberRole(membership.role || "member");
        } else if (membership?.status === "pending") {
          setMembershipStatus("pending");
          setMemberRole(null);
        } else {
          setMembershipStatus("none");
          setMemberRole(null);
        }
      }
    } catch (e) {
      console.error(e);
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

      if (needsApproval && group.application_question) {
        const response = window.prompt(group.application_question, "");
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
    } catch (e) {
      console.error("join group error", e);
    } finally {
      setMembershipLoading(false);
    }
  };

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!group || !user || !newPost.trim()) return;
    setPublishingPost(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({ user_id: user.id, content: newPost.trim(), group_id: group.id })
        .select(`id, content, created_at, user_id, profiles(id,username,full_name,avatar_url)`)
        .single();

      if (error) throw error;
      setPosts((prev) => [data as GroupPost, ...prev]);
      setNewPost("");
    } catch (e) {
      console.error("create group post error", e);
    } finally {
      setPublishingPost(false);
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
    } catch (e) {
      console.error("create group event error", e);
    } finally {
      setCreatingEvent(false);
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
                <Avatar src={group.avatar_url} fallback={group.name} size="xl" />
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
          {(["feed", "events", "members", "about"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab ? "bg-blue-500 text-white" : "bg-white dark:bg-neutral-900"}`}
            >
              {tab === "feed" && "Mesaj Duvarı"}
              {tab === "events" && "Etkinlikler"}
              {tab === "members" && `Üyeler (${members.length})`}
              {tab === "about" && "Hakkında"}
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
                            <Avatar src={post.profiles?.avatar_url || null} fallback={post.profiles?.full_name || post.profiles?.username || "U"} size="sm" />
                            <div>
                              <p className="text-sm font-medium">{post.profiles?.full_name || post.profiles?.username || "Üye"}</p>
                              <p className="text-xs text-neutral-500">{new Date(post.created_at).toLocaleString("tr-TR")}</p>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
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
                      const profile = member.profile as { username?: string | null; full_name?: string | null; avatar_url?: string | null } | undefined;
                      return (
                        <div key={member.user_id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                          <Avatar src={profile?.avatar_url} fallback={profile?.full_name || profile?.username || "U"} size="md" />
                          <div className="min-w-0">
                            <p className="font-medium">{profile?.full_name || profile?.username || "Üye"}</p>
                            <p className="text-sm text-neutral-500">@{profile?.username} · {MEMBER_ROLE_LABELS[member.role]}</p>
                          </div>
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
                    {group.application_question && (
                      <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3 text-sm">
                        <p className="font-medium mb-1">Katılım Sorusu</p>
                        <p>{group.application_question}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="glass">
                <CardHeader><CardTitle className="text-base">Kurucu</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-3">
                  <Avatar src={creator?.avatar_url} fallback={creator?.full_name || creator?.username || "K"} size="lg" />
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
