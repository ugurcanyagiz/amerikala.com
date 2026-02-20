import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminUserListItem = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  status: "active" | "pending" | "suspended";
  createdAt: string | null;
  lastSeen: string | null;
};

function deriveStatus(user: { banned_until?: string | null; email_confirmed_at?: string | null }): AdminUserListItem["status"] {
  if (user.banned_until && new Date(user.banned_until).getTime() > Date.now()) {
    return "suspended";
  }
  if (!user.email_confirmed_at) {
    return "pending";
  }
  return "active";
}

export async function GET(request: NextRequest) {
  try {
    const { user: actor } = await requireAdmin();
    const { searchParams } = new URL(request.url);

    const query = (searchParams.get("q") ?? "").trim().toLowerCase();
    const roleFilter = (searchParams.get("role") ?? "all").trim();
    const statusFilter = (searchParams.get("status") ?? "all").trim();
    const page = Math.max(Number(searchParams.get("page") ?? "1") || 1, 1);
    const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? "10") || 10, 1), 50);

    const { data: authUsersData, error: authUsersError } = await getSupabaseAdminClient().auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authUsersError) {
      return NextResponse.json({ ok: false, error: "Unable to fetch users." }, { status: 500 });
    }

    const authUsers = authUsersData?.users ?? [];
    const userIds = authUsers.map((item) => item.id);

    const { data: profiles, error: profilesError } = await getSupabaseAdminClient()
      .from("profiles")
      .select("id, full_name, username, avatar_url, role")
      .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    if (profilesError) {
      return NextResponse.json({ ok: false, error: "Unable to fetch profile data." }, { status: 500 });
    }

    const profileById = new Map((profiles ?? []).map((item) => [item.id, item]));

    const mapped: AdminUserListItem[] = authUsers.map((authUser) => {
      const profile = profileById.get(authUser.id);
      const metaName =
        typeof authUser.user_metadata?.full_name === "string"
          ? authUser.user_metadata.full_name
          : typeof authUser.user_metadata?.name === "string"
            ? authUser.user_metadata.name
            : null;
      const name = profile?.full_name ?? profile?.username ?? metaName ?? null;
      const avatarUrl =
        profile?.avatar_url ??
        (typeof authUser.user_metadata?.avatar_url === "string" ? authUser.user_metadata.avatar_url : null);
      const role = typeof profile?.role === "string" ? profile.role : "user";
      const status = deriveStatus(authUser);

      return {
        id: authUser.id,
        email: authUser.email ?? null,
        name,
        avatarUrl,
        role,
        status,
        createdAt: authUser.created_at ?? null,
        lastSeen: authUser.last_sign_in_at ?? null,
      };
    });

    const filtered = mapped.filter((item) => {
      const matchesQuery =
        !query ||
        (item.email ?? "").toLowerCase().includes(query) ||
        (item.name ?? "").toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || item.role === roleFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });

    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const users = filtered.slice(start, start + pageSize);

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      action: "admin.users.list.view",
      entityType: "admin_users",
      metadata: { query, roleFilter, statusFilter, page: safePage, pageSize },
    });

    return NextResponse.json({ ok: true, users, page: safePage, pageSize, total, totalPages });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
