import { redirect } from "next/navigation";
import AppShell from "../components/AppShell";
import NotificationsCenter from "./NotificationsCenter";
import { createClient } from "@/lib/supabase/server";
import { mapEventTypeToCategory, type NotificationListResponse } from "@/lib/notifications";

interface NotificationRow {
  id: string;
  event_type: string;
  title: string;
  body: string;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
  seen_at: string | null;
  archived_at: string | null;
  actor_user_id: string | null;
}

interface ActorProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

function buildDisplayName(profile?: ActorProfileRow) {
  if (!profile) return "Kullanıcı";
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || profile.full_name || profile.username || "Kullanıcı";
}

async function getInitialNotifications(): Promise<NotificationListResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, count } = await supabase
    .from("notifications")
    .select("id, event_type, title, body, action_url, metadata, created_at, read_at, seen_at, archived_at, actor_user_id", { count: "exact" })
    .eq("recipient_user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .range(0, 19);

  const rows = (data ?? []) as NotificationRow[];
  const actorIds = Array.from(new Set(rows.map((row) => row.actor_user_id).filter((value): value is string => Boolean(value))));

  let profileById = new Map<string, ActorProfileRow>();
  if (actorIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, full_name, username, avatar_url")
      .in("id", actorIds);

    profileById = new Map(((profileRows ?? []) as ActorProfileRow[]).map((row) => [row.id, row]));
  }

  const items = rows.map((row) => {
    const profile = row.actor_user_id ? profileById.get(row.actor_user_id) : undefined;

    return {
      id: row.id,
      eventType: row.event_type,
      category: mapEventTypeToCategory(row.event_type),
      title: row.title,
      body: row.body,
      actionUrl: row.action_url,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
      readAt: row.read_at,
      seenAt: row.seen_at,
      archivedAt: row.archived_at,
      isRead: Boolean(row.read_at),
      isSeen: Boolean(row.seen_at),
      isArchived: Boolean(row.archived_at),
      actor: row.actor_user_id
        ? {
            id: row.actor_user_id,
            name: buildDisplayName(profile),
            avatarUrl: profile?.avatar_url ?? null,
          }
        : null,
    };
  });

  return {
    items,
    total: count ?? items.length,
    hasMore: items.length < (count ?? items.length),
    limit: 20,
    offset: 0,
  };
}

export default async function NotificationsPage() {
  const initialData = await getInitialNotifications();

  return (
    <AppShell mainClassName="app-page-container max-w-5xl">
      <NotificationsCenter initialData={initialData} />
    </AppShell>
  );
}
