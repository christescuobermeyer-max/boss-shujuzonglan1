import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as serviceModule from "../server/boss-shuju/src/services/all-online-shop-trend-service";

type BuildPayload = (
  points: Array<{
    date: string;
    totalCount: number | null;
    meituanCount: number | null;
    elemeCount: number | null;
  }>
) => {
  startDate: string | null;
  endDate: string | null;
  points: Array<{ date: string }>;
};

const buildAllOnlineShopTrendPayload = (
  serviceModule as typeof serviceModule & {
    buildAllOnlineShopTrendPayload?: BuildPayload;
  }
).buildAllOnlineShopTrendPayload;

describe("all online shop trend backend", () => {
  it("builds null bounds for empty data", () => {
    expect(buildAllOnlineShopTrendPayload).toBeTypeOf("function");
    expect(buildAllOnlineShopTrendPayload?.([])).toEqual({
      startDate: null,
      endDate: null,
      points: []
    });
  });

  it("uses the first and last points as the response bounds", () => {
    const points = [
      { date: "2026-04-24", totalCount: 1300, meituanCount: 930, elemeCount: 370 },
      { date: "2026-04-25", totalCount: null, meituanCount: null, elemeCount: null },
      { date: "2026-07-20", totalCount: 1670, meituanCount: 1069, elemeCount: 601 }
    ];

    expect(buildAllOnlineShopTrendPayload?.(points)).toEqual({
      startDate: "2026-04-24",
      endDate: "2026-07-20",
      points
    });
  });

  it("provides a dedicated cached all-history service", () => {
    const path = join(
      process.cwd(),
      "server",
      "boss-shuju",
      "src",
      "services",
      "all-online-shop-trend-service.ts"
    );
    expect(existsSync(path)).toBe(true);

    const source = readFileSync(path, "utf8");
    expect(source).toContain('const CACHE_NAMESPACE = "all-online-shop-trend"');
    expect(source).toContain("fetchAllOnlineShopTrend()");
  });

  it("registers an authenticated all-history route", () => {
    const source = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "routes", "mobile-stats.ts"),
      "utf8"
    );

    expect(source).toMatch(
      /mobileStatsRoute\.get\(\s*"\/api\/mobile\/stats\/online-shop-trend\/all"\s*,\s*mobileAuthMiddleware/
    );
    expect(source).toContain("getAllOnlineShopTrendPayload");
    expect(source).toContain("获取全部日期在线店铺趋势失败");
  });
});
