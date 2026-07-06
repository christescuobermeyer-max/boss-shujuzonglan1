import { Hono } from "hono";
import { connectMongo } from "../db/mongodb.js";
import { mobileAuthMiddleware } from "../middleware/auth.js";
import { getRecentSignedTerminationStats } from "../services/recent-signed-termination-service.js";

export const recentSignedTerminationRoute = new Hono();

recentSignedTerminationRoute.get(
  "/api/termination/recent-signed-stats",
  mobileAuthMiddleware,
  async (c) => {
    try {
      await connectMongo();
      const payload = await getRecentSignedTerminationStats(c.req.query("month") ?? null);
      return c.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "获取新签解约统计失败";
      if (message === "month 参数无效") {
        return c.json({ message }, 400);
      }

      console.error("recent signed termination stats exception", {
        message,
        name: error instanceof Error ? error.name : "UnknownError",
        stack: error instanceof Error ? error.stack : undefined
      });
      return c.json({ message: "获取新签解约统计失败" }, 500);
    }
  }
);
