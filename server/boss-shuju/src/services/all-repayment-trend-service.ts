import {
  getCachedReportPayload,
  setCachedReportPayload
} from "../lib/report-cache.js";
import { fetchAllDailyPointAmountTrend } from "../lib/stats/daily-point-monthly.js";
import type { DailyAmountPoint } from "../lib/stats/daily-total-amount-trend.js";

const CACHE_NAMESPACE = "all-repayment-trend";
const CACHE_KEY = "all";

export type AllRepaymentTrendPayload = {
  startDate: string | null;
  endDate: string | null;
  points: DailyAmountPoint[];
};

export function buildAllRepaymentTrendPayload(
  points: DailyAmountPoint[]
): AllRepaymentTrendPayload {
  return {
    startDate: points.at(0)?.date ?? null,
    endDate: points.at(-1)?.date ?? null,
    points
  };
}

export async function getAllRepaymentTrendPayload() {
  const cached = getCachedReportPayload<AllRepaymentTrendPayload>(
    CACHE_NAMESPACE,
    CACHE_KEY
  );
  if (cached) return cached;

  const points = await fetchAllDailyPointAmountTrend();
  const payload = buildAllRepaymentTrendPayload(points);
  setCachedReportPayload(CACHE_NAMESPACE, CACHE_KEY, payload);
  return payload;
}
