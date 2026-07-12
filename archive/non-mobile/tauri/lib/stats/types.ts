import type { DailyTrendSeries } from "@/lib/stats/daily-trend-series";
import type { DailyAmountPoint } from "@/lib/stats/daily-total-amount-trend";
import type { SalesInvalidSummaryItem } from "@/lib/stats/sales-invalid-types";

export type TrendItem = {
  date?: string;
  name?: string;
  count: number;
};

export type ProvinceValueItem = {
  name: string;
  value: number;
};

export type CityMonthlyPointSummary = {
  cityName: string;
  cohortShopCount: number;
  commissionShopCount: number;
  totalAmount: number;
  meituanAmount: number;
  elemeAmount: number;
};

export type StatsMonthlyPayload = {
  month: string;
  monthlyShopCount: number;
  monthlyCommissionShopCount: number;
  monthlyRepaidShopCount: number;
  monthlyPointShopCount: number;
  monthlyPointAmount: number;
  meituanMonthlyPointAmount: number;
  elemeMonthlyPointAmount: number;
  dailyOrderShopTrend: TrendItem[];
  operatorShopTrend: TrendItem[];
  salesShopTrend: TrendItem[];
  salesCityShopTrend: TrendItem[];
  operatorTerminationTrend: TrendItem[];
  provinceDistribution: ProvinceValueItem[];
  salesInvalidSummary: SalesInvalidSummaryItem[];
  wuhanMonthlyPointSummary: CityMonthlyPointSummary;
  yichangMonthlyPointSummary: CityMonthlyPointSummary;
  wuhanDailyPointAmountTrend: DailyTrendSeries[];
  meituanDailyTerminationShopTrend: DailyTrendSeries[];
  elemeDailyTerminationShopTrend: DailyTrendSeries[];
  meituanDailyPointShopTrend: DailyTrendSeries[];
  meituanDailyPointAmountTrend: DailyTrendSeries[];
  elemeDailyPointShopTrend: DailyTrendSeries[];
  elemeDailyPointAmountTrend: DailyTrendSeries[];
  allDailyPointAmountTrend: DailyAmountPoint[];
};

export type ShopLite = {
  deliveryPlatform?: string;
  merchantId?: string;
  shopName?: string;
  operatorName?: string;
};

export type DailyPointDerivedRow = {
  _id?: unknown;
  businessDateKey?: string;
  platform?: string;
  recordDate?: string;
  recordDateKey?: string;
  merchantId?: string;
  storeId?: string;
  shopName?: string;
  amountValue?: number;
  rowData?: Record<string, unknown>;
};
