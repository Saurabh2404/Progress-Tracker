import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { configuredEmail, isAuthenticationConfigured, verifyCredentials } from "@/lib/server/auth";

export async function POST(request: Request) {
  if (!isAuthenticationConfigured()) {
    return NextResponse.json({ message: "Authentication is not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  if (!body?.email || !body.password || !(await verifyCredentials(body.email, body.password))) {
    return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ email: configuredEmail() });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(configuredEmail()), sessionCookieOptions);
  return response;
}
