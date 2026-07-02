import { Hono } from "hono";
import { connectMongo } from "../db/mongodb.js";
import { mobileAuthMiddleware } from "../middleware/auth.js";
import { getMobileMonthlyStatsPayload } from "../services/mobile-monthly-stats-service.js";

export const mobileStatsRoute = new Hono();

mobileStatsRoute.get("/api/mobile/stats/monthly", mobileAuthMiddleware, async (c) => {
  try {
    await connectMongo();
    const payload = await getMobileMonthlyStatsPayload(
      c.req.query("month") ?? null,
      c.req.query("dept") ?? null
    );
    return c.json(payload);
  } catch (error) {
    return c.json(
      {
        message: "获取手机统计失败",
        error: error instanceof Error ? error.message : "unknown_error"
      },
      500
    );
  }
});

