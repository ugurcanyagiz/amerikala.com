"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Briefcase,
  Users,
  Copy,
  Check,
  BadgeCheck,
  Flag,
  ShieldAlert,
  Send,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { Avatar } from "@/app/components/ui/Avatar";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";

type PublicProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  profession: string | null;
  is_verified?: boolean | null;
};

type ProfileStats = {
  followers: number;
  following: number;
  groups: number;
  events: number;
};

const getDisplayName = (profile: PublicProfile | null) => {
  if (!profile) return "Kullanıcı";
  return profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username || "Kullanıcı";
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ followers: 0, following: 0, groups: 0, events: 0 });
  const [mutuals, setMutuals] = useState({ groups: 0, events: 0 });

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      setLoading(true);

      const { data: byIdData, error: byIdError } = await supabase
        .from("profiles")
        .select("id, username, full_name, first_name, last_name, bio, avatar_url, city, state, profession, is_verified")
        .eq("id", id)
        .single();

      if (!byIdError && byIdData) {
        setProfile(byIdData as PublicProfile);
        setLoading(false);
        return;
      }

      const { data: byUsernameData, error: byUsernameError } = await supabase
        .from("profiles")
        .select("id, username, full_name, first_name, last_name, bio, avatar_url, city, state, profession, is_verified")
        .eq("username", id)
        .single();

      if (!byUsernameError && byUsernameData) {
        setProfile(byUsernameData as PublicProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    loadProfile();
  }, [id]);

  useEffect(() => {
    const loadStats = async () => {
      if (!id) return;

      let followers = 0;
      let following = 0;
      const followPairs = [
        { from: "follower_id", to: "following_id" },
        { from: "user_id", to: "target_user_id" },
        { from: "user_id", to: "followed_user_id" },
      ] as const;

      for (const pair of followPairs) {
        const [followerRes, followingRes] = await Promise.all([
          supabase.from("follows").select("*", { count: "exact", head: true }).eq(pair.to, id),
          supabase.from("follows").select("*", { count: "exact", head: true }).eq(pair.from, id),
        ]);

        if (!followerRes.error && !followingRes.error) {
          followers = followerRes.count || 0;
          following = followingRes.count || 0;
          break;
        }
      }

      const [groupRes, eventRes] = await Promise.all([
        supabase.from("group_members").select("*", { count: "exact", head: true }).eq("user_id", id).eq("status", "approved"),
        supabase.from("event_attendees").select("*", { count: "exact", head: true }).eq("user_id", id),
      ]);

      setStats({
        followers,
        following,
        groups: groupRes.count || 0,
        events: eventRes.count || 0,
      });
    };

    loadStats();
  }, [id]);

  useEffect(() => {
    const loadMutuals = async () => {
      if (!user || !id || user.id === id) return;

      const [myGroupsRes, targetGroupsRes, myEventsRes, targetEventsRes] = await Promise.all([
        supabase.from("group_members").select("group_id").eq("user_id", user.id).eq("status", "approved"),
        supabase.from("group_members").select("group_id").eq("user_id", id).eq("status", "approved"),
        supabase.from("event_attendees").select("event_id").eq("user_id", user.id),
        supabase.from("event_attendees").select("event_id").eq("user_id", id),
      ]);

      const myGroups = new Set((myGroupsRes.data || []).map((item) => item.group_id));
      const targetGroups = (targetGroupsRes.data || []).map((item) => item.group_id).filter((groupId) => myGroups.has(groupId));
      const myEvents = new Set((myEventsRes.data || []).map((item) => item.event_id));
      const targetEvents = (targetEventsRes.data || []).map((item) => item.event_id).filter((eventId) => myEvents.has(eventId));

      setMutuals({ groups: targetGroups.length, events: targetEvents.length });
    };

    loadMutuals();
  }, [id, user]);

  useEffect(() => {
    const checkFollowing = async () => {
      if (!user || !id || user.id === id) return;
      const pairs = [
        { from: "follower_id", to: "following_id" },
        { from: "user_id", to: "target_user_id" },
        { from: "user_id", to: "followed_user_id" },
      ];

      for (const pair of pairs) {
        const { data, error } = await supabase
          .from("follows")
          .select("*")
          .eq(pair.from, user.id)
          .eq(pair.to, id)
          .limit(1);

        if (!error) {
          setIsFollowing((data?.length || 0) > 0);
          return;
        }
      }
    };

    checkFollowing();
  }, [id, user]);

  const handleToggleFollow = async () => {
    if (!user || !profile || user.id === profile.id) return;
    setFollowLoading(true);

    try {
      const pairs = [
        { from: "follower_id", to: "following_id" },
        { from: "user_id", to: "target_user_id" },
        { from: "user_id", to: "followed_user_id" },
      ];

      if (isFollowing) {
        for (const pair of pairs) {
          const { error } = await supabase
            .from("follows")
            .delete()
            .eq(pair.from, user.id)
            .eq(pair.to, profile.id);
          if (!error) {
            setIsFollowing(false);
            return;
          }
        }
      } else {
        for (const pair of pairs) {
          const { error } = await supabase.from("follows").insert({ [pair.from]: user.id, [pair.to]: profile.id });
          if (!error) {
            setIsFollowing(true);
            return;
          }
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
      if (!error && data?.id) {
        return data.id as string;
      }
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc("create_direct_conversation", {
      target_user_id: targetUserId,
    });

    if (!rpcError && rpcData) {
      return rpcData as string;
    }

    throw new Error("Mesaj odası oluşturulamadı.");
  }, [user?.id]);

  const findOrCreateConversationWith = useCallback(async (targetUserId: string) => {
    if (!user) throw new Error("Mesaj göndermek için giriş yapmalısınız.");

    const { data: myRows, error: myRowsError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

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
    if (!conversationId) {
      conversationId = await createConversationRecord(targetUserId);
    }

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
    if (!user || !profile || user.id === profile.id) return;
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
      const { data: adminRows, error: adminsError } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(20);

      if (adminsError) throw adminsError;

      const adminIds = ((adminRows as Array<{ id: string }> | null) || [])
        .map((row) => row.id)
        .filter((adminId) => adminId && adminId !== user.id);

      if (adminIds.length === 0) {
        throw new Error("Aktif admin bulunamadı.");
      }

      const profileUrl = typeof window !== "undefined"
        ? `${window.location.origin}/profile/${profile.id}`
        : `/profile/${profile.id}`;

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
        const { error: messageError } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: reportMessage,
        });

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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-3">
            <p className="font-semibold">Profil bulunamadı</p>
            <Link href="/meetups">
              <Button>Etkinliklere Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="ak-page py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <Link href="/people" className="inline-flex">
          <Button variant="secondary" size="sm" className="gap-2">
            <ArrowLeft size={16} />
            Kişilere Geri Dön
          </Button>
        </Link>

        <Card className="glass">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <Avatar src={profile.avatar_url ?? undefined} fallback={getDisplayName(profile)} size="xl" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{getDisplayName(profile)}</h1>
                  {profile.is_verified && <Badge variant="primary" size="sm">Doğrulanmış</Badge>}
                </div>
                <p className="text-neutral-500">@{profile.username || "kullanici"}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1"><MapPin size={14} />{[profile.city, profile.state].filter(Boolean).join(", ") || "Konum yok"}</span>
                  <span className="flex items-center gap-1"><Briefcase size={14} />{profile.profession || "Meslek belirtilmedi"}</span>
                </div>
              </div>
            </div>

            {profile.bio && (
              <p className="mt-5 text-neutral-700 dark:text-neutral-300 leading-relaxed">{profile.bio}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-3 text-center">
                <p className="text-lg font-semibold">{stats.followers}</p>
                <p className="text-xs text-neutral-500">Takipçi</p>
              </div>
              <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-3 text-center">
                <p className="text-lg font-semibold">{stats.following}</p>
                <p className="text-xs text-neutral-500">Takip</p>
              </div>
              <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-3 text-center">
                <p className="text-lg font-semibold">{stats.groups}</p>
                <p className="text-xs text-neutral-500">Gruplar</p>
              </div>
              <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-3 text-center">
                <p className="text-lg font-semibold">{stats.events}</p>
                <p className="text-xs text-neutral-500">Etkinlik</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              <Button
                variant={isFollowing ? "outline" : "primary"}
                onClick={handleToggleFollow}
                disabled={!user || user.id === profile.id || followLoading}
                className="gap-2"
              >
                <Heart size={16} />
                {isFollowing ? "Takipten Çıkar" : "Arkadaş Ekle / Takip Et"}
              </Button>
              <Button
                variant="outline"
                onClick={handleSendMessage}
                disabled={!user || user.id === profile.id || dmLoading}
                className="gap-2"
              >
                <MessageCircle size={16} />
                Özel Mesaj Gönder
              </Button>
              <Button variant="outline" onClick={handleCopyProfile} className="gap-2">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Kopyalandı" : "Profil Linkini Kopyala"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (!user) {
                    router.push("/login");
                    return;
                  }
                  router.push(`/messages?user=${profile.id}`);
                }}
                className="gap-2"
              >
                <Send size={16} />
                Hızlı Mesaj
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Topluluk Bilgisi</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
            <p>Bu ekran, /profile kartındaki bilgileri karşı kullanıcıya Instagram benzeri bir yerleşimle sunar.</p>
            <p>Takip/arkadaşlık, DM ve raporlama aksiyonları doğrudan gerçek veritabanı kayıtlarıyla çalışır.</p>
            <div className="mt-4 rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-3 bg-white/60 dark:bg-neutral-900/40 space-y-2">
              <p className="font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-2"><BadgeCheck size={16} className="text-blue-500" /> Profesyonel Bağlantı Özeti</p>
              <p className="flex items-center gap-2"><Users size={14} /> Ortak Grup: {mutuals.groups}</p>
              <p className="flex items-center gap-2"><Heart size={14} /> Ortak Etkinlik: {mutuals.events}</p>
              <p className="text-xs text-neutral-500">Bu kart, topluluk içi güvenli iletişim ve networking aksiyonları için optimize edildi.</p>
            </div>

            {user && user.id !== profile.id && (
              <div className="mt-4 rounded-xl border border-red-200/80 dark:border-red-900/50 p-4 bg-red-50/70 dark:bg-red-950/20 space-y-3">
                <p className="font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                  <ShieldAlert size={16} /> Admin&apos;e Profil Raporla
                </p>
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
                {reportFeedback && (
                  <p className={`text-sm ${reportFeedback.includes("iletildi") ? "text-green-600" : "text-red-600"}`}>{reportFeedback}</p>
                )}
                <Button variant="outline" className="gap-2" onClick={handleReportProfile} disabled={reportLoading}>
                  <Flag size={16} />
                  {reportLoading ? "Gönderiliyor..." : "Profili Raporla"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
