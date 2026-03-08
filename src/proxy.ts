import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PAGES = ["/login", "/signup"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PAGES.includes(pathname) ||
    PUBLIC_API.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ?? "fallback-secret-please-set-env"
    );
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("auth_token");
    res.cookies.delete("user_id");
    res.cookies.delete("user_nickname");
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon-.*\\.png|manifest\\.json).*)",
  ],
};
