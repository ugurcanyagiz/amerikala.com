import { supabase } from "@/lib/supabase/client";

export interface MessagePreview {
  id: number;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

const MESSAGE_PREVIEWS: MessagePreview[] = [
  {
    id: 1,
    name: "Ayşe Karaca",
    avatar: "/avatars/ayse.jpg",
    isOnline: true,
    lastMessage: "Bu akşam meetup'a geliyor musun?",
    timestamp: "2 dk",
    unread: 2,
  },
  {
    id: 2,
    name: "Mehmet Şahin",
    avatar: "/avatars/mehmet.jpg",
    isOnline: false,
    lastMessage: "İlan detaylarını gönderdim, bakabilir misin?",
    timestamp: "18 dk",
    unread: 1,
  },
  {
    id: 3,
    name: "Elif Demir",
    avatar: "/avatars/elif.jpg",
    isOnline: true,
    lastMessage: "Yarın kahve için uygunsan haber ver 😊",
    timestamp: "1 sa",
    unread: 0,
  },
];

export function getMessagePreviews(): MessagePreview[] {
  return MESSAGE_PREVIEWS;
}

export interface ConversationProfile {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface RawConversationParticipant {
  conversation_id: string;
  user_id: string;
  profiles: ConversationProfile | ConversationProfile[] | null;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  profile: ConversationProfile | null;
}

const normalizeProfiles = (
  value: RawConversationParticipant["profiles"]
): ConversationProfile | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
};

const mapParticipants = (rows: RawConversationParticipant[]): ConversationParticipant[] => {
  return rows.map((row) => ({
    conversation_id: row.conversation_id,
    user_id: row.user_id,
    profile: normalizeProfiles(row.profiles),
  }));
};

export async function fetchConversationParticipants(conversationIds: string[]) {
  if (!conversationIds.length) return [];

  const { data, error } = await supabase
    .from("conversation_participants")
    .select(
      `
      conversation_id,
      user_id,
      profiles (
        id,
        username,
        first_name,
        last_name,
        avatar_url
      )
    `
    )
    .in("conversation_id", conversationIds);

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawConversationParticipant[];
  return mapParticipants(rows);
}
