import { NextRequest, NextResponse } from "next/server";
import { isMobileRequestAuthenticated } from "@/lib/mobile-auth";
import { connectMongo } from "@/lib/mongodb";
import { getMobileMonthlyStatsPayload } from "@/lib/mobile-monthly-stats-service";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    if (!isMobileRequestAuthenticated(request)) {
      return NextResponse.json(
        { message: "未授权访问", error: "unauthorized" },
        { status: 401 }
      );
    }

    await connectMongo();
    const payload = await getMobileMonthlyStatsPayload(
      request.nextUrl.searchParams.get("month"),
      request.nextUrl.searchParams.get("dept")
    );
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取手机统计失败",
        error: error instanceof Error ? error.message : "unknown_error"
      },
      { status: 500 }
    );
  }
}
