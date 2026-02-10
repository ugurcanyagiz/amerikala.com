import { supabase } from "@/lib/supabase/client";

export type MessagePreview = {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessageId: string;
  lastMessageText: string;
  lastMessageCreatedAt: string;
  unreadCount: number;
};

type RawMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type RawProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type RawConversationParticipant = {
  conversation_id: string;
  user_id: string;
  profiles: RawProfile[] | RawProfile | null;
};

function getParticipantProfile(profile: RawConversationParticipant["profiles"]): RawProfile | null {
  if (!profile) return null;
  return Array.isArray(profile) ? profile[0] || null : profile;
}

function buildDisplayName(profile: RawConversationParticipant["profiles"]) {
  const resolvedProfile = getParticipantProfile(profile);
  if (!resolvedProfile) return "Kullanıcı";
  const fullName = [resolvedProfile.first_name, resolvedProfile.last_name].filter(Boolean).join(" ").trim();
  return fullName || resolvedProfile.username || "Kullanıcı";
}

export async function getMessagePreviews(userId: string): Promise<MessagePreview[]> {
  const { data: participantRows, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .eq("user_id", userId);

  if (participantError) {
    throw participantError;
  }

  const conversationIds = (participantRows || []).map((row) => row.conversation_id);

  if (conversationIds.length === 0) {
    return [];
  }

  const { data: latestMessages, error: latestError } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at, read_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (latestError) {
    throw latestError;
  }

  const lastMessageByConversation = new Map<string, RawMessageRow>();
  const unreadCountByConversation = new Map<string, number>();

  (latestMessages as RawMessageRow[] | null)?.forEach((msg) => {
    if (!lastMessageByConversation.has(msg.conversation_id)) {
      lastMessageByConversation.set(msg.conversation_id, msg);
    }

    if (msg.sender_id !== userId && msg.read_at === null) {
      unreadCountByConversation.set(msg.conversation_id, (unreadCountByConversation.get(msg.conversation_id) || 0) + 1);
    }
  });

  const { data: participants, error: profilesError } = await supabase
    .from("conversation_participants")
    .select(
      "conversation_id, user_id, profiles!conversation_participants_user_id_fkey(id, username, first_name, last_name, avatar_url)"
    )
    .in("conversation_id", conversationIds)
    .neq("user_id", userId);

  if (profilesError) {
    throw profilesError;
  }

  const otherParticipantByConversation = new Map<string, RawConversationParticipant>();

  (participants as RawConversationParticipant[] | null)?.forEach((participant) => {
    if (!otherParticipantByConversation.has(participant.conversation_id)) {
      otherParticipantByConversation.set(participant.conversation_id, participant);
    }
  });

  const previews: MessagePreview[] = conversationIds
    .map((conversationId) => {
      const lastMessage = lastMessageByConversation.get(conversationId);
      const participant = otherParticipantByConversation.get(conversationId);

      if (!lastMessage || !participant) {
        return null;
      }

      const profile = getParticipantProfile(participant.profiles);

      return {
        conversationId,
        otherUserId: participant.user_id,
        otherUserName: buildDisplayName(participant.profiles),
        otherUserAvatar: profile?.avatar_url || null,
        lastMessageId: lastMessage.id,
        lastMessageText: lastMessage.content,
        lastMessageCreatedAt: lastMessage.created_at,
        unreadCount: unreadCountByConversation.get(conversationId) || 0,
      };
    })
    .filter((item): item is MessagePreview => item !== null)
    .sort((a, b) => new Date(b.lastMessageCreatedAt).getTime() - new Date(a.lastMessageCreatedAt).getTime());

  return previews;
}
