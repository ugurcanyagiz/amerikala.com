import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface NotificationPayload {
  recipientUserIds?: string[];
  postId?: string;
  commentId?: string;
  actorName?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as NotificationPayload;
  const recipientUserIds = Array.isArray(body.recipientUserIds)
    ? body.recipientUserIds.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];

  if (recipientUserIds.length === 0 || !body.postId || !body.commentId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const uniqueRecipientIds = Array.from(new Set(recipientUserIds.filter((id) => id !== user.id)));
  if (uniqueRecipientIds.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  const actorLabel = body.actorName?.trim() || "Bir kullanıcı";
  const admin = getSupabaseAdminClient();

  const rows = uniqueRecipientIds.map((recipientUserId) => ({
    recipient_user_id: recipientUserId,
    actor_user_id: user.id,
    event_type: "help.comment",
    title: "Yardımlaşma gönderine yeni yorum",
    body: `${actorLabel} gönderine yorum yaptı.`,
    action_url: `/yardimlasma?post=${body.postId}#comment-${body.commentId}`,
    subject_type: "help_post",
    subject_id: body.postId,
    metadata: {
      post_id: body.postId,
      comment_id: body.commentId,
      scope: "yardimlasma",
    },
    dedupe_key: `help.comment:${body.postId}:${body.commentId}:${recipientUserId}`,
  }));

  const { error } = await admin.from("notifications").upsert(rows, {
    onConflict: "recipient_user_id,dedupe_key",
    ignoreDuplicates: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, inserted: rows.length });
}
