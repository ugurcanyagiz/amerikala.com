import { User } from "@supabase/supabase-js";

import { AppRole, getUserRoleFromProfiles, hasMinimumRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";

export type AdminRole = "admin";
export type ModerationRole = "moderator" | "admin";

export class AdminAuthorizationError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "AdminAuthorizationError";
    this.status = status;
  }
}

async function resolveCurrentRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User
): Promise<AppRole | null> {
  try {
    return await getUserRoleFromProfiles(supabase, user.id);
  } catch {
    throw new AdminAuthorizationError("Unable to resolve current role.", 500);
  }
}

async function requireRole(minimumRole: ModerationRole) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AdminAuthorizationError("Authentication required.", 401);
  }

  const role = await resolveCurrentRole(supabase, user);

  if (!hasMinimumRole(role, minimumRole)) {
    throw new AdminAuthorizationError("Insufficient admin privileges.", 403);
  }

  return { supabase, user, role: role as ModerationRole };
}

export async function requireAdmin() {
  return requireRole("admin");
}

export async function requireModerator() {
  return requireRole("moderator");
}
