type DailyTrendSeries = {
  name: string;
  values: Array<{ date: string; value: number }>;
};

export function buildOperatorAmountRanking(params: {
  meituanDailyPointAmountTrend: DailyTrendSeries[];
  elemeDailyPointAmountTrend: DailyTrendSeries[];
}) {
  const amountByOperator = new Map<string, number>();

  [...params.meituanDailyPointAmountTrend, ...params.elemeDailyPointAmountTrend].forEach(
    (series) => {
      const name = String(series.name ?? "").trim() || "未分配";
      if (name === "未分配") {
        return;
      }

      const total = series.values.reduce(
        (sum, item) => sum + Number(item.value ?? 0),
        0
      );

      amountByOperator.set(
        name,
        Number(((amountByOperator.get(name) ?? 0) + total).toFixed(2))
      );
    }
  );

  return Array.from(amountByOperator.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "zh-CN"))
    .slice(0, 8);
}
