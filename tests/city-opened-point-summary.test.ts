import { describe, expect, it } from "vitest";
import { buildCityMonthlyPointSummary } from "@/lib/stats/city-opened-point-summary";

describe("city opened point summary", () => {
  it("按城市和累计开单 cohort 汇总本月抽点店铺数与平台回款金额", () => {
    const result = buildCityMonthlyPointSummary({
      cityName: "武汉",
      start: new Date("2026-04-01T00:00:00+08:00"),
      end: new Date("2026-05-01T00:00:00+08:00"),
      shops: [
        {
          shopName: "武汉美团店",
          merchantId: "mt-1",
          deliveryPlatform: "美团",
          salesName: "李帅",
          salesCity: "武汉",
          entryDate: "2026-04-02T00:00:00+08:00"
        },
        {
          shopName: "武汉饿了么店",
          merchantId: "el-1",
          deliveryPlatform: "饿了么",
          salesName: "屈维涛",
          salesCity: "武汉",
          entryDate: "2026-04-03T00:00:00+08:00"
        },
        {
          shopName: "武汉老店",
          merchantId: "mt-old",
          deliveryPlatform: "美团",
          salesName: "李帅",
          salesCity: "武汉",
          entryDate: "2026-03-20T00:00:00+08:00"
        },
        {
          shopName: "武汉更早老店",
          merchantId: "mt-too-old",
          deliveryPlatform: "美团",
          salesName: "李帅",
          salesCity: "武汉",
          entryDate: "2026-02-20T00:00:00+08:00"
        },
        {
          shopName: "宜昌美团店",
          merchantId: "yc-1",
          deliveryPlatform: "美团",
          salesName: "任意",
          salesCity: "宜昌",
          entryDate: "2026-04-02T00:00:00+08:00"
        }
      ],
      meituanDetails: [
        {
          platform: "meituan",
          businessDateKey: "2026-04-05",
          merchantId: "mt-1",
          shopName: "武汉美团店",
          amountValue: 20
        },
        {
          platform: "meituan",
          businessDateKey: "2026-04-05",
          merchantId: "mt-1",
          shopName: "武汉美团店",
          amountValue: 20
        },
        {
          platform: "meituan",
          businessDateKey: "2026-04-06",
          merchantId: "mt-old",
          shopName: "武汉老店",
          amountValue: 30
        },
        {
          platform: "meituan",
          businessDateKey: "2026-04-06",
          merchantId: "mt-too-old",
          shopName: "武汉更早老店",
          amountValue: 12
        },
        {
          platform: "meituan",
          businessDateKey: "2026-04-06",
          merchantId: "yc-1",
          shopName: "宜昌美团店",
          amountValue: 40
        }
      ],
      elemeDetails: [
        {
          platform: "eleme",
          businessDateKey: "2026-04-07",
          merchantId: "el-1",
          shopName: "武汉饿了么店",
          amountValue: 5
        }
      ]
    });

    expect(result).toEqual({
      cityName: "武汉",
      cohortShopCount: 4,
      commissionShopCount: 4,
      totalAmount: 67,
      meituanAmount: 62,
      elemeAmount: 5
    });
  });
});
