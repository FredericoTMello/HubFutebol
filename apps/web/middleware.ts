import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { TOKEN_COOKIE_KEY } from "./lib/auth-session";

const AUTH_PAGES = new Set(["/login", "/register"]);

function isProtectedPath(pathname: string): boolean {
  return pathname === "/join" || pathname.startsWith("/g/");
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_KEY)?.value;
  const { pathname } = request.nextUrl;

  if (!token && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/join") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (token && AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL("/join", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/g/:path*", "/join", "/login", "/register"],
};
