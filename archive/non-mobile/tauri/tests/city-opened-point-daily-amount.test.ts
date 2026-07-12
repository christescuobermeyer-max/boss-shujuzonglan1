import { describe, expect, it } from "vitest";
import { buildCityMonthlyPointAmountTrend } from "@/lib/stats/city-opened-point-daily-amount";

describe("city opened point daily amount", () => {
  it("按城市和累计开单 cohort 生成本月逐日回款金额", () => {
    const result = buildCityMonthlyPointAmountTrend({
      cityName: "武汉",
      start: new Date("2026-04-01T00:00:00+08:00"),
      end: new Date("2026-05-01T00:00:00+08:00"),
      shops: [
        {
          shopName: "武汉四月店",
          merchantId: "mt-apr",
          deliveryPlatform: "美团",
          salesName: "李帅",
          salesCity: "武汉",
          entryDate: "2026-04-02T00:00:00+08:00"
        },
        {
          shopName: "武汉三月店",
          merchantId: "mt-mar",
          deliveryPlatform: "美团",
          salesName: "李帅",
          salesCity: "武汉",
          entryDate: "2026-03-18T00:00:00+08:00"
        },
        {
          shopName: "武汉二月店",
          merchantId: "mt-feb",
          deliveryPlatform: "美团",
          salesName: "李帅",
          salesCity: "武汉",
          entryDate: "2026-02-18T00:00:00+08:00"
        }
      ],
      details: [
        {
          platform: "meituan",
          businessDateKey: "2026-04-08",
          merchantId: "mt-apr",
          shopName: "武汉四月店",
          amountValue: 12
        },
        {
          platform: "meituan",
          businessDateKey: "2026-04-08",
          merchantId: "mt-mar",
          shopName: "武汉三月店",
          amountValue: 9
        },
        {
          platform: "meituan",
          businessDateKey: "2026-04-08",
          merchantId: "mt-feb",
          shopName: "武汉二月店",
          amountValue: 7
        }
      ]
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("武汉");
    expect(result[0]?.values.find((item) => item.date === "2026-04-08")).toEqual({
      date: "2026-04-08",
      value: 28
    });
  });
});
