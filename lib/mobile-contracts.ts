export type TrendItem = {
  date?: string;
  name?: string;
  count: number;
};

export type DailyAmountPoint = {
  date: string;
  value: number;
};

export type OnlineShopDailyTrendPoint = {
  date: string;
  totalCount: number | null;
  meituanCount: number | null;
  elemeCount: number | null;
};

export type AllRepaymentTrendResponse = {
  startDate: string | null;
  endDate: string | null;
  points: DailyAmountPoint[];
};

export type DailySummaryRow = {
  date: string;
  dailyPointShopCount: number;
  totalAmount: number;
  meituanAmount: number;
  elemeAmount: number;
  wuhanAmount: number;
};

export type BarChartDatum = {
  label: string;
  value: number;
};

export type RecentSignedTerminationOperatorStat = {
  operatorName: string;
  count: number;
  twoMonthSignedShopCount: number;
  terminationRate: number;
};

export type RecentSignedTerminationStatsResponse = {
  month: string;
  signedMonthRange: { startMonth: string; endMonth: string; startDate: string; endDate: string };
  twoMonthSignedRange: { startMonth: string; endMonth: string; startDate: string; endDate: string };
  totalTerminatedCount: number;
  twoMonthSignedShopCount: number;
  operatorCount: number;
  operatorStats: RecentSignedTerminationOperatorStat[];
  shops: Array<{
    id: string;
    shopName: string;
    merchantId: string;
    deliveryPlatform: string;
    operatorName: string;
    contractSignedDate: string;
    terminationDate: string;
    terminationCooperationDays: number | null;
  }>;
};
