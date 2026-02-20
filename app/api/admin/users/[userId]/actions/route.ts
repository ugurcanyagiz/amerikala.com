import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { AdminAuthorizationError, requireAdmin, requireUltraAdmin } from "@/lib/auth/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const action = typeof body?.action === "string" ? body.action : "";

    if (action === "warn") {
      const { user: actor } = await requireAdmin();
      const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

      await writeAdminAuditLogFromRequest(request, {
        actorUserId: actor.id,
        targetUserId: userId,
        action: "admin.user.warn",
        entityType: "profile",
        entityId: userId,
        metadata: { reason },
      });

      return NextResponse.json({ ok: true, message: "Warning logged." });
    }

    if (action === "block" || action === "unblock") {
      const { user: actor } = await requireAdmin();
      const admin = getSupabaseAdminClient();

      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: action === "block" ? "876000h" : "none",
      });

      if (error) {
        return NextResponse.json({ ok: false, error: "Unable to update user block status." }, { status: 500 });
      }

      await writeAdminAuditLogFromRequest(request, {
        actorUserId: actor.id,
        targetUserId: userId,
        action: action === "block" ? "admin.user.block" : "admin.user.unblock",
        entityType: "profile",
        entityId: userId,
        metadata: {},
      });

      return NextResponse.json({ ok: true, message: action === "block" ? "User blocked." : "User unblocked." });
    }

    if (action === "change_role") {
      const { user: actor, supabase } = await requireUltraAdmin();
      const role = typeof body?.role === "string" ? body.role : "";

      if (!["user", "moderator", "admin", "ultra_admin"].includes(role)) {
        return NextResponse.json({ ok: false, error: "Invalid role." }, { status: 400 });
      }

      const { data: beforeData, error: beforeError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (beforeError) {
        return NextResponse.json({ ok: false, error: "Unable to fetch current role." }, { status: 500 });
      }

      const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
      if (error) {
        return NextResponse.json({ ok: false, error: "Unable to update role." }, { status: 500 });
      }

      await writeAdminAuditLogFromRequest(request, {
        actorUserId: actor.id,
        targetUserId: userId,
        action: "admin.user.role.update",
        entityType: "profile",
        entityId: userId,
        metadata: { fromRole: beforeData?.role ?? null, toRole: role },
      });

      return NextResponse.json({ ok: true, message: "Role updated." });
    }

    return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
