import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { CONTENT_TABLE_CONFIG } from "@/lib/admin/data";
import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { user: actor } = await requireAdmin();
    const adminClient = getSupabaseAdminClient();
    const { itemId } = await params;

    const body = (await request.json()) as {
      table?: string;
      action?: "hide" | "unhide" | "delete";
    };

    if (!body.table || !body.action) {
      return NextResponse.json({ ok: false, error: "Missing table or action." }, { status: 400 });
    }

    if (!CONTENT_TABLE_CONFIG.some((item) => item.table === body.table)) {
      return NextResponse.json({ ok: false, error: "Unsupported content table." }, { status: 400 });
    }

    if (body.action !== "delete") {
      return NextResponse.json({ ok: false, error: "Hide/unhide is not supported for current content tables." }, { status: 400 });
    }

    const { error } = await adminClient.from(body.table).delete().eq("id", itemId);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      action: `admin.content.${body.action}`,
      entityType: "content",
      entityId: itemId,
      metadata: { table: body.table },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
