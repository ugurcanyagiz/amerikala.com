"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { Avatar } from "@/app/components/ui/Avatar";
import { Modal } from "@/app/components/ui/Modal";
import { useAuth } from "@/app/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { MessageCircle, UserCheck, UserPlus, UserX, ExternalLink, Users } from "lucide-react";

export type UserProfileCardData = {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
};

type Props = {
  profile: UserProfileCardData | null;
  open: boolean;
  onClose: () => void;
};

export default function UserProfileCardModal({ profile, open, onClose }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [relationshipStatus, setRelationshipStatus] = useState<
    "guest" | "self" | "none" | "pending_sent" | "pending_received" | "following"
  >("guest");
  const [followLoading, setFollowLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);

  const getDisplayName = () => {
    if (!profile) return "Kullanıcı";
    return profile.full_name || profile.username || "Kullanıcı";
  };

  useEffect(() => {
    const checkRelationship = async () => {
      if (!open || !profile?.id) return;

      if (!user) {
        setRelationshipStatus("guest");
        return;
      }

      if (user.id === profile.id) {
        setRelationshipStatus("self");
        return;
      }

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
          .eq(pair.to, profile.id)
          .limit(1);

        if (!error) {
          if ((data?.length || 0) > 0) {
            setRelationshipStatus("following");
            return;
          }
          break;
        }
      }

      const { data: outgoing, error: outgoingError } = await supabase
        .from("friend_requests")
        .select("status")
        .eq("requester_id", user.id)
        .eq("receiver_id", profile.id)
        .limit(1)
        .maybeSingle();

      if (!outgoingError && outgoing?.status === "pending") {
        setRelationshipStatus("pending_sent");
        return;
      }

      const { data: incoming, error: incomingError } = await supabase
        .from("friend_requests")
        .select("status")
        .eq("requester_id", profile.id)
        .eq("receiver_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!incomingError && incoming?.status === "pending") {
        setRelationshipStatus("pending_received");
        return;
      }

      setRelationshipStatus("none");
    };

    checkRelationship();
  }, [open, profile?.id, user]);

  const followInsert = async (targetUserId: string) => {
    if (!user) return false;
    const pairs = [
      { from: "follower_id", to: "following_id" },
      { from: "user_id", to: "target_user_id" },
      { from: "user_id", to: "followed_user_id" },
    ];

    for (const pair of pairs) {
      const { error } = await supabase.from("follows").insert({ [pair.from]: user.id, [pair.to]: targetUserId });
      if (!error) return true;
    }
    return false;
  };

  const followDelete = async (targetUserId: string) => {
    if (!user) return false;
    const pairs = [
      { from: "follower_id", to: "following_id" },
      { from: "user_id", to: "target_user_id" },
      { from: "user_id", to: "followed_user_id" },
    ];

    for (const pair of pairs) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq(pair.from, user.id)
        .eq(pair.to, targetUserId);
      if (!error) return true;
    }
    return false;
  };

  const handleToggleFollow = async () => {
    if (!profile?.id) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.id === profile.id) return;

    setFollowLoading(true);
    try {
      if (relationshipStatus === "following") {
        const deleted = await followDelete(profile.id);
        if (deleted) setRelationshipStatus("none");
        return;
      }

      if (relationshipStatus === "pending_sent") {
        const { error } = await supabase
          .from("friend_requests")
          .delete()
          .eq("requester_id", user.id)
          .eq("receiver_id", profile.id)
          .eq("status", "pending");

        if (!error) setRelationshipStatus("none");
        return;
      }

      if (relationshipStatus === "pending_received") {
        const { error } = await supabase
          .from("friend_requests")
          .update({ status: "accepted", responded_at: new Date().toISOString() })
          .eq("requester_id", profile.id)
          .eq("receiver_id", user.id)
          .eq("status", "pending");

        if (!error) {
          await followInsert(profile.id);
          setRelationshipStatus("following");
        }
        return;
      }

      const { error: requestError } = await supabase
        .from("friend_requests")
        .upsert(
          { requester_id: user.id, receiver_id: profile.id, status: "pending" },
          { onConflict: "requester_id,receiver_id" }
        );

      if (!requestError) {
        setRelationshipStatus("pending_sent");
        return;
      }

      const followed = await followInsert(profile.id);
      if (followed) setRelationshipStatus("following");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!profile?.id) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.id === profile.id) return;

    setDmLoading(true);
    try {
      const { data: rpcConversationId } = await supabase
        .rpc("create_direct_conversation", { target_user_id: profile.id });

      if (rpcConversationId) {
        onClose();
        router.push(`/messages?conversation=${rpcConversationId}`);
        return;
      }

      const { data: myRows } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      const myConversationIds = ((myRows as Array<{ conversation_id: string }> | null) || [])
        .map((row) => row.conversation_id);

      if (myConversationIds.length > 0) {
        const { data: targetRows } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", profile.id)
          .in("conversation_id", myConversationIds);

        const existingConversationId =
          (targetRows as Array<{ conversation_id: string }> | null)?.[0]?.conversation_id;

        if (existingConversationId) {
          onClose();
          router.push(`/messages?conversation=${existingConversationId}`);
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
        onClose();
        router.push("/messages");
        return;
      }

      await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: user.id },
        { conversation_id: conversationId, user_id: profile.id },
      ]);

      onClose();
      router.push(`/messages?conversation=${conversationId}`);
    } finally {
      setDmLoading(false);
    }
  };

  const followLabel = relationshipStatus === "following"
    ? "Takiptesin"
    : relationshipStatus === "pending_sent"
      ? "İstek Gönderildi"
      : relationshipStatus === "pending_received"
        ? "İsteği Kabul Et"
        : "Arkadaşlık İsteği Gönder";

  const followIcon = relationshipStatus === "following"
    ? <UserCheck size={16} />
    : relationshipStatus === "pending_sent"
      ? <UserX size={16} />
      : <UserPlus size={16} />;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={getDisplayName()}
      description={profile?.username ? `@${profile.username}` : "Topluluk üyesi"}
    >
      {profile && (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar src={profile.avatar_url || undefined} fallback={getDisplayName()} size="xl" />
            <div>
              <p className="text-lg font-semibold">{getDisplayName()}</p>
              <p className="text-sm text-neutral-500">{profile.username ? `@${profile.username}` : "Topluluk üyesi"}</p>
              <p className="text-sm text-neutral-500">{[profile.city, profile.state].filter(Boolean).join(", ") || "Konum belirtilmemiş"}</p>
            </div>
          </div>

          {profile.bio && <p className="text-sm text-neutral-700 dark:text-neutral-300">{profile.bio}</p>}

          <div className="grid sm:grid-cols-2 gap-3">
            <Button
              variant={relationshipStatus === "following" ? "secondary" : "primary"}
              onClick={handleToggleFollow}
              disabled={followLoading || relationshipStatus === "self"}
              className="gap-2"
            >
              {followIcon}
              {followLabel}
            </Button>

            <Button
              variant="secondary"
              onClick={handleSendMessage}
              disabled={dmLoading || relationshipStatus === "self"}
              className="gap-2"
            >
              <MessageCircle size={16} />
              Özel Mesaj Gönder
            </Button>

            <Link href={`/profile/${profile.id}`} className="sm:col-span-2" onClick={onClose}>
              <Button variant="secondary" className="w-full gap-2">
                <ExternalLink size={16} />
                Profili Görüntüle
              </Button>
            </Link>

            <Button
              variant="secondary"
              className="w-full gap-2 sm:col-span-2"
              onClick={() => {
                onClose();
                router.push(user ? "/groups/create" : "/login");
              }}
            >
              <Users size={16} />
              Birlikte Grup Oluştur
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
