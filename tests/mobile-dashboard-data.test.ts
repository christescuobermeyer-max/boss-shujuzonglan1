import { describe, expect, it } from "vitest";
import {
  buildMobileDashboardData,
  formatMobileAmount,
  getVisibleDailyRepaymentRows
} from "@/lib/mobile-dashboard";
import { buildEmptyMonthlyStats } from "@/lib/stats/monthly-stats-defaults";
import type { StatsMonthlyPayload } from "@/lib/stats/types";

function buildStatsFixture(): StatsMonthlyPayload {
  const stats = buildEmptyMonthlyStats("2026-04");
  return {
    ...stats,
    monthlyShopCount: 28,
    monthlyPointAmount: 123456.78,
    monthlyCommissionShopCount: 18,
    wuhanMonthlyPointSummary: {
      cityName: "武汉",
      cohortShopCount: 12,
      commissionShopCount: 9,
      totalAmount: 45678.9,
      meituanAmount: 30000,
      elemeAmount: 15678.9
    },
    dailyOrderShopTrend: [
      { date: "2026-04-01", count: 1 },
      { date: "2026-04-02", count: 2 },
      { date: "2026-04-03", count: 3 },
      { date: "2026-04-04", count: 4 },
      { date: "2026-04-05", count: 5 },
      { date: "2026-04-06", count: 6 },
      { date: "2026-04-07", count: 7 },
      { date: "2026-04-08", count: 8 }
    ],
    meituanDailyPointShopTrend: [
      {
        name: "美团",
        values: [
          { date: "2026-04-01", value: 1 },
          { date: "2026-04-02", value: 2 },
          { date: "2026-04-03", value: 3 },
          { date: "2026-04-04", value: 4 },
          { date: "2026-04-05", value: 5 },
          { date: "2026-04-06", value: 6 },
          { date: "2026-04-07", value: 7 },
          { date: "2026-04-08", value: 8 }
        ]
      }
    ],
    elemeDailyPointShopTrend: [
      {
        name: "饿了么",
        values: [
          { date: "2026-04-01", value: 1 },
          { date: "2026-04-02", value: 1 },
          { date: "2026-04-03", value: 1 },
          { date: "2026-04-04", value: 1 },
          { date: "2026-04-05", value: 1 },
          { date: "2026-04-06", value: 1 },
          { date: "2026-04-07", value: 1 },
          { date: "2026-04-08", value: 1 }
        ]
      }
    ],
    meituanDailyPointAmountTrend: [
      {
        name: "运营A",
        values: [
          { date: "2026-04-01", value: 100 },
          { date: "2026-04-02", value: 200 },
          { date: "2026-04-03", value: 300 },
          { date: "2026-04-04", value: 400 },
          { date: "2026-04-05", value: 500 },
          { date: "2026-04-06", value: 600 },
          { date: "2026-04-07", value: 700 },
          { date: "2026-04-08", value: 800 }
        ]
      },
      {
        name: "运营B",
        values: [{ date: "2026-04-08", value: 3000 }]
      }
    ],
    elemeDailyPointAmountTrend: [
      {
        name: "运营A",
        values: [
          { date: "2026-04-01", value: 10 },
          { date: "2026-04-02", value: 20 },
          { date: "2026-04-03", value: 30 },
          { date: "2026-04-04", value: 40 },
          { date: "2026-04-05", value: 50 },
          { date: "2026-04-06", value: 60 },
          { date: "2026-04-07", value: 70 },
          { date: "2026-04-08", value: 80 }
        ]
      }
    ],
    wuhanDailyPointAmountTrend: [
      {
        name: "武汉",
        values: [
          { date: "2026-04-01", value: 50 },
          { date: "2026-04-08", value: 500 }
        ]
      }
    ],
    salesShopTrend: [
      { name: "销售6", count: 6 },
      { name: "销售2", count: 12 },
      { name: "销售1", count: 18 },
      { name: "销售5", count: 8 },
      { name: "销售3", count: 11 },
      { name: "销售4", count: 9 }
    ],
    operatorTerminationTrend: [
      { name: "运营A", count: 2 },
      { name: "运营B", count: 6 },
      { name: "运营C", count: 4 },
      { name: "运营D", count: 1 },
      { name: "运营E", count: 3 },
      { name: "运营F", count: 9 }
    ],
    salesInvalidSummary: [
      {
        salesName: "销售1",
        totalSignedShopCount: 5,
        invalidShopCount: 2,
        terminatedWithinDaysCount: 1,
        finalShopCount: 3
      },
      {
        salesName: "销售2",
        totalSignedShopCount: 4,
        invalidShopCount: 1,
        terminatedWithinDaysCount: 0,
        finalShopCount: 1
      }
    ]
  };
}

