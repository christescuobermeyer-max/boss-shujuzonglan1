import { describe, expect, it } from "vitest";
import { buildLatestOnlineShopSummary } from "../lib/stats/online-shop-latest";

describe("buildLatestOnlineShopSummary", () => {
  it("应始终取最新自然日且同平台取当天最后一次采集", () => {
    const summary = buildLatestOnlineShopSummary([
      {
        platform: "meituan",
        statDateKey: "2026-04-23",
        count: 900,
        capturedAt: "2026-04-23T01:00:00.000Z"
      },
      {
        platform: "meituan",
        statDateKey: "2026-04-24",
        count: 920,
        capturedAt: "2026-04-24T01:00:00.000Z"
      },
      {
        platform: "meituan",
        statDateKey: "2026-04-24",
        count: 925,
        capturedAt: "2026-04-24T04:47:21.000Z"
      },
      {
        platform: "eleme",
        statDateKey: "2026-04-24",
        count: 350,
        capturedAt: "2026-04-24T01:30:00.000Z"
      },
      {
        platform: "eleme",
        statDateKey: "2026-04-24",
        count: 353,
        capturedAt: "2026-04-24T04:47:21.000Z"
      }
    ]);

    expect(summary.latestDate).toBe("2026-04-24");
    expect(summary.totalCount).toBe(1278);
    expect(summary.meituanCount).toBe(925);
    expect(summary.elemeCount).toBe(353);
  });
});
