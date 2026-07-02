import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getEnv } from "./config/env.js";
import { credentialedCorsMiddleware } from "./middleware/cors.js";
import { mobileAftersalesRoute } from "./routes/mobile-aftersales.js";
import { mobileLoginRoute } from "./routes/mobile-login.js";
import { mobileStatsRoute } from "./routes/mobile-stats.js";
import { mobileWorkflowRoute } from "./routes/mobile-workflow.js";

export const app = new Hono();

app.use("*", credentialedCorsMiddleware);
app.get("/healthz", (c) => c.json({ ok: true }));
app.route("/", mobileAftersalesRoute);
app.route("/", mobileLoginRoute);
app.route("/", mobileStatsRoute);
app.route("/", mobileWorkflowRoute);

if (process.env.NODE_ENV !== "test") {
  const env = getEnv();
  process.env.PORT = String(env.port);
  serve({ fetch: app.fetch, port: env.port });
  console.log(`boss-shuju backend listening on ${env.port}`);
}

