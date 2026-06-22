import { buildDailySummaryRows, type DailySummaryRow } from "@/lib/stats/daily-summary-rows";
import { buildDailyTotalAmountTrend } from "@/lib/stats/daily-total-amount-trend";
import { buildOperatorAmountRanking } from "@/lib/stats/operator-amount-ranking";
import { buildOperatorTerminationRanking } from "@/lib/stats/operator-termination-ranking";
import type { StatsMonthlyPayload, TrendItem } from "@/lib/stats/types";

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

export type MobileDashboardData = {
  kpis: MobileKpi[];
  dailyOrderData: Array<{ label: string; value: number }>;
  totalAmountTrendData: Array<{ date: string; value: number }>;
  dailyRepaymentRows: MobileDailyRepaymentRow[];
  dailyBriefRows: MobileDailyRepaymentRow[];
  exceptionBadge: {
    label: string;
    value: number;
  };
  rankings: {
    sales: MobileRankItem[];
    operatorAmount: MobileRankItem[];
    operatorTermination: MobileRankItem[];
  };
};

function buildTerminationTotal(items: TrendItem[]) {
  return items.reduce((sum, item) => sum + Number(item.count ?? 0), 0);
}

function buildDailyRows(stats: StatsMonthlyPayload) {
  return buildDailySummaryRows({
    dailyOrderShopTrend: stats.dailyOrderShopTrend,
    meituanDailyPointShopTrend: stats.meituanDailyPointShopTrend,
    meituanDailyPointAmountTrend: stats.meituanDailyPointAmountTrend,
    elemeDailyPointShopTrend: stats.elemeDailyPointShopTrend,
    elemeDailyPointAmountTrend: stats.elemeDailyPointAmountTrend,
    wuhanDailyPointAmountTrend: stats.wuhanDailyPointAmountTrend
  }).sort((left, right) => right.date.localeCompare(left.date));
}

function buildSalesRanking(items: TrendItem[]) {
  return items
    .map((item) => ({
      name: String(item.name ?? "").trim() || "未分配",
      value: Number(item.count ?? 0)
    }))
    .filter((item) => item.name !== "未分配")
    .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name, "zh-CN"))
    .slice(0, 5);
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

export function buildMobileDashboardData(stats: StatsMonthlyPayload): MobileDashboardData {
  const dailyRepaymentRows = buildDailyRows(stats);
  const totalAmountTrendData = buildDailyTotalAmountTrend([
    ...stats.meituanDailyPointAmountTrend,
    ...stats.elemeDailyPointAmountTrend
  ]);
  const exceptionCount = stats.salesInvalidSummary.reduce(
    (sum, item) => sum + Number(item.finalShopCount ?? 0),
    0
  );

  return {
    kpis: [
      {
        label: "本月回款总金额",
        value: formatMobileAmount(stats.monthlyPointAmount),
        accent: "green",
        prominent: true
      },
      {
        label: "本月武汉回款",
        value: formatMobileAmount(stats.wuhanMonthlyPointSummary.totalAmount),
        accent: "orange"
      },
      {
        label: "月总店铺数",
        value: String(Number(stats.monthlyShopCount ?? 0)),
        accent: "blue"
      },
      {
        label: "本月解约数",
        value: String(buildTerminationTotal(stats.operatorTerminationTrend)),
        accent: "teal"
      }
    ],
    dailyOrderData: stats.dailyOrderShopTrend.map((item) => ({
      label: String(item.date ?? ""),
      value: Number(item.count ?? 0)
    })),
    totalAmountTrendData,
    dailyRepaymentRows,
    dailyBriefRows: dailyRepaymentRows.slice(0, 3),
    exceptionBadge: {
      label: "异常店铺",
      value: exceptionCount
    },
    rankings: {
      sales: buildSalesRanking(stats.salesShopTrend),
      operatorAmount: buildOperatorAmountRanking({
        meituanDailyPointAmountTrend: stats.meituanDailyPointAmountTrend,
        elemeDailyPointAmountTrend: stats.elemeDailyPointAmountTrend
      }).slice(0, 5),
      operatorTermination: buildOperatorTerminationRanking(
        stats.operatorTerminationTrend
      ).slice(0, 5)
    }
  };
}
