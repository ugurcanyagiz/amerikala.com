import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  try {
    const { user, role } = await requireAdmin();

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: user.id,
      action: "admin.session.view",
      entityType: "admin_session",
      entityId: user.id,
      metadata: { role },
    });

    return NextResponse.json({
      ok: true,
      userId: user.id,
      role,
    });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
