import { describe, expect, it } from "vitest";
import {
  buildRecentSignedTerminationStats,
  resolveRecentSignedTerminationMonth
} from "../server/boss-shuju/src/lib/stats/recent-signed-termination";

describe("recent signed termination stats", () => {
  it("按上月加本月签约范围统计本月解约运营汇总", () => {
    const result = buildRecentSignedTerminationStats("2026-06", [
      {
        _id: "a",
        shopName: "A",
        merchantId: "1001",
        deliveryPlatform: "美团",
        operatorName: "张三",
        contractSignedDate: new Date("2026-05-10T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-06-08T00:00:00+08:00"),
        terminationCooperationDays: 29
      },
      {
        _id: "b",
        shopName: "B",
        merchantId: "1002",
        deliveryPlatform: "饿了么",
        operatorName: "张三",
        contractSignedDate: new Date("2026-06-03T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-06-20T00:00:00+08:00"),
        terminationCooperationDays: 18
      },
      {
        _id: "c",
        shopName: "C",
        merchantId: "1003",
        deliveryPlatform: "美团",
        operatorName: "",
        contractSignedDate: new Date("2026-05-15T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-06-12T00:00:00+08:00"),
        terminationCooperationDays: 28
      },
      {
        _id: "d",
        shopName: "D",
        merchantId: "1004",
        deliveryPlatform: "美团",
        operatorName: "李四",
        contractSignedDate: new Date("2026-04-28T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-06-12T00:00:00+08:00"),
        terminationCooperationDays: 45
      },
      {
        _id: "e",
        shopName: "E",
        merchantId: "1005",
        deliveryPlatform: "饿了么",
        operatorName: "王五",
        contractSignedDate: new Date("2026-05-15T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-07-01T00:00:00+08:00"),
        terminationCooperationDays: 48
      },
      {
        _id: "f",
        shopName: "F",
        merchantId: "1006",
        deliveryPlatform: "美团",
        operatorName: "赵六",
        contractSignedDate: new Date("2026-06-15T00:00:00+08:00"),
        shopStatus: "正常",
        terminationDate: null,
        terminationCooperationDays: null
      }
    ]);

    expect(result.twoMonthSignedShopCount).toBe(5);
    expect(result.totalTerminatedCount).toBe(3);
    expect(result.operatorStats).toEqual([
      { operatorName: "张三", count: 2, twoMonthSignedShopCount: 2, terminationRate: 1 },
      { operatorName: "未分配", count: 1, twoMonthSignedShopCount: 1, terminationRate: 1 },
      { operatorName: "王五", count: 0, twoMonthSignedShopCount: 1, terminationRate: 0 },
      { operatorName: "赵六", count: 0, twoMonthSignedShopCount: 1, terminationRate: 0 }
    ]);
    expect(result.shops.map((shop) => shop.shopName)).toEqual(["B", "C", "A"]);
  });

  it("拒绝无效 month 参数", () => {
    expect(() => resolveRecentSignedTerminationMonth("2026-13")).toThrow("month 参数无效");
    expect(() => resolveRecentSignedTerminationMonth("2026-6")).toThrow("month 参数无效");
  });
});
