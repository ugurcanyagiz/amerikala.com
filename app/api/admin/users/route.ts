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
  status: "active" | "pending" | "suspended" | "blocked";
  createdAt: string | null;
  lastSeen: string | null;
};

function deriveStatus(user: { banned_until?: string | null; email_confirmed_at?: string | null }, profile: { is_blocked?: boolean | null }): AdminUserListItem["status"] {
  if (profile.is_blocked) {
    return "blocked";
  }
  if (user.banned_until && new Date(user.banned_until).getTime() > Date.now()) {
    return "suspended";
  }
  if (!user.email_confirmed_at) {
    return "pending";
  }
  return "active";
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { user: actor, role: actorRole } = await requireAdmin();
    const { searchParams } = new URL(request.url);

    const query = (searchParams.get("q") ?? "").trim().toLowerCase();
    const roleFilter = (searchParams.get("role") ?? "all").trim();
    const statusFilter = (searchParams.get("status") ?? "all").trim();
    const page = Math.max(Number(searchParams.get("page") ?? "1") || 1, 1);
    const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? "10") || 10, 1), 50);

    const querySummary = {
      q: query,
      role: roleFilter,
      status: statusFilter,
      page,
      pageSize,
    };

    console.info("[admin/users] request.start", {
      requestId,
      actorUserId: actor.id,
      actorRole,
      roleCheck: "passed",
      query: querySummary,
      env: {
        hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasServiceRoleFallback: Boolean(process.env.SUPABASE_SERVICE_ROLE),
      },
    });

    const { data: authUsersData, error: authUsersError } = await getSupabaseAdminClient().auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authUsersError) {
      console.error("[admin/users] auth.admin.listUsers.error", {
        requestId,
        error: authUsersError,
        query: querySummary,
      });
      return NextResponse.json({ ok: false, error: "Unable to fetch users." }, { status: 500 });
    }

    const authUsers = authUsersData?.users ?? [];
    const userIds = authUsers.map((item) => item.id);

    const { data: profiles, error: profilesError } = await getSupabaseAdminClient()
      .from("profiles")
      .select("id, full_name, username, avatar_url, role, is_blocked, blocked_reason, blocked_at, blocked_by")
      .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    if (profilesError) {
      console.error("[admin/users] profiles.query.error", {
        requestId,
        error: profilesError,
        query: querySummary,
        profileSelect:
          "id, full_name, username, avatar_url, role, is_blocked, blocked_reason, blocked_at, blocked_by",
        profileFilter: {
          idInCount: userIds.length,
          usedPlaceholder: userIds.length === 0,
        },
      });
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
      const status = deriveStatus(authUser, profile ?? {});

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

    console.info("[admin/users] request.success", {
      requestId,
      actorUserId: actor.id,
      query: querySummary,
      totals: { total, returned: users.length, totalPages, safePage },
    });

    return NextResponse.json({ ok: true, users, page: safePage, pageSize, total, totalPages });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      console.warn("[admin/users] request.denied", {
        requestId,
        roleCheck: "failed",
        status: error.status,
        message: error.message,
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    console.error("[admin/users] request.unhandled", {
      requestId,
      error,
      env: {
        hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasServiceRoleFallback: Boolean(process.env.SUPABASE_SERVICE_ROLE),
      },
    });

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
