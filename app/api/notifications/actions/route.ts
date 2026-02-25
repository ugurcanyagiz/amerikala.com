import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type NotificationAction = "mark_read" | "mark_all_read" | "archive_selected" | "respond_friend_request";
type FriendDecision = "accept" | "reject";

interface ActionBody {
  action?: NotificationAction;
  ids?: string[];
  notificationId?: string;
  decision?: FriendDecision;
}

interface NotificationLookupRow {
  id: string;
  event_type: string;
  actor_user_id: string | null;
  metadata: Record<string, unknown> | null;
}

const isValidUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ActionBody;
  const action = body.action;
  const ids = Array.isArray(body.ids) ? body.ids : [];
  const now = new Date().toISOString();

  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  if (action === "mark_all_read") {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now, seen_at: now })
      .eq("recipient_user_id", user.id)
      .is("archived_at", null)
      .is("read_at", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "respond_friend_request") {
    if (!body.notificationId || (body.decision !== "accept" && body.decision !== "reject")) {
      return NextResponse.json({ error: "Invalid friend request payload" }, { status: 400 });
    }

    const { data: notificationRow, error: notificationError } = await supabase
      .from("notifications")
      .select("id, event_type, actor_user_id, metadata")
      .eq("id", body.notificationId)
      .eq("recipient_user_id", user.id)
      .maybeSingle<NotificationLookupRow>();

    if (notificationError) {
      return NextResponse.json({ error: notificationError.message }, { status: 500 });
    }

    if (!notificationRow || notificationRow.event_type !== "social.friend_request") {
      return NextResponse.json({ error: "Friend request notification not found" }, { status: 404 });
    }

    const metadata = notificationRow.metadata ?? {};
    const rawFriendRequestId = metadata.friend_request_id;
    const friendRequestId = typeof rawFriendRequestId === "string" ? rawFriendRequestId : "";

    if (!isValidUuid(friendRequestId)) {
      return NextResponse.json({ error: "Friend request id is missing" }, { status: 400 });
    }

    const targetStatus = body.decision === "accept" ? "accepted" : "rejected";

    const { data: updatedRequest, error: updateRequestError } = await supabase
      .from("friend_requests")
      .update({ status: targetStatus, responded_at: now })
      .eq("id", friendRequestId)
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .select("id, requester_id, receiver_id")
      .maybeSingle<{ id: string; requester_id: string; receiver_id: string }>();

    if (updateRequestError) {
      return NextResponse.json({ error: updateRequestError.message }, { status: 500 });
    }

    if (!updatedRequest) {
      return NextResponse.json({ error: "Friend request is not pending anymore" }, { status: 409 });
    }

    if (body.decision === "accept") {
      const { error: followError } = await supabase
        .from("follows")
        .upsert(
          {
            follower_id: updatedRequest.requester_id,
            following_id: updatedRequest.receiver_id,
          },
          { onConflict: "follower_id,following_id", ignoreDuplicates: true }
        );

      if (followError) {
        return NextResponse.json({ error: followError.message }, { status: 500 });
      }
    }

    const { error: markNotificationReadError } = await supabase
      .from("notifications")
      .update({ read_at: now, seen_at: now })
      .eq("id", notificationRow.id)
      .eq("recipient_user_id", user.id);

    if (markNotificationReadError) {
      return NextResponse.json({ error: markNotificationReadError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: targetStatus });
  }

  if (ids.length === 0) {
    return NextResponse.json({ error: "No ids provided" }, { status: 400 });
  }

  if (action === "mark_read") {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now, seen_at: now })
      .eq("recipient_user_id", user.id)
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "archive_selected") {
    const { error } = await supabase
      .from("notifications")
      .update({ archived_at: now })
      .eq("recipient_user_id", user.id)
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
