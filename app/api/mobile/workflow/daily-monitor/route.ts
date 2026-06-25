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

async function readUpstreamResponse(response: Response) {
  const rawBody = await response.text();
  if (!rawBody) return { payload: null, rawBody };
  try {
    return { payload: JSON.parse(rawBody), rawBody };
  } catch {
    return { payload: { rawBody }, rawBody };
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
      console.error("mobile workflow open api token missing", {
        base,
        tokenConfigured: false
      });
      return NextResponse.json(
        { message: "开放 API Token 未配置", error: "missing_open_api_token" },
        { status: 500 }
      );
    }

    const upstreamUrl = `${base}/api/open/workflow/daily-monitor`;
    const response = await fetch(upstreamUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    const { payload, rawBody } = await readUpstreamResponse(response);

    if (!response.ok) {
      console.error("mobile workflow open api upstream error", {
        upstreamUrl,
        upstreamStatus: response.status,
        upstreamBodyPreview: rawBody.slice(0, 800),
        tokenConfigured: true,
        tokenLength: token.length
      });
      return NextResponse.json(
        {
          message: "获取运营工作进度失败",
          error: "upstream_error",
          upstreamStatus: response.status,
          detail: payload
        },
        { status: 502 }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("mobile workflow open api proxy exception", {
      message: error instanceof Error ? error.message : "unknown_error",
      name: error instanceof Error ? error.name : "unknown",
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        message: "获取运营工作进度失败",
        error: error instanceof Error ? error.message : "unknown_error"
      },
      { status: 500 }
    );
  }
}
