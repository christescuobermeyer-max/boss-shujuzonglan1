import { NextRequest, NextResponse } from "next/server";
import {
  MOBILE_SESSION_COOKIE,
  MOBILE_SESSION_MAX_AGE_SECONDS,
  createMobileSessionToken,
  getMobilePasswordConfig,
  verifyMobilePassword
} from "@/lib/mobile-auth";

export async function POST(request: NextRequest) {
  if (!getMobilePasswordConfig()) {
    return NextResponse.json(
      { message: "登录服务暂不可用", error: "login_unavailable" },
      { status: 503 }
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    password = "";
  }

  if (!verifyMobilePassword(password)) {
    return NextResponse.json(
      { message: "密码错误，请重新输入", error: "invalid_password" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: MOBILE_SESSION_COOKIE,
    value: createMobileSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MOBILE_SESSION_MAX_AGE_SECONDS
  });

  return response;
}
