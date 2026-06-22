import { describe, expect, it } from "vitest";
import { buildDailyPointTrends } from "@/lib/stats/daily-point-trends";

describe("daily point trends", () => {
  it("按运营汇总每日抽点店铺数和金额", () => {
    const result = buildDailyPointTrends({
      month: "2026-04",
      start: new Date("2026-04-01T00:00:00Z"),
      end: new Date("2026-04-03T00:00:00Z"),
      shops: [
        { merchantId: "m1", shopName: "门店A", operatorName: "张三", deliveryPlatform: "美团" },
        { merchantId: "m2", shopName: "门店B", operatorName: "李四", deliveryPlatform: "美团" }
      ],
      details: [
        { platform: "meituan", recordDateKey: "2026-04-01", merchantId: "m1", amountValue: 18.5 },
        { platform: "meituan", recordDateKey: "2026-04-01", merchantId: "m1", amountValue: 20.5 },
        { platform: "meituan", recordDateKey: "2026-04-02", merchantId: "m2", amountValue: 12 }
      ]
    });

    expect(result.shopCountTrend).toEqual([
      {
        name: "李四",
        values: [
          { date: "2026-04-01", value: 0 },
          { date: "2026-04-02", value: 1 }
        ]
      },
      {
        name: "张三",
        values: [
          { date: "2026-04-01", value: 1 },
          { date: "2026-04-02", value: 0 }
        ]
      }
    ]);

    expect(result.totalAmountTrend).toEqual([
      {
        name: "李四",
        values: [
          { date: "2026-04-01", value: 0 },
          { date: "2026-04-02", value: 12 }
        ]
      },
      {
        name: "张三",
        values: [
          { date: "2026-04-01", value: 39 },
          { date: "2026-04-02", value: 0 }
        ]
      }
    ]);
  });

  it("统计当月每日回款时包含截至当月末前已开单的累计店铺", () => {
    const result = buildDailyPointTrends({
      month: "2026-04",
      start: new Date("2026-04-01T00:00:00Z"),
      end: new Date("2026-04-30T00:00:00Z"),
      shops: [
        { merchantId: "m-old", shopName: "三月店", operatorName: "张三" },
        { merchantId: "m-new", shopName: "四月店", operatorName: "李四" }
      ],
      details: [
        { platform: "meituan", recordDateKey: "2026-04-05", merchantId: "m-old", amountValue: 100 },
        { platform: "meituan", recordDateKey: "2026-04-05", merchantId: "m-new", amountValue: 20 }
      ]
    });

    const zhangsan = result.shopCountTrend.find((item) => item.name === "张三");
    const lisi = result.shopCountTrend.find((item) => item.name === "李四");
    const zhangsanAmount = result.totalAmountTrend.find((item) => item.name === "张三");
    const lisiAmount = result.totalAmountTrend.find((item) => item.name === "李四");

    expect(zhangsan?.values.find((item) => item.date === "2026-04-05")?.value).toBe(1);
    expect(lisi?.values.find((item) => item.date === "2026-04-05")?.value).toBe(1);
    expect(zhangsanAmount?.values.find((item) => item.date === "2026-04-05")?.value).toBe(100);
    expect(lisiAmount?.values.find((item) => item.date === "2026-04-05")?.value).toBe(20);
  });

  it("美团跨月回款按结算周期归属到上月最后一天", () => {
    const result = buildDailyPointTrends({
      month: "2026-03",
      start: new Date("2026-03-01T00:00:00Z"),
      end: new Date("2026-04-01T00:00:00Z"),
      shops: [{ merchantId: "m1", shopName: "美团店", operatorName: "张三" }],
      details: [
        {
          platform: "meituan",
          recordDateKey: "2026-04-01",
          recordDate: "2026-04-01",
          merchantId: "m1",
          amountValue: 7.89,
          rowData: {
            日期: "2026-04-01",
            结算周期: "2026-03-31~2026-03-31"
          }
        }
      ]
    });

    const zhangsan = result.shopCountTrend.find((item) => item.name === "张三");
    const zhangsanAmount = result.totalAmountTrend.find((item) => item.name === "张三");

    expect(zhangsan?.values.find((item) => item.date === "2026-03-31")?.value).toBe(1);
    expect(zhangsanAmount?.values.find((item) => item.date === "2026-03-31")?.value).toBe(7.89);
  });

  it("相同商家 ID 在不同平台下按各自运营归属统计", () => {
    const result = buildDailyPointTrends({
      month: "2026-03",
      start: new Date("2026-03-01T00:00:00Z"),
      end: new Date("2026-03-02T00:00:00Z"),
      shops: [
        {
          merchantId: "1001",
          shopName: "同名店",
          operatorName: "王涛",
          deliveryPlatform: "美团"
        },
        {
          merchantId: "1001",
          shopName: "同名店",
          operatorName: "杨有淇",
          deliveryPlatform: "饿了么"
        }
      ],
      details: [
        { platform: "meituan", recordDateKey: "2026-03-01", merchantId: "1001", amountValue: 10 },
        { platform: "eleme", recordDateKey: "2026-03-01", merchantId: "1001", amountValue: 20 }
      ]
    });

    const wangtao = result.totalAmountTrend.find((item) => item.name === "王涛");
    const yangyouqi = result.totalAmountTrend.find((item) => item.name === "杨有淇");

    expect(wangtao?.values).toEqual([{ date: "2026-03-01", value: 10 }]);
    expect(yangyouqi?.values).toEqual([{ date: "2026-03-01", value: 20 }]);
  });
});
