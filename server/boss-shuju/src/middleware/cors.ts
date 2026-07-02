import { cors } from "hono/cors";
import { getEnv } from "../config/env.js";

export const credentialedCorsMiddleware = cors({
  origin: (origin) => {
    const allowedOrigin = getEnv().bossWebOrigin;
    return origin === allowedOrigin ? origin : allowedOrigin;
  },
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  maxAge: 600
});
