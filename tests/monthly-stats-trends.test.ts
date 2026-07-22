import { describe, expect, it } from "vitest";
import {
  buildMonthlySignedShopTrend,
  buildMonthlySignedShopTrendByPlatform
} from "../server/boss-shuju/src/lib/stats/monthly-stats-trends";

describe("monthly signed shop trend", () => {
  it("groups contract dates by Shanghai calendar day on a UTC server", () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = "UTC";

    try {
      const shops = [
        ...Array.from({ length: 34 }, () => ({
          contractSignedDate: new Date("2026-07-12T16:00:00.000Z")
        })),
        ...Array.from({ length: 18 }, () => ({
          contractSignedDate: new Date("2026-07-13T16:00:00.000Z")
        }))
      ];

      expect(
        buildMonthlySignedShopTrend({
          start: new Date("2026-07-01T00:00:00.000Z"),
          end: new Date("2026-08-01T00:00:00.000Z"),
          shops
        })
      ).toEqual([
        { date: "2026-07-13", count: 34 },
        { date: "2026-07-14", count: 18 }
      ]);
    } finally {
      if (previousTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = previousTimezone;
      }
    }
  });

  it("splits signed shops by delivery platform without changing the date scope", () => {
    const shops = [
      {
        contractSignedDate: new Date("2026-07-12T16:00:00.000Z"),
        deliveryPlatform: "美团餐饮"
      },
      {
        contractSignedDate: new Date("2026-07-12T16:00:00.000Z"),
        deliveryPlatform: "饿了么餐饮"
      },
      {
        contractSignedDate: new Date("2026-07-13T16:00:00.000Z"),
        deliveryPlatform: "美团餐饮"
      },
      {
        contractSignedDate: new Date("2026-08-01T16:00:00.000Z"),
        deliveryPlatform: "饿了么餐饮"
      }
    ];

    const result = buildMonthlySignedShopTrendByPlatform({
      start: new Date("2026-07-01T00:00:00.000Z"),
      end: new Date("2026-08-01T00:00:00.000Z"),
      shops
    });
    const totalTrend = buildMonthlySignedShopTrend({
      start: new Date("2026-07-01T00:00:00.000Z"),
      end: new Date("2026-08-01T00:00:00.000Z"),
      shops
    });

    expect(result).toEqual({
      meituan: [
        { date: "2026-07-13", count: 1 },
        { date: "2026-07-14", count: 1 }
      ],
      eleme: [{ date: "2026-07-13", count: 1 }]
    });
    expect(totalTrend).toEqual([
      { date: "2026-07-13", count: 2 },
      { date: "2026-07-14", count: 1 }
    ]);

    totalTrend.forEach((totalItem) => {
      const meituanCount =
        result.meituan.find((item) => item.date === totalItem.date)?.count ?? 0;
      const elemeCount =
        result.eleme.find((item) => item.date === totalItem.date)?.count ?? 0;
      expect(meituanCount + elemeCount).toBe(totalItem.count);
    });
  });
});
