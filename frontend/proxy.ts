import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const publicApiPaths = new Set(["/api/auth/login", "/api/health"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicApiPaths.has(pathname)) return NextResponse.next();

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const ownerEmail = process.env.AUTH_EMAIL?.trim().toLowerCase();
  const hasValidOwnerSession = Boolean(session && ownerEmail && session.email === ownerEmail);
  if (pathname === "/login") {
    return hasValidOwnerSession
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (hasValidOwnerSession) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"],
};
