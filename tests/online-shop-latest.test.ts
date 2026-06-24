import { describe, expect, it } from "vitest";
import { buildLatestOnlineShopSummary } from "@/lib/stats/online-shop-latest";

describe("latest online shop summary", () => {
  it("uses the newest stat date and latest captured snapshot for each platform", () => {
    const summary = buildLatestOnlineShopSummary([
      {
        platform: "meituan",
        statDateKey: "2026-06-23",
        count: 101,
        capturedAt: "2026-06-23T08:00:00.000Z"
      },
      {
        platform: "meituan",
        statDateKey: "2026-06-23",
        count: 108,
        capturedAt: "2026-06-23T09:00:00.000Z"
      },
      {
        platform: "eleme",
        statDateKey: "2026-06-23",
        count: 72,
        capturedAt: "2026-06-23T09:00:00.000Z"
      },
      {
        platform: "meituan",
        statDateKey: "2026-06-22",
        count: 999,
        capturedAt: "2026-06-22T23:00:00.000Z"
      }
    ]);

    expect(summary).toEqual({
      latestDate: "2026-06-23",
      totalCount: 180,
      meituanCount: 108,
      elemeCount: 72
    });
  });
});
