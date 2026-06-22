import { getCachedReportPayload, setCachedReportPayload } from "@/lib/report-cache";
import { buildAllDailyPointAmountTrend } from "@/lib/stats/all-daily-point-amount-trend";
import { buildCityMonthlyPointAmountTrend } from "@/lib/stats/city-opened-point-daily-amount";
import { buildCityMonthlyPointSummary } from "@/lib/stats/city-opened-point-summary";
import { buildMonthDateKeys } from "@/lib/stats/date-keys";
import { filterDetailsByBusinessMonth } from "@/lib/stats/daily-point-month-scope";
import { getStatsDeptCity, normalizeStatsDept, type StatsDept } from "@/lib/stats/dept";
import { fetchAllDerivedDetails, fetchMonthlyDerivedDetails } from "@/lib/stats/daily-point-monthly";
import { buildDailyPointTrends } from "@/lib/stats/daily-point-trends";
import { buildDailyCountTrendSeries } from "@/lib/stats/daily-trend-series";
import { resolveMonthRange } from "@/lib/stats/month";
import { shiftMonthValue } from "@/lib/stats/month-rotation";
import { buildMonthlyPointSummary } from "@/lib/stats/monthly-point-summary";
import { buildMonthlyShopCohorts } from "@/lib/stats/monthly-shop-cohorts";
import { buildProvinceDistribution } from "@/lib/stats/province-map";
import {
  buildSalesInvalidLatestDateKeys,
  buildSalesInvalidSummary,
} from "@/lib/stats/sales-invalid-summary";
import { buildSalesCityShopTrend } from "@/lib/stats/sales-city-trend";
import {
  buildMonthlySignedShopTrend,
  buildNamedCountTrend,
  buildPlatformTerminationTrend
} from "@/lib/stats/monthly-stats-trends";
import type { StatsMonthlyPayload } from "@/lib/stats/types";
import { resolveSalesCity } from "@/lib/sales-city";
import { Shop } from "@/models/shop";

const CACHE_NAMESPACE = "stats-monthly";

type ShopStatsRow = {
  city?: string;
  contractSignedDate?: Date | string;
  deliveryPlatform?: string;
  entryDate?: Date | string;
  merchantId?: string;
  operatorName?: string;
  salesCity?: string;
  salesName?: string;
  shopName?: string;
  shopStatus?: string;
  terminationDate?: Date | null;
  terminationCooperationDays?: number | null;
};

function matchesDept(shop: ShopStatsRow, dept: StatsDept) {
  const deptCity = getStatsDeptCity(dept);
  if (!deptCity) return true;
  return resolveSalesCity(shop.salesName, shop.salesCity) === deptCity;
}

