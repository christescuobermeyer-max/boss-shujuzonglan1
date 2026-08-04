import { describe, expect, it } from "vitest";
import {
  buildRecentSignedTerminationStats,
  resolveRecentSignedTerminationMonth
} from "../server/boss-shuju/src/lib/stats/recent-signed-termination";

describe("recent signed termination stats", () => {
  it("按上月同月签解约加本月同月签解约统计每个运营解约数", () => {
    const result = buildRecentSignedTerminationStats("2026-06", [
      {
        _id: "previous-same-month",
        shopName: "上月签上月解-A",
        merchantId: "1001",
        deliveryPlatform: "美团",
        operatorName: "张三",
        contractSignedDate: new Date("2026-05-10T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-05-20T00:00:00+08:00"),
        terminationCooperationDays: 10
      },
      {
        _id: "current-same-month",
        shopName: "本月签本月解-B",
        merchantId: "1002",
        deliveryPlatform: "饿了么",
        operatorName: "张三",
        contractSignedDate: new Date("2026-06-03T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-06-20T00:00:00+08:00"),
        terminationCooperationDays: 17
      },
      {
        _id: "excluded-operator",
        shopName: "王涛本月签本月解",
        merchantId: "1008",
        deliveryPlatform: "美团",
        operatorName: "王涛",
        contractSignedDate: new Date("2026-06-04T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-06-18T00:00:00+08:00"),
        terminationCooperationDays: 14
      },
      {
        _id: "previous-signed-current-terminated",
        shopName: "上月签本月解-C",
        merchantId: "1003",
        deliveryPlatform: "美团",
        operatorName: "李四",
        contractSignedDate: new Date("2026-05-15T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-06-12T00:00:00+08:00"),
        terminationCooperationDays: 28
      },
      {
        _id: "current-signed-next-terminated",
        shopName: "本月签下月解-D",
        merchantId: "1004",
        deliveryPlatform: "美团",
        operatorName: "王五",
        contractSignedDate: new Date("2026-06-15T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-07-01T00:00:00+08:00"),
        terminationCooperationDays: 16
      },
      {
        _id: "current-active",
        shopName: "本月签未解-E",
        merchantId: "1005",
        deliveryPlatform: "美团",
        operatorName: "赵六",
        contractSignedDate: new Date("2026-06-18T00:00:00+08:00"),
        shopStatus: "正常",
        terminationDate: null,
        terminationCooperationDays: null
      },
      {
        _id: "previous-unassigned-same-month",
        shopName: "上月签上月解-F",
        merchantId: "1006",
        deliveryPlatform: "美团",
        operatorName: "",
        contractSignedDate: new Date("2026-05-12T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-05-22T00:00:00+08:00"),
        terminationCooperationDays: 10
      },
      {
        _id: "outside-signed-month",
        shopName: "非两月签约-G",
        merchantId: "1007",
        deliveryPlatform: "美团",
        operatorName: "钱七",
        contractSignedDate: new Date("2026-04-28T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-06-12T00:00:00+08:00"),
        terminationCooperationDays: 45
      }
    ]);

    expect(result.twoMonthSignedShopCount).toBe(6);
    expect(result.totalTerminatedCount).toBe(3);
    expect(result.operatorStats).toEqual([
      { operatorName: "张三", count: 2, twoMonthSignedShopCount: 2, terminationRate: 1 },
      { operatorName: "未分配", count: 1, twoMonthSignedShopCount: 1, terminationRate: 1 },
      { operatorName: "李四", count: 0, twoMonthSignedShopCount: 1, terminationRate: 0 },
      { operatorName: "王五", count: 0, twoMonthSignedShopCount: 1, terminationRate: 0 },
      { operatorName: "赵六", count: 0, twoMonthSignedShopCount: 1, terminationRate: 0 }
    ]);
    expect(result.shops.map((shop) => shop.shopName)).toEqual([
      "本月签本月解-B",
      "上月签上月解-F",
      "上月签上月解-A"
    ]);
    expect(result.operatorStats.map((item) => item.operatorName)).not.toContain("王涛");
    expect(result.shops.map((shop) => shop.operatorName)).not.toContain("王涛");
  });

  it("拒绝无效 month 参数", () => {
    expect(() => resolveRecentSignedTerminationMonth("2026-13")).toThrow("month 参数无效");
    expect(() => resolveRecentSignedTerminationMonth("2026-6")).toThrow("month 参数无效");
  });
});
