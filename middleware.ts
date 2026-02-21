import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE_EXCLUDE = [
  "/logo.png",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/_next/image/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/avatars/") ||
    PUBLIC_FILE_EXCLUDE.includes(pathname)
  );
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.includes("sb-") && name.endsWith("-auth-token"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApiRoute = pathname === "/api/admin" || pathname.startsWith("/api/admin/");

  if (!isAdminRoute && !isAdminApiRoute) {
    return NextResponse.next();
  }

  if (hasSupabaseSessionCookie(request)) {
    return NextResponse.next();
  }

  if (isAdminApiRoute) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|robots.txt|sitemap.xml|images/|avatars/).*)",
  ],
};
