import { Hono } from "hono";
import { connectMongo } from "../db/mongodb.js";
import { mobileAuthMiddleware } from "../middleware/auth.js";
import { getAllOnlineShopTrendPayload } from "../services/all-online-shop-trend-service.js";
import { getAllRepaymentTrendPayload } from "../services/all-repayment-trend-service.js";
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

mobileStatsRoute.get(
  "/api/mobile/stats/online-shop-trend/all",
  mobileAuthMiddleware,
  async (c) => {
    try {
      await connectMongo();
      const payload = await getAllOnlineShopTrendPayload();
      return c.json(payload);
    } catch {
      return c.json(
        {
          message: "获取全部日期在线店铺趋势失败"
        },
        500
      );
    }
  }
);

mobileStatsRoute.get(
  "/api/mobile/stats/repayment-trend/all",
  mobileAuthMiddleware,
  async (c) => {
    try {
      await connectMongo();
      const payload = await getAllRepaymentTrendPayload();
      return c.json(payload);
    } catch {
      return c.json(
        {
          message: "获取全部日期回款趋势失败"
        },
        500
      );
    }
  }
);

