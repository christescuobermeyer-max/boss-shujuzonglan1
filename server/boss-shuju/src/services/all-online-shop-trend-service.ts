import {
  getCachedReportPayload,
  setCachedReportPayload
} from "../lib/report-cache.js";
import type { OnlineShopDailyTrendPoint } from "../lib/stats/online-shop-daily-trend.js";
import { fetchAllOnlineShopTrend } from "../lib/stats/online-shop-trend-service.js";

const CACHE_NAMESPACE = "all-online-shop-trend";
const CACHE_KEY = "all";

export type AllOnlineShopTrendPayload = {
  startDate: string | null;
  endDate: string | null;
  points: OnlineShopDailyTrendPoint[];
};

export function buildAllOnlineShopTrendPayload(
  points: OnlineShopDailyTrendPoint[]
): AllOnlineShopTrendPayload {
  return {
    startDate: points.at(0)?.date ?? null,
    endDate: points.at(-1)?.date ?? null,
    points
  };
}

export async function getAllOnlineShopTrendPayload() {
  const cached = getCachedReportPayload<AllOnlineShopTrendPayload>(
    CACHE_NAMESPACE,
    CACHE_KEY
  );
  if (cached) return cached;

  const points = await fetchAllOnlineShopTrend();
  const payload = buildAllOnlineShopTrendPayload(points);
  setCachedReportPayload(CACHE_NAMESPACE, CACHE_KEY, payload);
  return payload;
}
