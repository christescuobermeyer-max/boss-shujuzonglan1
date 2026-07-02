import { resolveSalesCity } from "../sales-city.js";
import { buildDailyPointShopMatcher } from "./daily-point-shop-matcher.js";
import { buildMonthDateKeys } from "./date-keys.js";
import type { DailyTrendSeries } from "./daily-trend-series.js";
import { resolveShopOpenedDate } from "./shop-opened-date.js";

type CityDailyShopRow = {
  contractSignedDate?: Date | string;
  deliveryPlatform?: string;
  entryDate?: Date | string;
  merchantId?: string;
  salesCity?: string;
  salesName?: string;
  shopName?: string;
};

type CityDailyDetailRow = {
  businessDateKey?: string;
  platform?: string;
  recordDate?: string;
  recordDateKey?: string;
  merchantId?: string;
  storeId?: string;
  shopName?: string;
  amountValue?: number;
};

function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function buildCityMonthlyPointAmountTrend(params: {
  cityName: string;
  start: Date;
  end: Date;
  shops: CityDailyShopRow[];
  details: CityDailyDetailRow[];
}): DailyTrendSeries[] {
  const cohortShops = params.shops.filter((shop) => {
    if (resolveSalesCity(shop.salesName, shop.salesCity) !== params.cityName) {
      return false;
    }

    const openedDate = resolveShopOpenedDate(shop);
    if (!openedDate) {
      return false;
    }

    return openedDate < params.end;
  });

  if (cohortShops.length === 0) {
    return [{ name: params.cityName, values: [] }];
  }

  const matcher = buildDailyPointShopMatcher(cohortShops);
  const dateKeys = buildMonthDateKeys(params.start, params.end);
  const totals = new Map<string, number>();
  const rowKeys = new Set<string>();

  params.details.forEach((detail) => {
    if (!matcher.matches(detail)) {
      return;
    }

    const dateKey =
      normalizeText(detail.businessDateKey) ||
      normalizeText(detail.recordDateKey) ||
      normalizeText(detail.recordDate);
    if (!dateKey) {
      return;
    }

    const amount = Number(detail.amountValue ?? 0);
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
    totals.set(dateKey, Number(((totals.get(dateKey) ?? 0) + amount).toFixed(2)));
  });

  return [
    {
      name: params.cityName,
      values: dateKeys.map((date) => ({
        date,
        value: Number((totals.get(date) ?? 0).toFixed(2))
      }))
    }
  ];
}