describe("mobile dashboard data", () => {
  it("builds boss KPIs from the monthly payload", () => {
    const data = buildMobileDashboardData(buildStatsFixture());

    expect(data.kpis.map((item) => item.label)).toEqual([
      "本月回款总金额",
      "本月武汉回款",
      "月总店铺数",
      "本月解约数"
    ]);
    expect(data.kpis[0].value).toBe("¥123,456.78");
    expect(data.kpis[1].value).toBe("¥45,678.90");
    expect(data.kpis[2].value).toBe("28");
    expect(data.kpis[3].value).toBe("25");
  });

  it("sorts daily repayment rows descending and shows the latest 7 by default", () => {
    const data = buildMobileDashboardData(buildStatsFixture());

    expect(data.dailyRepaymentRows.map((row) => row.date)).toEqual([
      "2026-04-08",
      "2026-04-07",
      "2026-04-06",
      "2026-04-05",
      "2026-04-04",
      "2026-04-03",
      "2026-04-02",
      "2026-04-01"
    ]);
    expect(getVisibleDailyRepaymentRows(data.dailyRepaymentRows, false)).toHaveLength(7);
    expect(getVisibleDailyRepaymentRows(data.dailyRepaymentRows, true)).toHaveLength(8);
    expect(data.dailyRepaymentRows[0]).toMatchObject({
      date: "2026-04-08",
      totalAmount: 3880,
      meituanAmount: 3800,
      elemeAmount: 80,
      wuhanAmount: 500,
      dailyPointShopCount: 9
    });
  });

  it("builds mobile top rankings from existing dashboard ranking sources", () => {
    const data = buildMobileDashboardData(buildStatsFixture());

    expect(data.rankings.sales.map((item) => item.name)).toEqual([
      "销售1",
      "销售2",
      "销售3",
      "销售4",
      "销售5"
    ]);
    expect(data.rankings.operatorAmount.map((item) => item.name)).toEqual([
      "运营A",
      "运营B"
    ]);
    expect(data.rankings.operatorTermination.map((item) => item.name)).toEqual([
      "运营F",
      "运营B",
      "运营C",
      "运营E",
      "运营A"
    ]);
  });

  it("builds daily brief rows and an exception badge", () => {
    const data = buildMobileDashboardData(buildStatsFixture());

    expect(data.dailyBriefRows.map((row) => row.date)).toEqual([
      "2026-04-08",
      "2026-04-07",
      "2026-04-06"
    ]);
    expect(data.exceptionBadge).toEqual({
      label: "异常店铺",
      value: 4
    });
  });

  it("handles empty monthly data without synthetic daily rows", () => {
    const data = buildMobileDashboardData(buildEmptyMonthlyStats("2026-04"));

    expect(data.dailyRepaymentRows).toEqual([]);
    expect(data.dailyBriefRows).toEqual([]);
    expect(data.rankings.sales).toEqual([]);
    expect(data.exceptionBadge.value).toBe(0);
  });

  it("formats mobile amounts consistently", () => {
    expect(formatMobileAmount(1234.5)).toBe("¥1,234.50");
    expect(formatMobileAmount(0)).toBe("¥0.00");
  });
});
