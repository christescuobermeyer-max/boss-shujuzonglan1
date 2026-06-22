import { normalizeText } from "@/lib/daily-point-derived";
import { resolveDailyPointBusinessDateKey } from "@/lib/stats/daily-point-business-date";
import { buildDailyPointShopMatcher } from "@/lib/stats/daily-point-shop-matcher";
import { buildMonthDateKeys } from "@/lib/stats/date-keys";
import type { DailyTrendSeries } from "@/lib/stats/daily-trend-series";

type ShopLite = {
  deliveryPlatform?: string;
  merchantId?: string;
  shopName?: string;
  operatorName?: string;
};

type DailyPointDetailLite = {
  businessDateKey?: string;
  platform?: string;
  recordDate?: string;
  recordDateKey?: string;
  merchantId?: string;
  storeId?: string;
  shopName?: string;
  amountValue?: number;
  rowData?: Record<string, unknown>;
};

type BuildDailyPointTrendsParams = {
  month: string;
  start: Date;
  end: Date;
  shops: ShopLite[];
  details: DailyPointDetailLite[];
};

export function buildDailyPointTrends(params: BuildDailyPointTrendsParams) {
  const shopMatcher = buildDailyPointShopMatcher(params.shops);
  const dateKeys = buildMonthDateKeys(params.start, params.end);
  const allowedDates = new Set(dateKeys);
  const operatorDaily = new Map<
    string,
    Map<string, { rowKeys: Set<string>; shopKeys: Set<string>; totalAmount: number }>
  >();

  params.details.forEach((detail) => {
    const dateKey =
      normalizeText(detail.businessDateKey) ||
      resolveDailyPointBusinessDateKey(detail);
    if (!dateKey || !allowedDates.has(dateKey) || !dateKey.startsWith(params.month)) {
      return;
    }

    const merchantId = normalizeText(detail.merchantId);
    const shopName = normalizeText(detail.shopName);
    const storeId = normalizeText(detail.storeId);
    const operator = shopMatcher.resolveOperator(detail);

    if (!operatorDaily.has(operator)) {
      operatorDaily.set(operator, new Map());
    }
    const byDate = operatorDaily.get(operator)!;
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, {
        rowKeys: new Set(),
        shopKeys: new Set(),
        totalAmount: 0
      });
    }

    const uniqueShopKey = storeId || merchantId || shopName || "unknown";
    const amount = Number(detail.amountValue ?? 0);
    const detailPlatform = normalizeText(detail.platform);
    const metric = byDate.get(dateKey)!;
    const rowKey = [
      detailPlatform,
      dateKey,
      merchantId,
      storeId,
      shopName,
      String(amount)
    ].join("|");

    if (!metric.rowKeys.has(rowKey)) {
      metric.totalAmount = Number((metric.totalAmount + amount).toFixed(2));
      metric.rowKeys.add(rowKey);
    }

    if (!metric.shopKeys.has(uniqueShopKey)) {
      metric.shopKeys.add(uniqueShopKey);
    }
  });

  const operators = Array.from(operatorDaily.keys()).sort((a, b) =>
    a.localeCompare(b, "zh-CN")
  );

  const shopCountTrend: DailyTrendSeries[] = operators.map((name) => ({
    name,
    values: dateKeys.map((date) => ({
      date,
      value: operatorDaily.get(name)?.get(date)?.shopKeys.size ?? 0
    }))
  }));

  const totalAmountTrend: DailyTrendSeries[] = operators.map((name) => ({
    name,
    values: dateKeys.map((date) => ({
      date,
      value: Number((operatorDaily.get(name)?.get(date)?.totalAmount ?? 0).toFixed(2))
    }))
  }));

  return { shopCountTrend, totalAmountTrend };
}
