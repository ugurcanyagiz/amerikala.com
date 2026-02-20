import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user: actor } = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") ?? "1") || 1, 1);
    const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? "20") || 20, 1), 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("admin_audit_logs")
      .select("id, created_at, actor_user_id, target_user_id, action, entity_type, entity_id, metadata", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ ok: false, error: "Unable to load audit logs." }, { status: 500 });
    }

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      action: "admin.audit_logs.view",
      entityType: "admin_audit_log",
      metadata: { page, pageSize },
    });

    return NextResponse.json({
      ok: true,
      logs: data ?? [],
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.max(Math.ceil((count ?? 0) / pageSize), 1),
    });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
