import "server-only";

export const ADMIN_LISTING_TABLES = [
  { table: "listings", category: "Emlak" },
  { table: "job_listings", category: "İş" },
  { table: "marketplace_listings", category: "Alışveriş" },
] as const;

export type ListingTableName = (typeof ADMIN_LISTING_TABLES)[number]["table"];

export function buildModerationUpdate(actorId: string, action: "approve" | "reject", rejectionReason?: string) {
  const now = new Date().toISOString();

  if (action === "approve") {
    return {
      status: "approved",
      approved_at: now,
      approved_by: actorId,
      rejection_reason: null,
    };
  }

  return {
    status: "rejected",
    rejection_reason: rejectionReason?.trim() || null,
  };
}

export const REPORT_TABLE_CANDIDATES = [
  "reports",
  "content_reports",
  "post_reports",
  "comment_reports",
  "listing_reports",
] as const;

export const CONTENT_TABLE_CONFIG = [
  { table: "posts", textColumn: "content", authorColumn: "user_id", createdColumn: "created_at" },
  { table: "comments", textColumn: "content", authorColumn: "user_id", createdColumn: "created_at" },
  { table: "help_posts", textColumn: "title", authorColumn: "user_id", createdColumn: "created_at" },
  { table: "help_comments", textColumn: "content", authorColumn: "user_id", createdColumn: "created_at" },
] as const;
