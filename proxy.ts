import { NextRequest, NextResponse } from "next/server";

const LOGIN_PATH = "/mobile/login";
const MOBILE_PATH = "/mobile";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/mobile/login") {
    return NextResponse.next();
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/stats"]
};
