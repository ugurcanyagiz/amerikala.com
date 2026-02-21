import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type FriendItem = {
  userId: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  followedAt: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { user: actor } = await requireAdmin(); // admin-only route guard
    const { userId } = await params;
    const admin = getSupabaseAdminClient();

    const { data, error } = await admin
      .from("follows")
      .select("following_id, created_at")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      await writeAdminAuditLogFromRequest(request, {
        actorUserId: actor.id,
        targetUserId: userId,
        action: "admin.user.friends.view",
        entityType: "profile",
        entityId: userId,
        metadata: { implemented: false, reason: error.message },
      });

      return NextResponse.json({ ok: true, implemented: false, message: "Friends feature not implemented yet." });
    }

    const followedIds = (data ?? []).map((row) => row.following_id);

    if (followedIds.length === 0) {
      return NextResponse.json({ ok: true, implemented: true, friends: [] });
    }

    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", followedIds);

    if (profilesError) {
      return NextResponse.json({ ok: false, error: "Unable to load friends list." }, { status: 500 });
    }

    const profileById = new Map((profiles ?? []).map((item) => [item.id, item]));

    const friends: FriendItem[] = (data ?? []).map((row) => {
      const profile = profileById.get(row.following_id);
      return {
        userId: row.following_id,
        username: profile?.username ?? null,
        fullName: profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        followedAt: row.created_at ?? null,
      };
    });

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      targetUserId: userId,
      action: "admin.user.friends.view",
      entityType: "profile",
      entityId: userId,
      metadata: { implemented: true, count: friends.length },
    });

    return NextResponse.json({ ok: true, implemented: true, friends });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { user: actor } = await requireAdmin();
    const { userId } = await params;
    const body = await request.json();
    const friendUserId = typeof body?.friendUserId === "string" ? body.friendUserId : "";

    if (!friendUserId) {
      return NextResponse.json({ ok: false, error: "friendUserId is required." }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const { error } = await admin
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", friendUserId);

    if (error) {
      return NextResponse.json({ ok: false, error: "Unable to remove connection." }, { status: 500 });
    }

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      targetUserId: userId,
      action: "admin.user.connection.remove",
      entityType: "follow",
      entityId: friendUserId,
      metadata: { followerId: userId, followingId: friendUserId },
    });

    return NextResponse.json({ ok: true, message: "Connection removed." });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
