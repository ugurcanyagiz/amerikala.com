import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; warningId: string }> }
) {
  try {
    const { supabase, user: actor } = await requireAdmin();
    const { userId, warningId } = await params;

    const { error } = await supabase
      .from("user_warnings")
      .delete()
      .eq("id", warningId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ ok: false, error: "Unable to revoke warning." }, { status: 500 });
    }

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      targetUserId: userId,
      action: "admin.user.warning.revoke",
      entityType: "user_warning",
      entityId: warningId,
      metadata: {},
    });

    return NextResponse.json({ ok: true, message: "Warning revoked." });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
