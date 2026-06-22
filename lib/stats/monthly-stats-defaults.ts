import type { StatsMonthlyPayload } from "@/lib/stats/types";

export function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function buildEmptyMonthlyStats(month: string): StatsMonthlyPayload {
  return {
    month,
    monthlyShopCount: 0,
    monthlyCommissionShopCount: 0,
    monthlyRepaidShopCount: 0,
    monthlyPointShopCount: 0,
    monthlyPointAmount: 0,
    meituanMonthlyPointAmount: 0,
    elemeMonthlyPointAmount: 0,
    dailyOrderShopTrend: [],
    operatorShopTrend: [],
    salesShopTrend: [],
    salesCityShopTrend: [],
    operatorTerminationTrend: [],
    provinceDistribution: [],
    salesInvalidSummary: [],
    wuhanMonthlyPointSummary: {
      cityName: "武汉",
      cohortShopCount: 0,
      commissionShopCount: 0,
      totalAmount: 0,
      meituanAmount: 0,
      elemeAmount: 0
    },
    wuhanDailyPointAmountTrend: [],
    meituanDailyTerminationShopTrend: [],
    elemeDailyTerminationShopTrend: [],
    meituanDailyPointShopTrend: [],
    meituanDailyPointAmountTrend: [],
    elemeDailyPointShopTrend: [],
    elemeDailyPointAmountTrend: [],
    allDailyPointAmountTrend: []
  };
}
