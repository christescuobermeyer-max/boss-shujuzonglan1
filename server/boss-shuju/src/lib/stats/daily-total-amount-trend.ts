import type { DailyTrendSeries } from "./daily-trend-series.js";

export type DailyAmountPoint = {
  date: string;
  value: number;
};

export function buildDailyTotalAmountTrend(series: DailyTrendSeries[]) {
  const totalByDate = new Map<string, number>();

  series.forEach((item) => {
    item.values.forEach((valueItem) => {
      const date = String(valueItem.date ?? "").trim();
      if (!date) return;
      totalByDate.set(date, (totalByDate.get(date) ?? 0) + Number(valueItem.value ?? 0));
    });
  });

  return Array.from(totalByDate.entries())
    .map(([date, value]) => ({
      date,
      value: Number(value.toFixed(2))
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

