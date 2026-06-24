import type { DailySummaryRow } from "@/lib/stats/daily-summary-rows";
import type { DailyAmountPoint } from "@/lib/stats/daily-total-amount-trend";

export type MobileKpi = {
  label: string;
  value: string;
  accent: "blue" | "green" | "orange" | "teal";
  prominent?: boolean;
};

export type MobileRankItem = {
  name: string;
  value: number;
};

export type MobileDailyRepaymentRow = DailySummaryRow;

export type MobileMonthlyStatsPayload = {
  month: string;
  monthlyShopCount: number;
  wuhanMonthlyPointAmount: number;
  yichangMonthlyPointAmount: number;
  monthlyTerminationCount: number;
  dailyAmountTrend: DailyAmountPoint[];
  dailyRepaymentRows: MobileDailyRepaymentRow[];
  rankings: {
    sales: MobileRankItem[];
    operatorAmount: MobileRankItem[];
    operatorTermination: MobileRankItem[];
  };
};

export type MobileDashboardData = {
  kpis: MobileKpi[];
  totalAmountTrendData: DailyAmountPoint[];
  dailyRepaymentRows: MobileDailyRepaymentRow[];
  rankings: {
    sales: MobileRankItem[];
    operatorAmount: MobileRankItem[];
    operatorTermination: MobileRankItem[];
  };
};

function hasDailyTrendData(item: DailyAmountPoint) {
  return Number(item.value ?? 0) !== 0;
}

function hasDailyRepaymentData(row: MobileDailyRepaymentRow) {
  return (
    Number(row.totalAmount ?? 0) !== 0 ||
    Number(row.meituanAmount ?? 0) !== 0 ||
    Number(row.elemeAmount ?? 0) !== 0 ||
    Number(row.wuhanAmount ?? 0) !== 0 ||
    Number(row.dailyPointShopCount ?? 0) > 0
  );
}

export function formatMobileAmount(value: number) {
  return `¥${Number(value ?? 0).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function getVisibleDailyRepaymentRows(
  rows: MobileDailyRepaymentRow[],
  expanded: boolean
) {
  return expanded ? rows : rows.slice(0, 7);
}

export function buildEmptyMobileMonthlyStats(month: string): MobileMonthlyStatsPayload {
  return {
    month,
    monthlyShopCount: 0,
    wuhanMonthlyPointAmount: 0,
    yichangMonthlyPointAmount: 0,
    monthlyTerminationCount: 0,
    dailyAmountTrend: [],
    dailyRepaymentRows: [],
    rankings: {
      sales: [],
      operatorAmount: [],
      operatorTermination: []
    }
  };
}

export function buildMobileDashboardData(
  payload: MobileMonthlyStatsPayload
): MobileDashboardData {
  return {
    kpis: [
      {
        label: "本月武汉回款",
        value: formatMobileAmount(payload.wuhanMonthlyPointAmount),
        accent: "orange"
      },
      {
        label: "本月宜昌回款",
        value: formatMobileAmount(payload.yichangMonthlyPointAmount),
        accent: "green"
      },
      {
        label: "月总店铺数",
        value: String(Number(payload.monthlyShopCount ?? 0)),
        accent: "blue"
      },
      {
        label: "本月解约数",
        value: String(Number(payload.monthlyTerminationCount ?? 0)),
        accent: "teal"
      }
    ],
    totalAmountTrendData: payload.dailyAmountTrend
      .filter(hasDailyTrendData)
      .sort((left, right) => left.date.localeCompare(right.date)),
    dailyRepaymentRows: payload.dailyRepaymentRows
      .filter(hasDailyRepaymentData)
      .sort((left, right) => right.date.localeCompare(left.date)),
    rankings: payload.rankings
  };
}
