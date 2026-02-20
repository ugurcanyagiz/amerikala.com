import { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type AdminRole = "admin" | "ultra_admin";

const ROLE_WEIGHT: Record<string, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
  ultra_admin: 3,
};

export class AdminAuthorizationError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "AdminAuthorizationError";
    this.status = status;
  }
}

function normalizeRole(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

async function resolveCurrentRole(supabase: Awaited<ReturnType<typeof createClient>>, user: User): Promise<string | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new AdminAuthorizationError("Unable to resolve current role.", 500);
  }

  return (
    normalizeRole(profile?.role) ??
    normalizeRole(user.app_metadata?.role) ??
    normalizeRole(user.user_metadata?.role)
  );
}

async function requireRole(minimumRole: AdminRole) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AdminAuthorizationError("Authentication required.", 401);
  }

  const role = await resolveCurrentRole(supabase, user);
  const currentWeight = ROLE_WEIGHT[role ?? ""] ?? -1;
  const requiredWeight = ROLE_WEIGHT[minimumRole];

  if (currentWeight < requiredWeight) {
    throw new AdminAuthorizationError("Insufficient admin privileges.", 403);
  }

  return { supabase, user, role: role as AdminRole };
}

export async function requireAdmin() {
  return requireRole("admin");
}

export async function requireUltraAdmin() {
  return requireRole("ultra_admin");
}
