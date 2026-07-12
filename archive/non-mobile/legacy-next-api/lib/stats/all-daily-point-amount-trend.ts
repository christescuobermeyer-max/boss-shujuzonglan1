import {
  extractDailyPointAmount,
  normalizeText,
  type DailyPointPlatform
} from "@/lib/daily-point-derived";
import { resolveDailyPointBusinessDateKey } from "@/lib/stats/daily-point-business-date";
import type { DailyAmountPoint } from "@/lib/stats/daily-total-amount-trend";
import type { DailyPointDerivedRow } from "@/lib/stats/types";

function isDailyPointPlatform(value: string): value is DailyPointPlatform {
  return value === "meituan" || value === "eleme";
}

function resolveAmount(detail: DailyPointDerivedRow) {
  if (detail.amountValue !== null && detail.amountValue !== undefined) {
    const amount = Number(detail.amountValue);
    if (Number.isFinite(amount)) {
      return amount;
    }
  }

  const platform = normalizeText(detail.platform);
  if (!isDailyPointPlatform(platform)) {
    return 0;
  }

  return extractDailyPointAmount(detail.rowData ?? {}, platform);
}

export function buildAllDailyPointAmountTrend(
  details: DailyPointDerivedRow[]
): DailyAmountPoint[] {
  const totalByDate = new Map<string, number>();
  const rowKeys = new Set<string>();

  details.forEach((detail) => {
    const dateKey =
      normalizeText(detail.businessDateKey) ||
      resolveDailyPointBusinessDateKey(detail);
    if (!dateKey) {
      return;
    }

    const amount = resolveAmount(detail);
    const rowKey = [
      normalizeText(detail.platform),
      dateKey,
      normalizeText(detail.merchantId),
      normalizeText(detail.storeId),
      normalizeText(detail.shopName),
      String(amount)
    ].join("|");

    if (rowKeys.has(rowKey)) {
      return;
    }

    rowKeys.add(rowKey);
    totalByDate.set(dateKey, Number(((totalByDate.get(dateKey) ?? 0) + amount).toFixed(2)));
  });

  const points = Array.from(totalByDate.entries())
    .map(([date, value]) => ({
      date,
      value: Number(value.toFixed(2))
    }))
    .sort((left, right) => left.date.localeCompare(right.date));

  return points.slice(0, -1);
}
