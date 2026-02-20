import { NextResponse } from "next/server";

import { AdminAuthorizationError, requireAdmin } from "@/lib/auth/admin";

export async function GET() {
  try {
    const { user, role } = await requireAdmin();

    return NextResponse.json({
      ok: true,
      userId: user.id,
      role,
    });
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
