import type {
  BarChartDatum,
  DailyAmountPoint,
  DailySummaryRow,
  PlatformOrderTrendDatum,
  TrendItem
} from "@/lib/mobile-contracts";

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

export type MobileDailyOrderShopTrendByPlatform = {
  meituan: TrendItem[];
  eleme: TrendItem[];
};

export type MobileMonthlyStatsPayload = {
  month: string;
  monthlyShopCount: number;
  monthlyPointAmount: number;
  meituanMonthlyPointAmount: number;
  elemeMonthlyPointAmount: number;
  wuhanMonthlyPointAmount: number;
  yichangMonthlyPointAmount: number;
  onlineShopCounts: MobileOnlineShopCounts;
  dailyAmountTrend: DailyAmountPoint[];
  dailyOrderShopTrend: TrendItem[];
  dailyOrderShopTrendByPlatform?: MobileDailyOrderShopTrendByPlatform;
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
  dailyOrderTrendData: BarChartDatum[];
  dailyOrderPlatformTrendData: PlatformOrderTrendDatum[];
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

function hasDailyOrderTrendData(item: TrendItem) {
  return Number(item.count ?? 0) > 0;
}

export function buildDailyOrderTrendData(items: TrendItem[] | undefined): BarChartDatum[] {
  return (items ?? [])
    .filter(hasDailyOrderTrendData)
    .sort((left, right) => String(left.date ?? "").localeCompare(String(right.date ?? "")))
    .map((item) => ({
      label: String(item.date ?? ""),
      value: Number(item.count ?? 0)
    }));
}

export function buildDailyOrderPlatformTrendData(
  trends: MobileDailyOrderShopTrendByPlatform | undefined
): PlatformOrderTrendDatum[] {
  const valuesByDate = new Map<
    string,
    { meituanValue: number; elemeValue: number }
  >();

  function addPlatformItems(
    platform: "meituanValue" | "elemeValue",
    items: TrendItem[] | undefined
  ) {
    (items ?? []).forEach((item) => {
      const date = String(item.date ?? "").trim();
      const count = Number(item.count ?? 0);
      if (!date || !Number.isFinite(count) || count <= 0) return;

      const current = valuesByDate.get(date) ?? {
        meituanValue: 0,
        elemeValue: 0
      };
      current[platform] += count;
      valuesByDate.set(date, current);
    });
  }

  addPlatformItems("meituanValue", trends?.meituan);
  addPlatformItems("elemeValue", trends?.eleme);

  return Array.from(valuesByDate.entries())
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([label, values]) => ({ label, ...values }));
}

export function buildMonthlyDailyOrderAverage(
  items: TrendItem[] | undefined,
  month: string,
  todayDateKey: string
) {
  const matchedMonth = month.match(/^(\d{4})-(\d{2})$/);
  const matchedToday = todayDateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matchedMonth || !matchedToday) return 0;

  const year = Number(matchedMonth[1]);
  const monthNumber = Number(matchedMonth[2]);
  if (monthNumber < 1 || monthNumber > 12) return 0;

  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const todayMonth = todayDateKey.slice(0, 7);
  const elapsedDays =
    month < todayMonth
      ? daysInMonth
      : month === todayMonth
        ? Math.min(daysInMonth, Math.max(1, Number(matchedToday[3])))
        : 0;
  if (elapsedDays === 0) return 0;

  const totalOrders = (items ?? []).reduce((sum, item) => {
    const count = Number(item.count ?? 0);
    return Number.isFinite(count) ? sum + count : sum;
  }, 0);

  return totalOrders / elapsedDays;
}

export function buildPlatformDailyOrderAverages(
  trends: MobileDailyOrderShopTrendByPlatform | undefined,
  month: string,
  todayDateKey: string
) {
  return {
    meituan: buildMonthlyDailyOrderAverage(
      trends?.meituan,
      month,
      todayDateKey
    ),
    eleme: buildMonthlyDailyOrderAverage(
      trends?.eleme,
      month,
      todayDateKey
    )
  };
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
    onlineShopCounts: {
      latestDate: "",
      totalCount: 0,
      meituanCount: 0,
      elemeCount: 0
    },
    dailyAmountTrend: [],
    dailyOrderShopTrend: [],
    dailyOrderShopTrendByPlatform: {
      meituan: [],
      eleme: []
    },
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
        label: "总在线店铺数",
        value: `${formatMobileCount(onlineShopTotalCount)}家`,
        note: onlineShopDateNote,
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
      }
    ],
    totalAmountTrendData: payload.dailyAmountTrend
      .filter(hasDailyTrendData)
      .sort((left, right) => left.date.localeCompare(right.date)),
    dailyOrderTrendData: buildDailyOrderTrendData(payload.dailyOrderShopTrend),
    dailyOrderPlatformTrendData: buildDailyOrderPlatformTrendData(
      payload.dailyOrderShopTrendByPlatform
    ),
    dailyRepaymentRows: payload.dailyRepaymentRows
      .filter(hasDailyRepaymentData)
      .sort((left, right) => right.date.localeCompare(left.date)),
    rankings: payload.rankings
  };
}
