"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, Loader2, MapPin, MessageCircle, Briefcase, Users, CalendarClock, Copy, Check, BadgeCheck } from "lucide-react";
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
  const [stats, setStats] = useState<ProfileStats>({ followers: 0, following: 0, groups: 0, events: 0 });
  const [mutuals, setMutuals] = useState({ groups: 0, events: 0 });

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, first_name, last_name, bio, avatar_url, city, state, profession, is_verified")
        .eq("id", id)
        .single();

      if (error) {
        setProfile(null);
      } else {
        setProfile(data as PublicProfile);
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

  const handleSendMessage = async () => {
    if (!user || !profile || user.id === profile.id) return;
    setDmLoading(true);

    try {
      const { data: myRows } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id);
      const myIds = ((myRows as Array<{ conversation_id: string }> | null) || []).map((row) => row.conversation_id);

      if (myIds.length > 0) {
        const { data: otherRows } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", profile.id)
          .in("conversation_id", myIds);

        const existingConversation = (otherRows as Array<{ conversation_id: string }> | null)?.[0]?.conversation_id;
        if (existingConversation) {
          router.push(`/messages?conversation=${existingConversation}`);
          return;
        }
      }

      let conversationId = "";
      for (const payload of [{ is_group: false, created_by: user.id }, { is_group: false }, {}]) {
        const { data, error } = await supabase.from("conversations").insert(payload).select("id").single();
        if (!error && data?.id) {
          conversationId = data.id as string;
          break;
        }
      }

      if (!conversationId) {
        router.push("/messages");
        return;
      }

      await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: user.id },
        { conversation_id: conversationId, user_id: profile.id },
      ]);

      router.push(`/messages?conversation=${conversationId}`);
    } finally {
      setDmLoading(false);
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
    <div className="ak-page overflow-x-hidden py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <Link href="/meetups" className="inline-flex">
          <Button variant="secondary" size="sm" className="gap-2">
            <ArrowLeft size={16} />
            Etkinliğe Geri Dön
          </Button>
        </Link>

        <Card className="glass">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <Avatar src={profile.avatar_url ?? undefined} fallback={getDisplayName(profile)} size="xl" />
              <div className="flex-1 min-w-0">
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
                  router.push("/meetups/create");
                }}
                className="gap-2"
              >
                <CalendarClock size={16} />
                Etkinliğe Davet Et
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Topluluk Bilgisi</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
            <p>Bu profil etkinlik katılımcı listelerinden veya topluluk sayfalarından görüntülenebilir.</p>
            <p>Mesajlaşma ve takip işlemleri gerçek kullanıcı verileri ile çalışır.</p>
            <div className="mt-4 rounded-xl border border-neutral-200/70 dark:border-neutral-800 p-3 bg-white/60 dark:bg-neutral-900/40 space-y-2">
              <p className="font-medium text-neutral-700 dark:text-neutral-200 flex items-center gap-2"><BadgeCheck size={16} className="text-blue-500" /> Profesyonel Bağlantı Özeti</p>
              <p className="flex items-center gap-2"><Users size={14} /> Ortak Grup: {mutuals.groups}</p>
              <p className="flex items-center gap-2"><CalendarClock size={14} /> Ortak Etkinlik: {mutuals.events}</p>
              <p className="text-xs text-neutral-500">Bu kart, topluluk içi güvenli iletişim ve networking aksiyonları için optimize edildi.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
