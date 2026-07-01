import type { DailySummaryRow } from "@/lib/stats/daily-summary-rows";
import type { DailyAmountPoint } from "@/lib/stats/daily-total-amount-trend";

export type MobileKpi = {
  label: string;
  value: string;
  accent: "blue" | "green" | "orange" | "teal";
  note?: string;
  prominent?: boolean;
};

export type MobileRankItem = {
  name: string;
  value: number;
};

export type MobileDailyRepaymentRow = DailySummaryRow;

export type MobileOnlineShopCounts = {
  latestDate: string;
  totalCount: number;
  meituanCount: number;
  elemeCount: number;
};

export type MobileMonthlyStatsPayload = {
  month: string;
  monthlyShopCount: number;
  monthlyPointAmount: number;
  meituanMonthlyPointAmount: number;
  elemeMonthlyPointAmount: number;
  wuhanMonthlyPointAmount: number;
  yichangMonthlyPointAmount: number;
  monthlyTerminationCount: number;
  onlineShopCounts: MobileOnlineShopCounts;
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

function formatMobileCount(value: number) {
  return Number(value ?? 0).toLocaleString("zh-CN");
}

function formatOnlineShopDateNote(value: string) {
  return `最新数据日期 ${value || "暂无日期"}`;
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
    monthlyPointAmount: 0,
    meituanMonthlyPointAmount: 0,
    elemeMonthlyPointAmount: 0,
    wuhanMonthlyPointAmount: 0,
    yichangMonthlyPointAmount: 0,
    monthlyTerminationCount: 0,
    onlineShopCounts: {
      latestDate: "",
      totalCount: 0,
      meituanCount: 0,
      elemeCount: 0
    },
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
  const onlineShopCounts = payload.onlineShopCounts ?? {
    latestDate: "",
    totalCount: 0,
    meituanCount: 0,
    elemeCount: 0
  };
  const onlineShopDateNote = formatOnlineShopDateNote(onlineShopCounts.latestDate);
  const onlineShopTotalCount = Number(
    onlineShopCounts.totalCount ??
      Number(onlineShopCounts.meituanCount ?? 0) +
        Number(onlineShopCounts.elemeCount ?? 0)
  );
  const monthlyPointAmount = Number(
    payload.monthlyPointAmount ??
      Number(payload.wuhanMonthlyPointAmount ?? 0) +
        Number(payload.yichangMonthlyPointAmount ?? 0)
  );

  return {
    kpis: [
      {
        label: "本月总回款金额",
        value: formatMobileAmount(monthlyPointAmount),
        accent: "blue",
        prominent: true
      },
      {
        label: "美团总回款",
        value: formatMobileAmount(payload.meituanMonthlyPointAmount),
        accent: "orange"
      },
      {
        label: "饿了么总回款",
        value: formatMobileAmount(payload.elemeMonthlyPointAmount),
        accent: "blue"
      },
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
      },
      {
        label: "美团在线店铺数",
        value: `${formatMobileCount(onlineShopCounts.meituanCount)}家`,
        note: onlineShopDateNote,
        accent: "orange"
      },
      {
        label: "饿了么在线店铺数",
        value: `${formatMobileCount(onlineShopCounts.elemeCount)}家`,
        note: onlineShopDateNote,
        accent: "blue"
      },
      {
        label: "总在线店铺数",
        value: `${formatMobileCount(onlineShopTotalCount)}家`,
        note: onlineShopDateNote,
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