export async function getMonthlyStatsPayload(monthParam: string | null, deptParam?: string | null) {
  const { start, end, month } = resolveMonthRange(monthParam);
  const nextMonth = shiftMonthValue(month, 1);
  const dept = normalizeStatsDept(deptParam);
  const cached = getCachedReportPayload<StatsMonthlyPayload>(CACHE_NAMESPACE, `${month}:${dept}`);
  if (cached) return cached;

  const [
    candidateShops,
    terminationShops,
    meituanDetails,
    meituanNextMonthDetails,
    elemeDetails,
    elemeNextMonthDetails,
    allMeituanDetails,
    allElemeDetails
  ] = await Promise.all([
    Shop.find({
      $or: [
        { entryDate: { $lt: end } },
        { contractSignedDate: { $lt: end } }
      ]
    })
      .select({
        _id: 0,
        city: 1,
        contractSignedDate: 1,
        deliveryPlatform: 1,
        entryDate: 1,
        merchantId: 1,
        operatorName: 1,
        salesCity: 1,
        salesName: 1,
        shopName: 1,
        shopStatus: 1,
        terminationDate: 1,
        terminationCooperationDays: 1
      })
      .lean<ShopStatsRow[]>(),
    Shop.find({
      shopStatus: "已解约",
      terminationDate: { $gte: start, $lt: end }
    })
      .select({
        _id: 0,
        deliveryPlatform: 1,
        operatorName: 1,
        salesCity: 1,
        salesName: 1,
        terminationDate: 1
      })
      .lean<ShopStatsRow[]>(),
    fetchMonthlyDerivedDetails("meituan", month),
    fetchMonthlyDerivedDetails("meituan", nextMonth),
    fetchMonthlyDerivedDetails("eleme", month),
    fetchMonthlyDerivedDetails("eleme", nextMonth),
    fetchAllDerivedDetails("meituan"),
    fetchAllDerivedDetails("eleme")
  ]);

  const filteredCandidateShops = candidateShops.filter((shop) => matchesDept(shop, dept));
  const { monthlyShops, cumulativeShops } = buildMonthlyShopCohorts({
    start,
    end,
    shops: filteredCandidateShops
  });
  const filteredTerminationShops = terminationShops.filter((shop) => matchesDept(shop, dept));
  const monthlyMeituanDetails = filterDetailsByBusinessMonth({
    month,
    details: [...meituanDetails, ...meituanNextMonthDetails]
  });
  const monthlyElemeDetails = filterDetailsByBusinessMonth({
    month,
    details: [...elemeDetails, ...elemeNextMonthDetails]
  });
  const meituanTrends = buildDailyPointTrends({
    month,
    start,
    end,
    shops: cumulativeShops,
    details: monthlyMeituanDetails
  });
  const elemeTrends = buildDailyPointTrends({
    month,
    start,
    end,
    shops: cumulativeShops,
    details: monthlyElemeDetails
  });
  const dateKeys = buildMonthDateKeys(start, end);
  const monthlyPointSummary = buildMonthlyPointSummary([
    ...monthlyMeituanDetails,
    ...monthlyElemeDetails
  ]);
  const salesInvalidSummary = buildSalesInvalidSummary({
    month,
    shops: filteredCandidateShops,
    dailyDetails: [
      ...meituanDetails,
      ...meituanNextMonthDetails,
      ...elemeDetails,
      ...elemeNextMonthDetails,
    ],
    latestAvailableDateKeys: buildSalesInvalidLatestDateKeys([
      ...meituanDetails,
      ...meituanNextMonthDetails,
      ...elemeDetails,
      ...elemeNextMonthDetails,
    ]),
  });
  const meituanPointSummary = buildMonthlyPointSummary(monthlyMeituanDetails);
  const elemePointSummary = buildMonthlyPointSummary(monthlyElemeDetails);
  const wuhanMonthlyPointSummary = buildCityMonthlyPointSummary({
    cityName: "武汉",
    start,
    end,
    shops: candidateShops,
    meituanDetails: monthlyMeituanDetails,
    elemeDetails: monthlyElemeDetails
  });
  const wuhanDailyPointAmountTrend = buildCityMonthlyPointAmountTrend({
    cityName: "武汉",
    start,
    end,
    shops: candidateShops,
    details: [...monthlyMeituanDetails, ...monthlyElemeDetails]
  });
  const provinceDistribution = buildProvinceDistribution(
    monthlyShops.map((item) => item.city ?? "")
  );
  const salesCityCounts = ["武汉", "宜昌"].map((city) => ({
    name: city,
    count: monthlyShops.filter(
      (shop) => resolveSalesCity(shop.salesName, shop.salesCity) === city
    ).length
  }));

  const payload: StatsMonthlyPayload = {
    month,
    monthlyShopCount: monthlyShops.length,
    monthlyCommissionShopCount: monthlyPointSummary.commissionShopCount,
    monthlyRepaidShopCount: monthlyPointSummary.repaidShopCount,
    monthlyPointShopCount: monthlyPointSummary.commissionShopCount,
    monthlyPointAmount: monthlyPointSummary.totalAmount,
    meituanMonthlyPointAmount: meituanPointSummary.totalAmount,
    elemeMonthlyPointAmount: elemePointSummary.totalAmount,
    dailyOrderShopTrend: buildMonthlySignedShopTrend({
      start,
      end,
      shops: filteredCandidateShops
    }),
    operatorShopTrend: buildNamedCountTrend(monthlyShops, (shop) => String(shop.operatorName ?? "")),
    salesShopTrend: buildNamedCountTrend(monthlyShops, (shop) => String(shop.salesName ?? "")),
    salesCityShopTrend: buildSalesCityShopTrend(salesCityCounts),
    operatorTerminationTrend: buildNamedCountTrend(filteredTerminationShops, (shop) => String(shop.operatorName ?? "")),
    provinceDistribution,
    salesInvalidSummary,
    wuhanMonthlyPointSummary,
    wuhanDailyPointAmountTrend,
    meituanDailyTerminationShopTrend: buildDailyCountTrendSeries(
      "美团",
      dateKeys,
      buildPlatformTerminationTrend(filteredTerminationShops, "meituan")
    ),
    elemeDailyTerminationShopTrend: buildDailyCountTrendSeries(
      "饿了么",
      dateKeys,
      buildPlatformTerminationTrend(filteredTerminationShops, "eleme")
    ),
    meituanDailyPointShopTrend: meituanTrends.shopCountTrend,
    meituanDailyPointAmountTrend: meituanTrends.totalAmountTrend,
    elemeDailyPointShopTrend: elemeTrends.shopCountTrend,
    elemeDailyPointAmountTrend: elemeTrends.totalAmountTrend,
    allDailyPointAmountTrend: buildAllDailyPointAmountTrend([
      ...allMeituanDetails,
      ...allElemeDetails
    ])
  };

  setCachedReportPayload(CACHE_NAMESPACE, `${month}:${dept}`, payload);
  return payload;
}
