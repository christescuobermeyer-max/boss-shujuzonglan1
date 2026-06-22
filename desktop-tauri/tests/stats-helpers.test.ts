import { describe, expect, it } from "vitest";
import { buildDailyCountTrendSeries } from "@/lib/stats/daily-trend-series";
import { buildSalesCityShopTrend } from "@/lib/stats/sales-city-trend";

describe("stats helpers", () => {
  it("补齐每日趋势缺失日期", () => {
    const series = buildDailyCountTrendSeries(
      "美团",
      ["2026-04-01", "2026-04-02", "2026-04-03"],
      [{ date: "2026-04-02", count: 3 }]
    );

    expect(series).toEqual([
      {
        name: "美团",
        values: [
          { date: "2026-04-01", value: 0 },
          { date: "2026-04-02", value: 3 },
          { date: "2026-04-03", value: 0 }
        ]
      }
    ]);
  });

  it("固定输出武汉与宜昌两个城市并补零", () => {
    const trend = buildSalesCityShopTrend([
      { name: "宜昌", count: 8 },
      { name: "武汉", count: 12 },
      { name: "其他", count: 99 }
    ]);

    expect(trend).toEqual([
      { name: "武汉", count: 12 },
      { name: "宜昌", count: 8 }
    ]);
  });
});
