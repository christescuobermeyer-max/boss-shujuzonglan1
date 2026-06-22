import { filterActiveDailyTrendSeries, filterActiveNamedItems } from "@/lib/stats/employee-employment";
import type { DailyTrendSeries } from "@/lib/stats/daily-trend-series";
import type { SalesInvalidSummaryItem } from "@/lib/stats/sales-invalid-types";
import type { TrendItem } from "@/lib/stats/types";

type EmployeeFilteredMonthlyStatsParams = {
  elemeDailyPointAmountTrend: DailyTrendSeries[];
  elemeDailyPointShopTrend: DailyTrendSeries[];
  meituanDailyPointAmountTrend: DailyTrendSeries[];
  meituanDailyPointShopTrend: DailyTrendSeries[];
  operatorStatusMap: Map<string, string>;
  operatorTerminationTrend: TrendItem[];
  operatorTrend: TrendItem[];
  salesInvalidSummary: SalesInvalidSummaryItem[];
  salesStatusMap: Map<string, string>;
  salesTrend: TrendItem[];
};

export function buildEmployeeFilteredMonthlyStats(
  params: EmployeeFilteredMonthlyStatsParams
) {
  return {
    operatorShopTrend: filterActiveNamedItems(
      params.operatorTrend,
      params.operatorStatusMap,
      (item) => item.name ?? ""
    ),
    salesShopTrend: filterActiveNamedItems(
      params.salesTrend,
      params.salesStatusMap,
      (item) => item.name ?? ""
    ),
    operatorTerminationTrend: filterActiveNamedItems(
      params.operatorTerminationTrend,
      params.operatorStatusMap,
      (item) => item.name ?? ""
    ),
    salesInvalidSummary: filterActiveNamedItems(
      params.salesInvalidSummary,
      params.salesStatusMap,
      (item) => item.salesName
    ),
    meituanDailyPointShopTrend: filterActiveDailyTrendSeries(
      params.meituanDailyPointShopTrend,
      params.operatorStatusMap
    ),
    meituanDailyPointAmountTrend: filterActiveDailyTrendSeries(
      params.meituanDailyPointAmountTrend,
      params.operatorStatusMap
    ),
    elemeDailyPointShopTrend: filterActiveDailyTrendSeries(
      params.elemeDailyPointShopTrend,
      params.operatorStatusMap
    ),
    elemeDailyPointAmountTrend: filterActiveDailyTrendSeries(
      params.elemeDailyPointAmountTrend,
      params.operatorStatusMap
    ),
  };
}
