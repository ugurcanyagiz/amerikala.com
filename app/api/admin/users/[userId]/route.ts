import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { AdminAuthorizationError, requireModerator } from "@/lib/auth/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function deriveStatus(user: { banned_until?: string | null; email_confirmed_at?: string | null }, profile: { is_blocked?: boolean | null }) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { user: actor } = await requireModerator();
    const { userId } = await params;

    const { data: authUserData, error: authUserError } = await getSupabaseAdminClient().auth.admin.getUserById(userId);
    if (authUserError || !authUserData?.user) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }

    const authUser = authUserData.user;

    const { data: profile, error: profileError } = await getSupabaseAdminClient()
      .from("profiles")
      .select("id, username, full_name, avatar_url, role, is_verified, created_at, updated_at, is_blocked, blocked_reason, blocked_at, blocked_by")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ ok: false, error: "Unable to fetch profile." }, { status: 500 });
    }

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      targetUserId: userId,
      action: "admin.user.view",
      entityType: "profile",
      entityId: userId,
      metadata: {},
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: authUser.id,
        email: authUser.email ?? null,
        createdAt: authUser.created_at ?? null,
        lastSeen: authUser.last_sign_in_at ?? null,
        status: deriveStatus(authUser, profile ?? {}),
        profile: profile ?? null,
      },
    });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
