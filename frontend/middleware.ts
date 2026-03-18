import { NextRequest, NextResponse } from "next/server";
import { ROLE_COOKIE, TOKEN_COOKIE } from "@/lib/constants";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const { pathname, search } = request.nextUrl;

  if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    const loginUrl = new URL(`/login?next=${encodeURIComponent(pathname + search)}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
