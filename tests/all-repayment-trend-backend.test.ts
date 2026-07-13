import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as dailyPointMonthlyModule from "../server/boss-shuju/src/lib/stats/daily-point-monthly";
import * as allRepaymentTrendServiceModule from "../server/boss-shuju/src/services/all-repayment-trend-service";

type NormalizeAllDailyPointAmountTrend = (
  rows: Array<{ date?: unknown; value?: unknown }>
) => Array<{ date: string; value: number }>;

type BuildAllRepaymentTrendPayload = (
  points: Array<{ date: string; value: number }>
) => {
  startDate: string | null;
  endDate: string | null;
  points: Array<{ date: string; value: number }>;
};

const buildAllRepaymentTrendPayload = (
  allRepaymentTrendServiceModule as typeof allRepaymentTrendServiceModule & {
    buildAllRepaymentTrendPayload?: BuildAllRepaymentTrendPayload;
  }
).buildAllRepaymentTrendPayload;

describe("all repayment trend backend", () => {
  it("normalizes, sorts, merges matching dates, and removes the latest date", () => {
    const normalizeAllDailyPointAmountTrend = (
      dailyPointMonthlyModule as typeof dailyPointMonthlyModule & {
        normalizeAllDailyPointAmountTrend?: NormalizeAllDailyPointAmountTrend;
      }
    ).normalizeAllDailyPointAmountTrend;

    expect(normalizeAllDailyPointAmountTrend).toBeTypeOf("function");
    expect(
      normalizeAllDailyPointAmountTrend?.([
        { date: "2026-07-12", value: 100 },
        { date: "2026/07/10", value: 30.126 },
        { date: "2026-07-11", value: 40 },
        { date: "2026-07-10", value: 9.874 },
        { date: "", value: 999 }
      ])
    ).toEqual([
      { date: "2026-07-10", value: 40 },
      { date: "2026-07-11", value: 40 }
    ]);
  });

  it("provides a dedicated all repayment trend service", () => {
    expect(
      existsSync(
        join(
          process.cwd(),
          "server",
          "boss-shuju",
          "src",
          "services",
          "all-repayment-trend-service.ts"
        )
      )
    ).toBe(true);
  });

  it("builds null bounds for empty data", () => {
    expect(buildAllRepaymentTrendPayload).toBeTypeOf("function");
    expect(buildAllRepaymentTrendPayload?.([])).toEqual({
      startDate: null,
      endDate: null,
      points: []
    });
  });

  it("uses the first and last sorted points as response bounds", () => {
    const points = [
      { date: "2025-01-27", value: 299.92 },
      { date: "2026-07-11", value: 5237.58 }
    ];

    expect(buildAllRepaymentTrendPayload).toBeTypeOf("function");
    expect(buildAllRepaymentTrendPayload?.(points)).toEqual({
      startDate: "2025-01-27",
      endDate: "2026-07-11",
      points
    });
  });

  it("uses an isolated three-minute report cache", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "server",
        "boss-shuju",
        "src",
        "services",
        "all-repayment-trend-service.ts"
      ),
      "utf8"
    );

    expect(source).toContain('const CACHE_NAMESPACE = "all-repayment-trend"');
    expect(source).toContain('const CACHE_KEY = "all"');
    expect(source).toContain("getCachedReportPayload<AllRepaymentTrendPayload>");
    expect(source).toContain("fetchAllDailyPointAmountTrend()");
    expect(source).toContain(
      "setCachedReportPayload(CACHE_NAMESPACE, CACHE_KEY, payload)"
    );
  });
});
