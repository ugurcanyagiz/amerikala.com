import { NextRequest, NextResponse } from "next/server";

import { writeAdminAuditLogFromRequest } from "@/lib/audit/adminAudit";
import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ActivityItem = {
  id: string;
  type: "post" | "listing" | "job_listing" | "marketplace_listing" | "comment" | "meetup";
  label: string;
  createdAt: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { user: actor } = await requireAdmin();
    const { userId } = await params;
    const admin = getSupabaseAdminClient();

    const [postsRes, listingsRes, jobsRes, marketRes, commentsRes, eventsRes] = await Promise.all([
      admin.from("posts").select("id, created_at, content").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      admin.from("listings").select("id, created_at, title").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      admin.from("job_listings").select("id, created_at, title").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      admin
        .from("marketplace_listings")
        .select("id, created_at, title")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      admin.from("comments").select("id, created_at, content").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      admin.from("events").select("id, created_at, title").eq("organizer_id", userId).order("created_at", { ascending: false }).limit(50),
    ]);

    const hasError = [postsRes, listingsRes, jobsRes, marketRes, commentsRes, eventsRes].find((item) => item.error);
    if (hasError?.error) {
      return NextResponse.json({ ok: false, error: "Unable to load usage history." }, { status: 500 });
    }

    const activities: ActivityItem[] = [
      ...(postsRes.data ?? []).map((item) => ({
        id: `post-${item.id}`,
        type: "post" as const,
        label: item.content ? String(item.content).slice(0, 80) : "Post created",
        createdAt: item.created_at ?? null,
      })),
      ...(listingsRes.data ?? []).map((item) => ({
        id: `listing-${item.id}`,
        type: "listing" as const,
        label: item.title ?? "Listing created",
        createdAt: item.created_at ?? null,
      })),
      ...(jobsRes.data ?? []).map((item) => ({
        id: `job-${item.id}`,
        type: "job_listing" as const,
        label: item.title ?? "Job listing created",
        createdAt: item.created_at ?? null,
      })),
      ...(marketRes.data ?? []).map((item) => ({
        id: `market-${item.id}`,
        type: "marketplace_listing" as const,
        label: item.title ?? "Marketplace listing created",
        createdAt: item.created_at ?? null,
      })),
      ...(commentsRes.data ?? []).map((item) => ({
        id: `comment-${item.id}`,
        type: "comment" as const,
        label: item.content ? String(item.content).slice(0, 80) : "Comment added",
        createdAt: item.created_at ?? null,
      })),
      ...(eventsRes.data ?? []).map((item) => ({
        id: `event-${item.id}`,
        type: "meetup" as const,
        label: item.title ?? "Meetup created",
        createdAt: item.created_at ?? null,
      })),
    ]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 50);

    await writeAdminAuditLogFromRequest(request, {
      actorUserId: actor.id,
      targetUserId: userId,
      action: "admin.user.activity.view",
      entityType: "profile",
      entityId: userId,
      metadata: { count: activities.length },
    });

    return NextResponse.json({ ok: true, activities });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
