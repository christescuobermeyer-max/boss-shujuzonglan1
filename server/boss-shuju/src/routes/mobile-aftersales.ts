import { Hono } from "hono";
import { mobileAuthMiddleware } from "../middleware/auth.js";
import { fetchOpenApiJson } from "../services/open-api-client.js";

export const mobileAftersalesRoute = new Hono();

const CHARGE_STATS_QUERY_KEYS = [
  "type",
  "period",
  "month",
  "date",
  "page",
  "pageSize"
] as const;

function getOpenApiProxyStatus(error: string) {
  return error === "missing_open_api_token"
    ? 500
    : error === "upstream_error"
      ? 502
      : 504;
}

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
      return c.json(
        {
          message: "获取售后每日工作失败",
          error: result.error,
          upstreamStatus: result.upstreamStatus,
          detail: result.detail,
          attempts: result.attempts
        },
        getOpenApiProxyStatus(result.error)
      );
    }

    return c.json(result.payload);
  }
);

mobileAftersalesRoute.get(
  "/api/mobile/aftersales/charge-stats",
  mobileAuthMiddleware,
  async (c) => {
    const searchParams = new URLSearchParams();
    for (const key of CHARGE_STATS_QUERY_KEYS) {
      const value = c.req.query(key) ?? "";
      if (value) searchParams.set(key, value);
    }

    const result = await fetchOpenApiJson({
      path: "/api/open/aftersales/charge-stats",
      query: searchParams.toString(),
      logLabel: "mobile aftersales charge stats"
    });

    if (!result.ok) {
      return c.json(
        {
          message: "获取售后收费统计失败",
          error: result.error,
          upstreamStatus: result.upstreamStatus,
          detail: result.detail,
          attempts: result.attempts
        },
        getOpenApiProxyStatus(result.error)
      );
    }

    return c.json(result.payload);
  }
);
