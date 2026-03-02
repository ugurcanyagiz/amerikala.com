import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { getTableColumns, pickFirstColumn } from "@/lib/admin/data";
import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const CONTENT_TABLES = ["posts", "comments", "help_posts", "help_comments"] as const;

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
      CONTENT_TABLES.map(async (table) => {
        const columns = await getTableColumns(adminClient, table);
        const textColumn = pickFirstColumn(columns, ["content", "title", "description", "body"]);
        const authorColumn = pickFirstColumn(columns, ["user_id", "author_id", "created_by"]);
        const createdColumn = pickFirstColumn(columns, ["created_at", "inserted_at"]);
        const hiddenColumn = pickFirstColumn(columns, ["is_hidden", "hidden"]);

        const selectCols = ["id", textColumn, authorColumn, createdColumn, hiddenColumn].filter(Boolean).join(",");
        const { data } = await adminClient.from(table).select(selectCols).order(createdColumn ?? "id", { ascending: false }).limit(20);

        return (data ?? []).map((row) => {
          const item = row as Record<string, unknown>;
          return {
            id: String(item.id),
            table,
            text: String((textColumn && item[textColumn]) ?? "(empty)"),
            authorId: authorColumn && typeof item[authorColumn] === "string" ? (item[authorColumn] as string) : null,
            authorName: null,
            createdAt: createdColumn && typeof item[createdColumn] === "string" ? (item[createdColumn] as string) : null,
            canHide: Boolean(hiddenColumn),
            hidden: hiddenColumn ? Boolean(item[hiddenColumn]) : false,
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
