import { SupabaseClient } from "@supabase/supabase-js";

export type AppRole = "user" | "moderator" | "admin";

const ROLE_WEIGHT: Record<AppRole, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
};

export function normalizeRole(value: unknown): AppRole | null {
  if (value === "user" || value === "moderator" || value === "admin") {
    return value;
  }

  return null;
}

export function hasMinimumRole(currentRole: AppRole | null, minimumRole: AppRole): boolean {
  if (!currentRole) {
    return false;
  }

  return ROLE_WEIGHT[currentRole] >= ROLE_WEIGHT[minimumRole];
}

export async function getUserRoleFromProfiles(
  supabase: SupabaseClient,
  userId: string
): Promise<AppRole | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to resolve user role from profiles: ${error.message}`);
  }

  return normalizeRole(data?.role ?? null);
}
