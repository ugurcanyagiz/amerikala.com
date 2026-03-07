import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapEventTypeToCategory, type NotificationCategory, type NotificationItem } from "@/lib/notifications";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

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

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = (searchParams.get("tab") ?? "all") as NotificationCategory;
  const query = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);
  const includeArchived = searchParams.get("includeArchived") === "true";

  let dbQuery = supabase
    .from("notifications")
    .select("id, event_type, title, body, action_url, metadata, created_at, read_at, seen_at, archived_at, actor_user_id", { count: "exact" })
    .eq("recipient_user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!includeArchived) {
    dbQuery = dbQuery.is("archived_at", null);
  }

  if (tab !== "all") {
    if (tab === "mentions") {
      dbQuery = dbQuery.ilike("event_type", "%mention%");
    } else if (tab === "comments") {
      dbQuery = dbQuery.or("event_type.ilike.%comment%,event_type.ilike.%reply%");
    } else if (tab === "follows") {
      dbQuery = dbQuery.or("event_type.ilike.%follow%,event_type.ilike.%friend%");
    } else if (tab === "system") {
      dbQuery = dbQuery
        .not("event_type", "ilike", "%mention%")
        .not("event_type", "ilike", "%comment%")
        .not("event_type", "ilike", "%reply%")
        .not("event_type", "ilike", "%follow%")
        .not("event_type", "ilike", "%friend%");
    }
  }

  if (query.length >= 2) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,body.ilike.%${query}%`);
  }

  const { data, error, count } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as NotificationRow[];
  const actorIds = Array.from(new Set(rows.map((row) => row.actor_user_id).filter((value): value is string => Boolean(value))));

  let profileById = new Map<string, ActorProfileRow>();
  if (actorIds.length > 0) {
    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, full_name, username, avatar_url")
      .in("id", actorIds);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    profileById = new Map((profileRows as ActorProfileRow[]).map((row) => [row.id, row]));
  }

  const items: NotificationItem[] = rows.map((row) => {
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

  return NextResponse.json({
    items,
    total: count ?? items.length,
    hasMore: offset + items.length < (count ?? items.length),
    limit,
    offset,
  });
}
