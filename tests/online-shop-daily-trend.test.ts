import { describe, expect, it } from "vitest";
import {
  buildOnlineShopDailyTrend,
  type OnlineShopTrendSnapshot
} from "../server/boss-shuju/src/lib/stats/online-shop-daily-trend";

function snapshot(
  platform: "meituan" | "eleme",
  statDateKey: string,
  count: number,
  capturedAt: string
): OnlineShopTrendSnapshot {
  return { platform, statDateKey, count, capturedAt };
}

describe("online shop daily trend", () => {
  it("uses the latest platform snapshot for each date", () => {
    expect(
      buildOnlineShopDailyTrend([
        snapshot("meituan", "2026-07-01", 1039, "2026-07-01T00:58:47.000Z"),
        snapshot("eleme", "2026-07-01", 581, "2026-07-01T00:58:47.000Z"),
        snapshot("meituan", "2026-07-01", 1039, "2026-07-01T03:50:14.000Z"),
        snapshot("eleme", "2026-07-01", 576, "2026-07-01T03:50:14.000Z")
      ])
    ).toEqual([
      {
        date: "2026-07-01",
        totalCount: 1615,
        meituanCount: 1039,
        elemeCount: 576
      }
    ]);
  });

  it("keeps missing dates as null gaps between the first and last snapshot", () => {
    expect(
      buildOnlineShopDailyTrend([
        snapshot("meituan", "2026-07-04", 1059, "2026-07-04T01:33:42.000Z"),
        snapshot("eleme", "2026-07-04", 587, "2026-07-04T01:33:42.000Z"),
        snapshot("meituan", "2026-07-06", 1057, "2026-07-06T00:58:47.000Z"),
        snapshot("eleme", "2026-07-06", 579, "2026-07-06T00:58:47.000Z")
      ])
    ).toEqual([
      {
        date: "2026-07-04",
        totalCount: 1646,
        meituanCount: 1059,
        elemeCount: 587
      },
      {
        date: "2026-07-05",
        totalCount: null,
        meituanCount: null,
        elemeCount: null
      },
      {
        date: "2026-07-06",
        totalCount: 1636,
        meituanCount: 1057,
        elemeCount: 579
      }
    ]);
  });

  it("does not calculate a total when either platform snapshot is missing", () => {
    expect(
      buildOnlineShopDailyTrend([
        snapshot("meituan", "2026-07-20", 1069, "2026-07-20T02:37:28.000Z")
      ])
    ).toEqual([
      {
        date: "2026-07-20",
        totalCount: null,
        meituanCount: 1069,
        elemeCount: null
      }
    ]);
  });
});
