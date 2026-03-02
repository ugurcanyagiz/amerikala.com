import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const ADMIN_LISTING_TABLES = [
  { table: "listings", category: "Emlak" },
  { table: "job_listings", category: "İş" },
  { table: "marketplace_listings", category: "Alışveriş" },
] as const;

export type ListingTableName = (typeof ADMIN_LISTING_TABLES)[number]["table"];

export async function getTableColumns(supabase: SupabaseClient, tableName: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_schema", "public")
    .eq("table_name", tableName);

  if (error) {
    throw new Error(`Unable to inspect columns for ${tableName}: ${error.message}`);
  }

  return (data ?? []).map((row) => String((row as { column_name: string }).column_name));
}

export function pickFirstColumn(columns: string[], candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (columns.includes(candidate)) return candidate;
  }
  return null;
}

export function buildModerationUpdate(columns: string[], actorId: string, action: "approve" | "reject", rejectionReason?: string) {
  const update: Record<string, unknown> = { status: action === "approve" ? "approved" : "rejected" };

  if (action === "approve") {
    if (columns.includes("approved_at")) update.approved_at = new Date().toISOString();
    if (columns.includes("approved_by")) update.approved_by = actorId;
    if (columns.includes("rejected_at")) update.rejected_at = null;
    if (columns.includes("rejected_by")) update.rejected_by = null;
    if (columns.includes("rejection_reason")) update.rejection_reason = null;
  } else {
    if (columns.includes("rejected_at")) update.rejected_at = new Date().toISOString();
    if (columns.includes("rejected_by")) update.rejected_by = actorId;
    if (columns.includes("rejection_reason")) update.rejection_reason = rejectionReason ?? null;
  }

  return update;
}
