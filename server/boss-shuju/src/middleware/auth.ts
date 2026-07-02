import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { MOBILE_SESSION_COOKIE, verifyMobileSessionToken } from "../auth/session.js";
import { getEnv } from "../config/env.js";

export const mobileAuthMiddleware = createMiddleware(async (c, next) => {
  const env = getEnv();
  const token = getCookie(c, MOBILE_SESSION_COOKIE);

  if (!verifyMobileSessionToken(token, env.mobileSessionSecret)) {
    return c.json({ message: "未授权访问", error: "unauthorized" }, 401);
  }

  await next();
});

