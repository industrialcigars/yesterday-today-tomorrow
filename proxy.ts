import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, signSessionToken, verifySessionToken } from "@/lib/auth";
import { absoluteUrl } from "@/lib/url";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/health", "/sw.js", "/manifest.webmanifest", "/icons", "/brand"];

// Static files (icons, images, manifest, etc.) served straight out of /public
// are always fine to expose pre-login — this also covers any future asset
// folder without needing another PUBLIC_PATHS entry.
const STATIC_ASSET_PATTERN = /\.(png|jpg|jpeg|svg|webp|ico|webmanifest|json)$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    STATIC_ASSET_PATTERN.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    return NextResponse.redirect(absoluteUrl("/login"));
  }

  // Sliding expiration: every visit pushes the cookie's expiry back out, so
  // an active device effectively never gets signed out on its own.
  const response = NextResponse.next();
  response.cookies.set(SESSION_COOKIE, signSessionToken(session.userId), sessionCookieOptions);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)"],
};
