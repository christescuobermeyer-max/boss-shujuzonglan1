import { describe, expect, it } from "vitest";
import {
  buildMobileDashboardData,
  formatMobileAmount,
  getVisibleDailyRepaymentRows,
  type MobileMonthlyStatsPayload
} from "@/lib/mobile-dashboard";

function buildDailyRow(date: string, totalAmount: number) {
  return {
    date,
    dailyPointShopCount: totalAmount === 0 ? 0 : 2,
    totalAmount,
    meituanAmount: totalAmount,
    elemeAmount: 0,
    wuhanAmount: totalAmount === 0 ? 0 : 50
  };
}

function buildPayloadFixture(): MobileMonthlyStatsPayload {
  return {
    month: "2026-04",
    monthlyShopCount: 28,
    monthlyPointAmount: 123456.78,
    wuhanMonthlyPointAmount: 45678.9,
    yichangMonthlyPointAmount: 77777.88,
    monthlyTerminationCount: 25,
    onlineShopCounts: {
      latestDate: "2026-06-23",
      meituanCount: 108,
      elemeCount: 72
    },
    dailyAmountTrend: [
      { date: "2026-04-01", value: 0 },
      { date: "2026-04-02", value: 110 },
      { date: "2026-04-03", value: 0 },
      { date: "2026-04-04", value: 220 },
      { date: "2026-04-05", value: 330 },
      { date: "2026-04-06", value: 440 },
      { date: "2026-04-07", value: 550 },
      { date: "2026-04-08", value: 660 },
      { date: "2026-04-09", value: 770 },
      { date: "2026-04-10", value: 880 }
    ],
    dailyRepaymentRows: [
      buildDailyRow("2026-04-01", 0),
      buildDailyRow("2026-04-02", 110),
      buildDailyRow("2026-04-03", 0),
      buildDailyRow("2026-04-04", 220),
      buildDailyRow("2026-04-05", 330),
      buildDailyRow("2026-04-06", 440),
      buildDailyRow("2026-04-07", 550),
      buildDailyRow("2026-04-08", 660),
      buildDailyRow("2026-04-09", 770),
      buildDailyRow("2026-04-10", 880)
    ],
    rankings: {
      sales: [
        { name: "销售1", value: 18 },
        { name: "销售2", value: 12 },
        { name: "销售3", value: 11 },
        { name: "销售4", value: 9 },
        { name: "销售5", value: 8 },
        { name: "销售6", value: 6 }
      ],
      operatorAmount: Array.from({ length: 9 }, (_, index) => ({
        name: `运营${index + 1}`,
        value: 900 - index
      })),
      operatorTermination: Array.from({ length: 9 }, (_, index) => ({
        name: `解约运营${index + 1}`,
        value: 20 - index
      }))
    }
  };
}

describe("mobile dashboard data", () => {
  it("builds the selected boss KPI cards from the mobile payload", () => {
    const data = buildMobileDashboardData(buildPayloadFixture());

    expect(data.kpis.map((item) => item.label)).toEqual([
      "本月总回款金额",
      "本月武汉回款",
      "本月宜昌回款",
      "月总店铺数",
      "本月解约数",
      "美团在线店铺数",
      "饿了么在线店铺数"
    ]);
    expect(data.kpis[0].value).toBe("¥123,456.78");
    expect(data.kpis[0].prominent).toBe(true);
    expect(data.kpis[1].value).toBe("¥45,678.90");
    expect(data.kpis[2].value).toBe("¥77,777.88");
    expect(data.kpis[3].value).toBe("28");
    expect(data.kpis[4].value).toBe("25");
    expect(data.kpis[5].value).toBe("108家");
    expect(data.kpis[5].note).toBe("最新数据日期 2026-06-23");
    expect(data.kpis[6].value).toBe("72家");
    expect(data.kpis[6].note).toBe("最新数据日期 2026-06-23");
  });

  it("keeps only daily repayment dates that have data", () => {
    const data = buildMobileDashboardData(buildPayloadFixture());

    expect(data.totalAmountTrendData.map((item) => item.date)).toEqual([
      "2026-04-02",
      "2026-04-04",
      "2026-04-05",
      "2026-04-06",
      "2026-04-07",
      "2026-04-08",
      "2026-04-09",
      "2026-04-10"
    ]);
    expect(data.dailyRepaymentRows.map((row) => row.date)).toEqual([
      "2026-04-10",
      "2026-04-09",
      "2026-04-08",
      "2026-04-07",
      "2026-04-06",
      "2026-04-05",
      "2026-04-04",
      "2026-04-02"
    ]);
    expect(getVisibleDailyRepaymentRows(data.dailyRepaymentRows, false)).toHaveLength(7);
    expect(getVisibleDailyRepaymentRows(data.dailyRepaymentRows, true)).toHaveLength(8);
  });

  it("keeps all sales, operator amount, and termination ranking rows", () => {
    const data = buildMobileDashboardData(buildPayloadFixture());

    expect(data.rankings.sales).toHaveLength(6);
    expect(data.rankings.operatorAmount).toHaveLength(9);
    expect(data.rankings.operatorTermination).toHaveLength(9);
  });

  it("does not expose unselected mobile sections in dashboard data", () => {
    const data = buildMobileDashboardData(buildPayloadFixture());

    expect(data).not.toHaveProperty("dailyOrderData");
    expect(data).not.toHaveProperty("dailyBriefRows");
    expect(data).not.toHaveProperty("exceptionBadge");
  });

  it("formats mobile amounts consistently", () => {
    expect(formatMobileAmount(1234.5)).toBe("¥1,234.50");
    expect(formatMobileAmount(0)).toBe("¥0.00");
  });
});
