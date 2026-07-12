import { NextRequest, NextResponse } from "next/server";
import { isMobileRequestAuthenticated } from "@/lib/mobile-auth";
import { fetchOpenApiJson } from "@/lib/mobile-open-api-proxy";
import type { WorkflowDailyMonitorPayload } from "@/lib/mobile-work-boards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "hnd1";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (!isMobileRequestAuthenticated(request)) {
    return NextResponse.json(
      { message: "未授权访问", error: "unauthorized" },
      { status: 401 }
    );
  }

  const result = await fetchOpenApiJson<WorkflowDailyMonitorPayload>({
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
    return NextResponse.json(
      {
        message: "获取运营工作进度失败",
        error: result.error,
        upstreamStatus: result.upstreamStatus,
        detail: result.detail,
        attempts: result.attempts
      },
      { status }
    );
  }

  return NextResponse.json(result.payload);
}
