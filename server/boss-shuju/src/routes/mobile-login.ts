import { Hono } from "hono";
import {
  MOBILE_SESSION_COOKIE,
  MOBILE_SESSION_MAX_AGE_SECONDS,
  createMobileSessionToken
} from "../auth/session.js";
import { getEnv } from "../config/env.js";

export const mobileLoginRoute = new Hono();

mobileLoginRoute.post("/api/mobile/login", async (c) => {
  const env = getEnv();
  const body = await c.req.json<{ password?: string }>().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password.trim() : "";

  if (password !== env.mobilePassword) {
    return c.json({ message: "密码错误，请重新输入", error: "invalid_password" }, 401);
  }

  const token = createMobileSessionToken(env.mobileSessionSecret);
  c.header(
    "Set-Cookie",
    `${MOBILE_SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${MOBILE_SESSION_MAX_AGE_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`
  );

  return c.json({ ok: true });
});
