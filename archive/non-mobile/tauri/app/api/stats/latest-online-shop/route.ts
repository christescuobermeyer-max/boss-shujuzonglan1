import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { getLatestOnlineShopSummary } from "@/lib/stats/latest-online-shop-service";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    await connectMongo();
    const payload = await getLatestOnlineShopSummary();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取最新在线店铺数失败",
        error: error instanceof Error ? error.message : "unknown_error"
      },
      { status: 500 }
    );
  }
}
