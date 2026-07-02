import { Hono } from "hono";
import { mobileAuthMiddleware } from "../middleware/auth.js";
import { fetchOpenApiJson } from "../services/open-api-client.js";

export const mobileAftersalesRoute = new Hono();

mobileAftersalesRoute.get(
  "/api/mobile/aftersales/daily-records",
  mobileAuthMiddleware,
  async (c) => {
    const searchParams = new URLSearchParams();
    const date = c.req.query("date") ?? "";
    if (date) searchParams.set("date", date);

    const result = await fetchOpenApiJson({
      path: "/api/open/aftersales/daily-records",
      query: searchParams.toString(),
      logLabel: "mobile aftersales"
    });

    if (!result.ok) {
      const status =
        result.error === "missing_open_api_token"
          ? 500
          : result.error === "upstream_error"
            ? 502
            : 504;
      return c.json(
        {
          message: "获取售后每日工作失败",
          error: result.error,
          upstreamStatus: result.upstreamStatus,
          detail: result.detail,
          attempts: result.attempts
        },
        status
      );
    }

    return c.json(result.payload);
  }
);
