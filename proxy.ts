import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { getUserRoleFromProfiles } from "@/lib/auth/rbac";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

function createProxyClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApiRoute = pathname === "/api/admin" || pathname.startsWith("/api/admin/");

  if (!isAdminRoute && !isAdminApiRoute) {
    return NextResponse.next();
  }

  const nextResponse = NextResponse.next();
  const supabase = createProxyClient(request, nextResponse);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (isAdminApiRoute) {
      return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("message", "Admin paneline erişmek için giriş yapmalısınız.");
    return NextResponse.redirect(loginUrl);
  }

  let role;
  try {
    role = await getUserRoleFromProfiles(supabase, user.id);
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to resolve current role." }, { status: 500 });
  }

  if (role !== "admin") {
    if (isAdminApiRoute) {
      return NextResponse.json({ ok: false, error: "Insufficient admin privileges." }, { status: 403 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("message", "Bu alan yalnızca admin kullanıcılar içindir.");
    return NextResponse.redirect(loginUrl);
  }

  return nextResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
