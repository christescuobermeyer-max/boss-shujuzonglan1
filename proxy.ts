import { NextRequest, NextResponse } from "next/server";
import {
  MOBILE_SESSION_COOKIE,
  isMobileRequestAuthenticated
} from "@/lib/mobile-auth";

const LOGIN_PATH = "/mobile/login";
const MOBILE_PATH = "/mobile";
const MONTHLY_STATS_API_PATHS = ["/api/stats/monthly", "/api/mobile/stats/monthly"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = isMobileRequestAuthenticated(request);

  if (pathname === "/mobile/login") {
    if (!authenticated) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(MOBILE_PATH, request.url));
  }

  if (authenticated) {
    return NextResponse.next();
  }

  if (MONTHLY_STATS_API_PATHS.includes(pathname)) {
    return NextResponse.json(
      { message: "未授权访问", error: "unauthorized" },
      { status: 401 }
    );
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/mobile/:path*", "/stats", "/api/stats/monthly", "/api/mobile/stats/monthly"]
};

export { MOBILE_SESSION_COOKIE };
