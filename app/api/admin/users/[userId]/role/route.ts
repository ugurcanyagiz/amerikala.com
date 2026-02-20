import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { AdminAuthorizationError, requireUltraAdmin } from "@/lib/auth/admin";

const ALLOWED_ROLES = new Set(["user", "moderator", "admin", "ultra_admin"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { supabase, user } = await requireUltraAdmin();
    const { userId } = await params;
    const body = await request.json();
    const nextRole = typeof body?.role === "string" ? body.role : "";

    if (!ALLOWED_ROLES.has(nextRole)) {
      return NextResponse.json({ ok: false, error: "Invalid role value." }, { status: 400 });
    }

    if (userId === user.id && nextRole !== "ultra_admin") {
      return NextResponse.json(
        { ok: false, error: "Ultra admins cannot remove their own ultra_admin role." },
        { status: 400 }
      );
    }

    const { data: targetBefore, error: beforeError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (beforeError) {
      return NextResponse.json({ ok: false, error: "Unable to fetch current role." }, { status: 500 });
    }

    const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("id", userId);

    if (error) {
      return NextResponse.json({ ok: false, error: "Unable to update role." }, { status: 500 });
    }

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: user.id,
      targetUserId: userId,
      action: "admin.user.role.update",
      entityType: "profile",
      entityId: userId,
      metadata: {
        fromRole: targetBefore?.role ?? null,
        toRole: nextRole,
      },
    });

    return NextResponse.json({ ok: true, userId, role: nextRole });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
