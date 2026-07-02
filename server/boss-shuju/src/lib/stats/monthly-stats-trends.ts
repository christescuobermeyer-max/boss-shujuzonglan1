type TrendDateValue = Date | string | null | undefined;

function toDateKey(date: TrendDateValue) {
  if (!date) return "";
  const parsed = date instanceof Date ? date : new Date(String(date));
  if (Number.isNaN(parsed.getTime())) return "";
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0")
  ].join("-");
}

export function buildCountTrendByDate<T>(
  rows: T[],
  pickDate: (row: T) => TrendDateValue
) {
  const countMap = new Map<string, number>();

  rows.forEach((row) => {
    const dateKey = toDateKey(pickDate(row));
    if (!dateKey) return;
    countMap.set(dateKey, (countMap.get(dateKey) ?? 0) + 1);
  });

  return Array.from(countMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function buildMonthlySignedShopTrend<T extends { contractSignedDate?: TrendDateValue }>(params: {
  start: Date;
  end: Date;
  shops: T[];
}) {
  const startKey = toDateKey(params.start);
  const endKey = toDateKey(params.end);
  const signedShops = params.shops.filter((shop) => {
    const signedDateKey = toDateKey(shop.contractSignedDate);
    return signedDateKey && signedDateKey >= startKey && signedDateKey < endKey;
  });

  return buildCountTrendByDate(signedShops, (shop) => shop.contractSignedDate);
}

export function buildNamedCountTrend<T>(rows: T[], pickName: (row: T) => string) {
  const countMap = new Map<string, number>();

  rows.forEach((row) => {
    const name = pickName(row).trim() || "未分配";
    countMap.set(name, (countMap.get(name) ?? 0) + 1);
  });

  return Array.from(countMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh-CN"));
}

export function buildPlatformTerminationTrend<
  T extends { deliveryPlatform?: string; terminationDate?: Date | string | null }
>(rows: T[], platform: "meituan" | "eleme") {
  const filtered = rows.filter((row) => {
    const deliveryPlatform = String(row.deliveryPlatform ?? "");
    return platform === "eleme"
      ? deliveryPlatform.includes("饿了么")
      : !deliveryPlatform.includes("饿了么");
  });

  return buildCountTrendByDate(filtered, (row) => row.terminationDate ?? null);
}

