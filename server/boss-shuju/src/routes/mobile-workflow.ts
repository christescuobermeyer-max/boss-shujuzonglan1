import { Hono } from "hono";
import { mobileAuthMiddleware } from "../middleware/auth.js";
import { fetchOpenApiJson } from "../services/open-api-client.js";

export const mobileWorkflowRoute = new Hono();

mobileWorkflowRoute.get(
  "/api/mobile/workflow/daily-monitor",
  mobileAuthMiddleware,
  async (c) => {
    const result = await fetchOpenApiJson({
      path: "/api/open/workflow/daily-monitor",
      logLabel: "mobile workflow"
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
          message: "获取运营工作进度失败",
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
