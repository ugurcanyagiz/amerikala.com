import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { ADMIN_LISTING_TABLES, REPORT_TABLE_CANDIDATES } from "@/lib/admin/data";
import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { user: actor } = await requireAdmin();
    const adminClient = getSupabaseAdminClient();

    const pendingPromises = ADMIN_LISTING_TABLES.map(async ({ table }) => {
      const { count, error } = await adminClient.from(table).select("id", { count: "exact", head: true }).eq("status", "pending");
      if (error) return 0;
      return count ?? 0;
    });

    const [listingPendingCounts, moderatorsResult] = await Promise.all([
      Promise.all(pendingPromises),
      adminClient.from("profiles").select("id", { count: "exact", head: true }).in("role", ["admin", "moderator"]),
    ]);

    if (moderatorsResult.error) {
      return NextResponse.json({ ok: false, error: "Unable to load moderator metrics." }, { status: 500 });
    }

    let openReviews = 0;
    let escalatedCases = 0;
    const checkedReportTables: string[] = [];

    for (const tableName of REPORT_TABLE_CANDIDATES) {
      const unresolved = await adminClient
        .from(tableName)
        .select("id", { count: "exact", head: true })
        .or("resolved_at.is.null,status.eq.pending,status.eq.open,status.eq.unresolved");

      if (!unresolved.error) {
        checkedReportTables.push(tableName);
        openReviews += unresolved.count ?? 0;

        const escalated = await adminClient
          .from(tableName)
          .select("id", { count: "exact", head: true })
          .or("priority.eq.high,severity.eq.high,is_escalated.eq.true");

        if (!escalated.error) {
          escalatedCases += escalated.count ?? 0;
        }
      }
    }

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      action: "admin.overview.metrics.view",
      entityType: "admin_dashboard",
      metadata: {
        reportTablesChecked: checkedReportTables,
      },
    });

    return NextResponse.json({
      ok: true,
      metrics: {
        openReviews,
        pendingApprovals: listingPendingCounts.reduce((sum, count) => sum + count, 0),
        activeModerators: moderatorsResult.count ?? 0,
        escalatedCases,
      },
    });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
