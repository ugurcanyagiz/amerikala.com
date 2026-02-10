import { supabase } from "@/lib/supabase/client";

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
