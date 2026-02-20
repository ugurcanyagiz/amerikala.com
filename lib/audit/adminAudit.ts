import { NextRequest } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminAuditLogInput = {
  actorUserId: string;
  targetUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

function requestIp(request?: NextRequest): string | null {
  if (!request) return null;
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return null;
  return forwarded.split(",")[0]?.trim() || null;
}

function requestUserAgent(request?: NextRequest): string | null {
  if (!request) return null;
  return request.headers.get("user-agent");
}

export async function writeAdminAuditLog(input: AdminAuditLogInput): Promise<void> {
  const { error } = await getSupabaseAdminClient().from("admin_audit_logs").insert({
    actor_user_id: input.actorUserId,
    target_user_id: input.targetUserId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
    ip: input.ip ?? null,
    user_agent: input.userAgent ?? null,
  });

  if (error) {
    throw new Error(`Failed to write admin audit log: ${error.message}`);
  }
}

export async function writeAdminAuditLogFromRequest(
  request: NextRequest | undefined,
  input: Omit<AdminAuditLogInput, "ip" | "userAgent">
): Promise<void> {
  await writeAdminAuditLog({
    ...input,
    ip: requestIp(request),
    userAgent: requestUserAgent(request),
  });
}
