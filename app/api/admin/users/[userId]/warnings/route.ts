import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { AdminAuthorizationError, requireAdmin, requireModerator } from "@/lib/auth/admin";

const ALLOWED_SEVERITIES = ["low", "medium", "high"] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { supabase, user: actor } = await requireModerator();
    const { userId } = await params;

    const { data, error } = await supabase
      .from("user_warnings")
      .select("id, user_id, created_at, created_by_admin_id, reason, severity, expires_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ ok: false, error: "Unable to load warnings." }, { status: 500 });
    }

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      targetUserId: userId,
      action: "admin.user.warnings.view",
      entityType: "user_warning",
      entityId: userId,
      metadata: { count: data?.length ?? 0 },
    });

    return NextResponse.json({ ok: true, warnings: data ?? [] });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { supabase, user: actor } = await requireAdmin();
    const { userId } = await params;
    const body = await request.json();

    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const severity = typeof body?.severity === "string" ? body.severity : "medium";
    const expiresAt = typeof body?.expiresAt === "string" && body.expiresAt.trim() ? body.expiresAt : null;

    if (!reason) {
      return NextResponse.json({ ok: false, error: "Warning reason is required." }, { status: 400 });
    }

    if (!ALLOWED_SEVERITIES.includes(severity as (typeof ALLOWED_SEVERITIES)[number])) {
      return NextResponse.json({ ok: false, error: "Invalid severity value." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_warnings")
      .insert({
        user_id: userId,
        created_by_admin_id: actor.id,
        reason,
        severity,
        expires_at: expiresAt,
      })
      .select("id, user_id, created_at, created_by_admin_id, reason, severity, expires_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: "Unable to create warning." }, { status: 500 });
    }

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      targetUserId: userId,
      action: "admin.user.warning.create",
      entityType: "user_warning",
      entityId: data.id,
      metadata: { severity, expiresAt },
    });

    return NextResponse.json({ ok: true, warning: data, message: "Warning created." });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
