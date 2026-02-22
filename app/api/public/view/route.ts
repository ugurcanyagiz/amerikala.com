import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type PublicViewTable = "listings" | "job_listings" | "marketplace_listings";

const ALLOWED_TABLES: ReadonlySet<PublicViewTable> = new Set([
  "listings",
  "job_listings",
  "marketplace_listings",
]);

const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitStore = new Map<string, number>();

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const expiresAt = rateLimitStore.get(key);
  if (expiresAt && expiresAt > now) {
    return true;
  }

  rateLimitStore.set(key, now + RATE_LIMIT_WINDOW_MS);

  if (rateLimitStore.size > 10_000) {
    for (const [entryKey, entryExpiry] of rateLimitStore.entries()) {
      if (entryExpiry <= now) {
        rateLimitStore.delete(entryKey);
      }
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  let payload: { table?: string; id?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const table = payload.table;
  const id = payload.id;

  if (!table || !id) {
    return NextResponse.json({ error: "Both 'table' and 'id' are required." }, { status: 400 });
  }

  if (!ALLOWED_TABLES.has(table as PublicViewTable)) {
    return NextResponse.json({ error: "Unsupported table." }, { status: 400 });
  }

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid listing id." }, { status: 400 });
  }

  const rateLimitKey = `${getClientIp(request)}:${table}:${id}`;
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json({ ok: true, rateLimited: true }, { status: 202 });
  }

  const supabaseAdmin = getSupabaseAdminClient();

  const { error } = await supabaseAdmin.rpc("increment_view_count", {
    table_name: table,
    item_id: id,
  });

  if (error) {
    console.error("Failed to increment public listing view count:", error);
    return NextResponse.json({ error: "Failed to update view count." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

