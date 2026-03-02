import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { ADMIN_LISTING_TABLES, buildModerationUpdate } from "@/lib/admin/data";
import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ listingId: string }> }) {
  try {
    const { user: actor } = await requireAdmin();
    const adminClient = getSupabaseAdminClient();
    const { listingId } = await params;

    const body = (await request.json()) as {
      table?: string;
      action?: "approve" | "reject";
      rejectionReason?: string;
    };

    if (!body.table || !ADMIN_LISTING_TABLES.some((item) => item.table === body.table)) {
      return NextResponse.json({ ok: false, error: "Invalid listing table." }, { status: 400 });
    }

    if (!body.action || !["approve", "reject"].includes(body.action)) {
      return NextResponse.json({ ok: false, error: "Invalid moderation action." }, { status: 400 });
    }

    const payload = buildModerationUpdate(actor.id, body.action, body.rejectionReason);

    const { data, error } = await adminClient.from(body.table).update(payload).eq("id", listingId).select("*").single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      action: body.action === "approve" ? "admin.listing.approve" : "admin.listing.reject",
      entityType: "listing",
      entityId: listingId,
      metadata: { table: body.table },
    });

    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
