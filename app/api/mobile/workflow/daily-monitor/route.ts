import { NextRequest, NextResponse } from "next/server";
import { isMobileRequestAuthenticated } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function getOpenApiConfig() {
  const base = (
    process.env.CHENGSHANG_OPEN_API_BASE || "https://8-136-183-128.sslip.io"
  ).trim().replace(/\/$/, "");
  const token = (
    process.env.CHENGSHANG_OPEN_API_TOKEN || process.env.OPEN_API_TOKEN
  )?.trim();
  return { base, token };
}

async function readJsonResponse(response: Response) {
  const rawBody = await response.text();
  if (!rawBody) return null;
  try {
    return JSON.parse(rawBody);
  } catch {
    return { rawBody };
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isMobileRequestAuthenticated(request)) {
      return NextResponse.json(
        { message: "未授权访问", error: "unauthorized" },
        { status: 401 }
      );
    }

    const { base, token } = getOpenApiConfig();
    if (!token) {
      return NextResponse.json(
        { message: "开放 API Token 未配置", error: "missing_open_api_token" },
        { status: 500 }
      );
    }

    const response = await fetch(`${base}/api/open/workflow/daily-monitor`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          message: "获取运营工作进度失败",
          error: "upstream_error",
          status: response.status,
          detail: payload
        },
        { status: 502 }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取运营工作进度失败",
        error: error instanceof Error ? error.message : "unknown_error"
      },
      { status: 500 }
    );
  }
}
