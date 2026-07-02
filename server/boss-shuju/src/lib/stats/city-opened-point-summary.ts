import { resolveSalesCity } from "../sales-city.js";
import { buildDailyPointShopMatcher } from "./daily-point-shop-matcher.js";
import { buildMonthlyPointSummary } from "./monthly-point-summary.js";
import { resolveShopOpenedDate } from "./shop-opened-date.js";

type CitySummaryShopRow = {
  contractSignedDate?: Date | string;
  deliveryPlatform?: string;
  entryDate?: Date | string;
  merchantId?: string;
  salesCity?: string;
  salesName?: string;
  shopName?: string;
};

type CitySummaryDetailRow = {
  businessDateKey?: string;
  platform?: string;
  recordDate?: string;
  recordDateKey?: string;
  merchantId?: string;
  storeId?: string;
  shopName?: string;
  amountValue?: number;
};

export function buildCityMonthlyPointSummary(params: {
  cityName: string;
  start: Date;
  end: Date;
  shops: CitySummaryShopRow[];
  meituanDetails: CitySummaryDetailRow[];
  elemeDetails: CitySummaryDetailRow[];
}) {
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
    return {
      cityName: params.cityName,
      cohortShopCount: 0,
      commissionShopCount: 0,
      totalAmount: 0,
      meituanAmount: 0,
      elemeAmount: 0
    };
  }

  const matcher = buildDailyPointShopMatcher(cohortShops);
  const scopedMeituanDetails = params.meituanDetails.filter((detail) => matcher.matches(detail));
  const scopedElemeDetails = params.elemeDetails.filter((detail) => matcher.matches(detail));
  const totalSummary = buildMonthlyPointSummary([
    ...scopedMeituanDetails,
    ...scopedElemeDetails
  ]);
  const meituanSummary = buildMonthlyPointSummary(scopedMeituanDetails);
  const elemeSummary = buildMonthlyPointSummary(scopedElemeDetails);

  return {
    cityName: params.cityName,
    cohortShopCount: cohortShops.length,
    commissionShopCount: totalSummary.commissionShopCount,
    totalAmount: totalSummary.totalAmount,
    meituanAmount: meituanSummary.totalAmount,
    elemeAmount: elemeSummary.totalAmount
  };
}

