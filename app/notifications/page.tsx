import { redirect } from "next/navigation";
import Sidebar from "../components/Sidebar";
import NotificationsCenter from "./NotificationsCenter";
import { createClient } from "@/lib/supabase/server";
import { mapEventTypeToCategory, type NotificationListResponse } from "@/lib/notifications";

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
    .select(
      "id, event_type, title, body, action_url, metadata, created_at, read_at, seen_at, archived_at, actor_user_id, profiles:actor_user_id(id, first_name, last_name, full_name, username, avatar_url)",
      { count: "exact" }
    )
    .eq("recipient_user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .range(0, 19);

  const items = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const actorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || profile?.full_name || profile?.username || "Kullanıcı";

    return {
      id: row.id,
      eventType: row.event_type,
      category: mapEventTypeToCategory(row.event_type),
      title: row.title,
      body: row.body,
      actionUrl: row.action_url,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
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
            name: actorName,
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
    <div className="ak-page">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NotificationsCenter initialData={initialData} />
        </main>
      </div>
    </div>
  );
}
