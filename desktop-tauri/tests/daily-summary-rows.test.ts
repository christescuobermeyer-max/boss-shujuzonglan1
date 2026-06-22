import { describe, expect, it } from "vitest";
import { buildDailySummaryRows } from "@/lib/stats/daily-summary-rows";

describe("daily summary rows", () => {
  it("按日期汇总每日抽点店铺数和平台金额", () => {
    const rows = buildDailySummaryRows({
      dailyOrderShopTrend: [
        { date: "2026-04-01", count: 3 },
        { date: "2026-04-02", count: 2 }
      ],
      meituanDailyPointShopTrend: [
        {
          name: "王涛",
          values: [
            { date: "2026-04-01", value: 2 },
            { date: "2026-04-02", value: 1 }
          ]
        }
      ],
      meituanDailyPointAmountTrend: [
        {
          name: "王涛",
          values: [
            { date: "2026-04-01", value: 18.35 },
            { date: "2026-04-02", value: 9.4 }
          ]
        }
      ],
      elemeDailyPointShopTrend: [
        {
          name: "杨有淇",
          values: [
            { date: "2026-04-01", value: 1 },
            { date: "2026-04-02", value: 3 },
            { date: "2026-04-03", value: 2 }
          ]
        }
      ],
      elemeDailyPointAmountTrend: [
        {
          name: "杨有淇",
          values: [
            { date: "2026-04-01", value: 7.65 },
            { date: "2026-04-02", value: 11.2 },
            { date: "2026-04-03", value: 5.4 }
          ]
        }
      ],
      wuhanDailyPointAmountTrend: [
        {
          name: "武汉",
          values: [
            { date: "2026-04-01", value: 3.2 },
            { date: "2026-04-03", value: 2.1 }
          ]
        }
      ]
    });

    expect(rows).toEqual([
      {
        date: "2026-04-01",
        dailyPointShopCount: 3,
        totalAmount: 26,
        meituanAmount: 18.35,
        elemeAmount: 7.65,
        wuhanAmount: 3.2
      },
      {
        date: "2026-04-02",
        dailyPointShopCount: 4,
        totalAmount: 20.6,
        meituanAmount: 9.4,
        elemeAmount: 11.2,
        wuhanAmount: 0
      },
      {
        date: "2026-04-03",
        dailyPointShopCount: 2,
        totalAmount: 5.4,
        meituanAmount: 0,
        elemeAmount: 5.4,
        wuhanAmount: 2.1
      }
    ]);
  });
});
