import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { CONTENT_TABLE_CONFIG } from "@/lib/admin/data";
import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ContentItem = {
  id: string;
  table: string;
  text: string;
  authorId: string | null;
  authorName: string | null;
  createdAt: string | null;
  canHide: boolean;
  hidden: boolean;
};

export async function GET(request: NextRequest) {
  try {
    const { user: actor } = await requireAdmin();
    const adminClient = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();

    const rows = await Promise.all(
      CONTENT_TABLE_CONFIG.map(async ({ table, textColumn, authorColumn, createdColumn }) => {
        const { data, error } = await adminClient
          .from(table)
          .select(`id, ${textColumn}, ${authorColumn}, ${createdColumn}`)
          .order(createdColumn, { ascending: false })
          .limit(20);

        if (error) return [] as ContentItem[];

        return (data ?? []).map((row) => {
          const item = row as Record<string, unknown>;
          return {
            id: String(item.id),
            table,
            text: String(item[textColumn] ?? "(empty)"),
            authorId: typeof item[authorColumn] === "string" ? (item[authorColumn] as string) : null,
            authorName: null,
            createdAt: typeof item[createdColumn] === "string" ? (item[createdColumn] as string) : null,
            canHide: false,
            hidden: false,
          } satisfies ContentItem;
        });
      })
    );

    const merged = rows.flat();
    const userIds = Array.from(new Set(merged.map((item) => item.authorId).filter((id): id is string => Boolean(id))));
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, full_name, username")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const profileById = new Map((profiles ?? []).map((item) => [item.id as string, item as { full_name: string | null; username: string | null }]));

    const filtered = merged
      .map((item) => ({
        ...item,
        authorName: item.authorId ? profileById.get(item.authorId)?.full_name ?? profileById.get(item.authorId)?.username ?? null : null,
      }))
      .filter((item) => !q || item.text.toLowerCase().includes(q) || (item.authorName ?? "").toLowerCase().includes(q))
      .sort((a, b) => (new Date(b.createdAt ?? 0).getTime() || 0) - (new Date(a.createdAt ?? 0).getTime() || 0));

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      action: "admin.content.list.view",
      entityType: "content",
      metadata: { q },
    });

    return NextResponse.json({ ok: true, items: filtered.slice(0, 60) });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
