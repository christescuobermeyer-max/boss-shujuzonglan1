import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { getMonthlyStatsPayload } from "@/lib/stats/monthly-stats-service";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    const payload = await getMonthlyStatsPayload(
      request.nextUrl.searchParams.get("month"),
      request.nextUrl.searchParams.get("dept")
    );
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取月度统计失败",
        error: error instanceof Error ? error.message : "unknown_error"
      },
      { status: 500 }
    );
  }
}
