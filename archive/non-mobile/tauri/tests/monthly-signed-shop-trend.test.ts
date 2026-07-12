import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildMonthlySignedShopTrend } from "@/lib/stats/monthly-stats-trends";

describe("monthly signed shop trend", () => {
  it("按签约日期筛选并统计本月每日开单趋势", () => {
    const result = buildMonthlySignedShopTrend({
      start: new Date("2026-04-01T00:00:00Z"),
      end: new Date("2026-05-01T00:00:00Z"),
      shops: [
        {
          merchantId: "entry-april-signed-march",
          entryDate: "2026-04-02T00:00:00+08:00",
          contractSignedDate: "2026-03-31T00:00:00+08:00"
        },
        {
          merchantId: "signed-april-entry-may",
          entryDate: "2026-05-02T00:00:00+08:00",
          contractSignedDate: "2026-04-02T00:00:00+08:00"
        },
        {
          merchantId: "signed-april",
          entryDate: "2026-04-08T00:00:00+08:00",
          contractSignedDate: "2026-04-02T00:00:00+08:00"
        },
        {
          merchantId: "signed-may",
          entryDate: "2026-04-10T00:00:00+08:00",
          contractSignedDate: "2026-05-01T00:00:00+08:00"
        },
        {
          merchantId: "missing-signed-date",
          entryDate: "2026-04-03T00:00:00+08:00"
        }
      ]
    });

    expect(result).toEqual([{ date: "2026-04-02", count: 2 }]);
  });

  it("本月每日开单趋势应接入签约日期统计 helper", () => {
    const source = readFileSync(
      join(process.cwd(), "lib", "stats", "monthly-stats-service.ts"),
      "utf8"
    );

    expect(source).toContain("dailyOrderShopTrend: buildMonthlySignedShopTrend({");
    expect(source).not.toContain("dailyOrderShopTrend: buildCountTrendByDate(monthlyShops, (shop) => shop.entryDate)");
  });
});
