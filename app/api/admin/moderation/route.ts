import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { ADMIN_LISTING_TABLES } from "@/lib/admin/data";
import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ModerationItem = {
  id: string;
  table: string;
  category: string;
  title: string;
  submittedBy: string | null;
  submittedByName: string | null;
  createdAt: string | null;
  status: string;
  detail: Record<string, unknown>;
};

export async function GET(request: NextRequest) {
  try {
    const { user: actor } = await requireAdmin();
    const adminClient = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);

    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const statusFilter = (searchParams.get("status") ?? "pending").trim().toLowerCase();
    const page = Math.max(Number(searchParams.get("page") ?? "1") || 1, 1);
    const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? "10") || 10, 1), 50);

    const rows = await Promise.all(
      ADMIN_LISTING_TABLES.map(async ({ table, category }) => {
        let query = adminClient.from(table).select("*").order("created_at", { ascending: false }).limit(200);
        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }
        const { data, error } = await query;
        if (error) return [] as ModerationItem[];

        return (data ?? []).map((item) => {
          const row = item as Record<string, unknown>;
          return {
            id: String(row.id),
            table,
            category,
            title: String(row.title ?? row.name ?? row.description ?? "Untitled"),
            submittedBy: typeof row.user_id === "string" ? row.user_id : null,
            submittedByName: null,
            createdAt: typeof row.created_at === "string" ? row.created_at : null,
            status: String(row.status ?? "unknown"),
            detail: row,
          };
        });
      })
    );

    const merged = rows.flat();
    const userIds = Array.from(new Set(merged.map((item) => item.submittedBy).filter((id): id is string => Boolean(id))));

    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, full_name, username")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p as { full_name: string | null; username: string | null }]));

    const enriched = merged.map((item) => ({
      ...item,
      submittedByName: item.submittedBy ? profileById.get(item.submittedBy)?.full_name ?? profileById.get(item.submittedBy)?.username ?? null : null,
    }));

    const filtered = enriched
      .filter((item) => {
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          (item.submittedByName ?? "").toLowerCase().includes(q) ||
          (item.submittedBy ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (new Date(b.createdAt ?? 0).getTime() || 0) - (new Date(a.createdAt ?? 0).getTime() || 0));

    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      action: "admin.moderation.list.view",
      entityType: "listing",
      metadata: { statusFilter, page: safePage, pageSize, q },
    });

    return NextResponse.json({ ok: true, items: filtered.slice(start, start + pageSize), page: safePage, total, totalPages });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
