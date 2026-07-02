import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getEnv } from "./config/env.js";

export const app = new Hono();

app.get("/healthz", (c) => c.json({ ok: true }));

if (process.env.NODE_ENV !== "test") {
  const env = getEnv();
  process.env.PORT = String(env.port);
  serve({ fetch: app.fetch, port: env.port });
  console.log(`boss-shuju backend listening on ${env.port}`);
}
