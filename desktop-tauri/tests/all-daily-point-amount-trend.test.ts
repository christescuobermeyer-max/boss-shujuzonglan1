import { describe, expect, it } from "vitest";
import { buildAllDailyPointAmountTrend } from "@/lib/stats/all-daily-point-amount-trend";

describe("all daily point amount trend", () => {
  it("按所有业务日期汇总美团和淘宝闪购每日回款金额并移除最新日期", () => {
    const result = buildAllDailyPointAmountTrend([
      {
        platform: "meituan",
        recordDateKey: "2026-03-31",
        merchantId: "mt-1",
        shopName: "美团店",
        amountValue: 10.2
      },
      {
        platform: "eleme",
        recordDateKey: "2026-04-01",
        merchantId: "el-1",
        shopName: "闪购店",
        amountValue: 20.3
      },
      {
        platform: "meituan",
        recordDateKey: "2026-05-02",
        merchantId: "mt-2",
        shopName: "五月美团店",
        amountValue: 30.4
      },
      {
        platform: "meituan",
        recordDateKey: "2026-05-02",
        merchantId: "mt-2",
        shopName: "五月美团店",
        amountValue: 30.4
      }
    ]);

    expect(result).toEqual([
      { date: "2026-03-31", value: 10.2 },
      { date: "2026-04-01", value: 20.3 }
    ]);
  });

  it("美团优先使用结算周期末日作为趋势日期", () => {
    const result = buildAllDailyPointAmountTrend([
      {
        platform: "meituan",
        recordDateKey: "2026-04-02",
        merchantId: "mt-1",
        shopName: "美团店",
        amountValue: 12,
        rowData: {
          结算周期: "2026-03-30 至 2026-03-31"
        }
      },
      {
        platform: "eleme",
        recordDateKey: "2026-04-03",
        merchantId: "el-latest",
        shopName: "最新闪购店",
        amountValue: 1
      }
    ]);

    expect(result).toEqual([{ date: "2026-03-31", value: 12 }]);
  });

  it("amountValue 为空时从原始行数据提取金额", () => {
    const result = buildAllDailyPointAmountTrend([
      {
        platform: "eleme",
        recordDateKey: "2026-04-03",
        merchantId: "el-1",
        shopName: "闪购店",
        amountValue: null as unknown as number,
        rowData: {
          代运营结算金额: "¥18.6"
        }
      },
      {
        platform: "meituan",
        recordDateKey: "2026-04-04",
        merchantId: "mt-latest",
        shopName: "最新美团店",
        amountValue: 1
      }
    ]);

    expect(result).toEqual([{ date: "2026-04-03", value: 18.6 }]);
  });
});
