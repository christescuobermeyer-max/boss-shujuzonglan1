import type { DailyTrendSeries } from "./daily-trend-series.js";
import type { TrendItem } from "./types.js";

export type DailySummaryRow = {
  date: string;
  dailyPointShopCount: number;
  totalAmount: number;
  meituanAmount: number;
  elemeAmount: number;
  wuhanAmount: number;
};

function roundAmount(value: number) {
  return Number(value.toFixed(2));
}

function buildDateMap(
  dailyOrderShopTrend: TrendItem[],
  trendGroups: DailyTrendSeries[]
) {
  const dateMap = new Map<string, DailySummaryRow>();

  dailyOrderShopTrend.forEach((item) => {
    const date = String(item.date ?? "").trim();
    if (!date) return;
    if (dateMap.has(date)) return;
    dateMap.set(date, {
      date,
      dailyPointShopCount: 0,
      totalAmount: 0,
      meituanAmount: 0,
      elemeAmount: 0,
      wuhanAmount: 0
    });
  });

  trendGroups.forEach((series) => {
    series.values.forEach((item) => {
      const date = String(item.date ?? "").trim();
      if (!date || dateMap.has(date)) return;
      dateMap.set(date, {
        date,
        dailyPointShopCount: 0,
        totalAmount: 0,
        meituanAmount: 0,
        elemeAmount: 0,
        wuhanAmount: 0
      });
    });
  });

  return dateMap;
}

function sumSeriesByDate(series: DailyTrendSeries[]) {
  const totals = new Map<string, number>();

  series.forEach((item) => {
    item.values.forEach((valueItem) => {
      const date = String(valueItem.date ?? "").trim();
      if (!date) return;
      totals.set(date, (totals.get(date) ?? 0) + Number(valueItem.value ?? 0));
    });
  });

  return totals;
}

export function buildDailySummaryRows(params: {
  dailyOrderShopTrend: TrendItem[];
  meituanDailyPointShopTrend: DailyTrendSeries[];
  meituanDailyPointAmountTrend: DailyTrendSeries[];
  elemeDailyPointShopTrend: DailyTrendSeries[];
  elemeDailyPointAmountTrend: DailyTrendSeries[];
  wuhanDailyPointAmountTrend: DailyTrendSeries[];
}) {
  const dateMap = buildDateMap(params.dailyOrderShopTrend, [
    ...params.meituanDailyPointShopTrend,
    ...params.meituanDailyPointAmountTrend,
    ...params.elemeDailyPointShopTrend,
    ...params.elemeDailyPointAmountTrend,
    ...params.wuhanDailyPointAmountTrend
  ]);
  const meituanShopCounts = sumSeriesByDate(params.meituanDailyPointShopTrend);
  const elemeShopCounts = sumSeriesByDate(params.elemeDailyPointShopTrend);
  const meituanAmounts = sumSeriesByDate(params.meituanDailyPointAmountTrend);
  const elemeAmounts = sumSeriesByDate(params.elemeDailyPointAmountTrend);
  const wuhanAmounts = sumSeriesByDate(params.wuhanDailyPointAmountTrend);

  for (const [date, row] of dateMap.entries()) {
    const dailyPointShopCount =
      Number(meituanShopCounts.get(date) ?? 0) +
      Number(elemeShopCounts.get(date) ?? 0);
    const meituanAmount = roundAmount(Number(meituanAmounts.get(date) ?? 0));
    const elemeAmount = roundAmount(Number(elemeAmounts.get(date) ?? 0));

    row.dailyPointShopCount = dailyPointShopCount;
    row.meituanAmount = meituanAmount;
    row.elemeAmount = elemeAmount;
    row.totalAmount = roundAmount(meituanAmount + elemeAmount);
    row.wuhanAmount = roundAmount(Number(wuhanAmounts.get(date) ?? 0));
  }

  return Array.from(dateMap.values()).sort((left, right) =>
    left.date.localeCompare(right.date)
  );
}

