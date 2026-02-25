import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type NotificationAction = "mark_read" | "mark_all_read" | "archive_selected";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { action?: NotificationAction; ids?: string[] };
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
