import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getEnv } from "./config/env.js";
import { mobileLoginRoute } from "./routes/mobile-login.js";
import { mobileStatsRoute } from "./routes/mobile-stats.js";

export const app = new Hono();

app.get("/healthz", (c) => c.json({ ok: true }));
app.route("/", mobileLoginRoute);
app.route("/", mobileStatsRoute);

if (process.env.NODE_ENV !== "test") {
  const env = getEnv();
  process.env.PORT = String(env.port);
  serve({ fetch: app.fetch, port: env.port });
  console.log(`boss-shuju backend listening on ${env.port}`);
}

