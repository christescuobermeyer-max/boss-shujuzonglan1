import { getCachedReportPayload, setCachedReportPayload } from "@/lib/report-cache";
import type { DailyPointPlatform } from "@/lib/daily-point-derived";
import { resolveSalesCity } from "@/lib/sales-city";
import { buildCityMonthlyPointAmountTrend } from "@/lib/stats/city-opened-point-daily-amount";
import { buildCityMonthlyPointSummary } from "@/lib/stats/city-opened-point-summary";
import { buildDailySummaryRows, type DailySummaryRow } from "@/lib/stats/daily-summary-rows";
import { buildDailyTotalAmountTrend } from "@/lib/stats/daily-total-amount-trend";
import { filterDetailsByBusinessMonth } from "@/lib/stats/daily-point-month-scope";
import { ensureMonthlyDerivedPrepared } from "@/lib/stats/daily-point-monthly";
import { buildDailyPointTrends } from "@/lib/stats/daily-point-trends";
import { getStatsDeptCity, normalizeStatsDept, type StatsDept } from "@/lib/stats/dept";
import { resolveMonthRange } from "@/lib/stats/month";
import { shiftMonthValue } from "@/lib/stats/month-rotation";
import { buildMonthlyPointSummary } from "@/lib/stats/monthly-point-summary";
import { buildMonthlyShopCohorts } from "@/lib/stats/monthly-shop-cohorts";
import { buildNamedCountTrend } from "@/lib/stats/monthly-stats-trends";
import { getLatestOnlineShopSummary } from "@/lib/stats/latest-online-shop-service";
import type { DailyTrendSeries } from "@/lib/stats/daily-trend-series";
import type { DailyAmountPoint } from "@/lib/stats/daily-total-amount-trend";
import type { MobileMonthlyStatsPayload, MobileRankItem } from "@/lib/mobile-dashboard";
import type { DailyPointDerivedRow, TrendItem } from "@/lib/stats/types";
import { DailyPointDetail } from "@/models/daily-point-detail";
import { Shop } from "@/models/shop";

const CACHE_NAMESPACE = "mobile-stats-monthly";

type MobileShopStatsRow = {
  contractSignedDate?: Date | string;
  deliveryPlatform?: string;
  entryDate?: Date | string;
  merchantId?: string;
  operatorName?: string;
  salesCity?: string;
  salesName?: string;
  shopName?: string;
  terminationDate?: Date | null;
};

function buildMonthDateKeyRegex(month: string) {
  return new RegExp(`^${month.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-`);
}

function buildMobileDailyPointProjection(platform: DailyPointPlatform) {
  const projection: Record<string, 0 | 1> = {
    _id: 0,
    businessDateKey: 1,
    platform: 1,
    recordDate: 1,
    recordDateKey: 1,
    merchantId: 1,
    storeId: 1,
    shopName: 1,
    amountValue: 1
  };

  if (platform === "meituan") {
    projection["rowData.结算周期"] = 1;
  }

  return projection;
}

async function fetchMonthlyMobileDerivedDetails(
  platform: DailyPointPlatform,
  month: string
) {
  await ensureMonthlyDerivedPrepared(platform, month);

  return DailyPointDetail.find({
    platform,
    recordDateKey: { $regex: buildMonthDateKeyRegex(month) }
  })
    .select(buildMobileDailyPointProjection(platform))
    .lean<DailyPointDerivedRow[]>();
}

function matchesDept(shop: MobileShopStatsRow, dept: StatsDept) {
  const deptCity = getStatsDeptCity(dept);
  if (!deptCity) return true;
  return resolveSalesCity(shop.salesName, shop.salesCity) === deptCity;
}

function roundAmount(value: number) {
  return Number(value.toFixed(2));
}

function hasDailyRepaymentData(row: DailySummaryRow) {
  return (
    Number(row.totalAmount ?? 0) !== 0 ||
    Number(row.meituanAmount ?? 0) !== 0 ||
    Number(row.elemeAmount ?? 0) !== 0 ||
    Number(row.wuhanAmount ?? 0) !== 0 ||
    Number(row.dailyPointShopCount ?? 0) > 0
  );
}

function hasDailyTrendData(item: DailyAmountPoint) {
  return Number(item.value ?? 0) !== 0;
}

function buildSalesRanking(items: TrendItem[]): MobileRankItem[] {
  return items
    .map((item) => ({
      name: String(item.name ?? "").trim() || "未分配",
      value: Number(item.count ?? 0)
    }))
    .filter((item) => item.name !== "未分配")
    .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name, "zh-CN"));
}

function buildOperatorAmountRanking(params: {
  meituanDailyPointAmountTrend: DailyTrendSeries[];
  elemeDailyPointAmountTrend: DailyTrendSeries[];
}): MobileRankItem[] {
  const amountByOperator = new Map<string, number>();

  [...params.meituanDailyPointAmountTrend, ...params.elemeDailyPointAmountTrend].forEach(
    (series) => {
      const name = String(series.name ?? "").trim() || "未分配";
      if (name === "未分配") return;

      const total = series.values.reduce(
        (sum, item) => sum + Number(item.value ?? 0),
        0
      );
      amountByOperator.set(
        name,
        roundAmount((amountByOperator.get(name) ?? 0) + total)
      );
    }
  );

  return Array.from(amountByOperator.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name, "zh-CN"));
}

function buildOperatorTerminationRanking(items: TrendItem[]): MobileRankItem[] {
  return items
    .map((item) => ({
      name: String(item.name ?? "").trim() || "未分配",
      value: Number(item.count ?? 0)
    }))
    .filter((item) => item.name !== "未分配")
    .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name, "zh-CN"));
}

export async function getMobileMonthlyStatsPayload(
  monthParam: string | null,
  deptParam?: string | null
): Promise<MobileMonthlyStatsPayload> {
  const { start, end, month } = resolveMonthRange(monthParam);
  const nextMonth = shiftMonthValue(month, 1);
  const dept = normalizeStatsDept(deptParam);
  const cacheKey = `${month}:${dept}`;
  const cached = getCachedReportPayload<MobileMonthlyStatsPayload>(CACHE_NAMESPACE, cacheKey);
  if (cached) return cached;

  const [
    candidateShops,
    terminationShops,
    meituanDetails,
    meituanNextMonthDetails,
    elemeDetails,
    elemeNextMonthDetails,
    latestOnlineShopSummary
  ] = await Promise.all([
    Shop.find({
      $or: [
        { entryDate: { $lt: end } },
        { contractSignedDate: { $lt: end } }
      ]
    })
      .select({
        _id: 0,
        contractSignedDate: 1,
        deliveryPlatform: 1,
        entryDate: 1,
        merchantId: 1,
        operatorName: 1,
        salesCity: 1,
        salesName: 1,
        shopName: 1
      })
      .lean<MobileShopStatsRow[]>(),
    Shop.find({
      shopStatus: "已解约",
      terminationDate: { $gte: start, $lt: end }
    })
      .select({
        _id: 0,
        operatorName: 1,
        salesCity: 1,
        salesName: 1,
        terminationDate: 1
      })
      .lean<MobileShopStatsRow[]>(),
    fetchMonthlyMobileDerivedDetails("meituan", month),
    fetchMonthlyMobileDerivedDetails("meituan", nextMonth),
    fetchMonthlyMobileDerivedDetails("eleme", month),
    fetchMonthlyMobileDerivedDetails("eleme", nextMonth),
    getLatestOnlineShopSummary()
  ]);

  const filteredCandidateShops = candidateShops.filter((shop) => matchesDept(shop, dept));
  const filteredTerminationShops = terminationShops.filter((shop) => matchesDept(shop, dept));
  const { monthlyShops, cumulativeShops } = buildMonthlyShopCohorts({
    start,
    end,
    shops: filteredCandidateShops
  });
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
  const monthlyPointSummary = buildMonthlyPointSummary([
    ...monthlyMeituanDetails,
    ...monthlyElemeDetails
  ]);
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
  const operatorTerminationTrend = buildNamedCountTrend(
    filteredTerminationShops,
    (shop) => String(shop.operatorName ?? "")
  );
  const dailyRepaymentRows = buildDailySummaryRows({
    dailyOrderShopTrend: [],
    meituanDailyPointShopTrend: meituanTrends.shopCountTrend,
    meituanDailyPointAmountTrend: meituanTrends.totalAmountTrend,
    elemeDailyPointShopTrend: elemeTrends.shopCountTrend,
    elemeDailyPointAmountTrend: elemeTrends.totalAmountTrend,
    wuhanDailyPointAmountTrend
  }).filter(hasDailyRepaymentData);
  const dailyAmountTrend = buildDailyTotalAmountTrend([
    ...meituanTrends.totalAmountTrend,
    ...elemeTrends.totalAmountTrend
  ]).filter(hasDailyTrendData);

  const payload: MobileMonthlyStatsPayload = {
    month,
    monthlyShopCount: monthlyShops.length,
    monthlyPointAmount: monthlyPointSummary.totalAmount,
    wuhanMonthlyPointAmount: wuhanMonthlyPointSummary.totalAmount,
    yichangMonthlyPointAmount: roundAmount(
      monthlyPointSummary.totalAmount - wuhanMonthlyPointSummary.totalAmount
    ),
    monthlyTerminationCount: filteredTerminationShops.length,
    onlineShopCounts: {
      latestDate: latestOnlineShopSummary.latestDate,
      meituanCount: latestOnlineShopSummary.meituanCount,
      elemeCount: latestOnlineShopSummary.elemeCount
    },
    dailyAmountTrend,
    dailyRepaymentRows,
    rankings: {
      sales: buildSalesRanking(
        buildNamedCountTrend(monthlyShops, (shop) => String(shop.salesName ?? ""))
      ),
      operatorAmount: buildOperatorAmountRanking({
        meituanDailyPointAmountTrend: meituanTrends.totalAmountTrend,
        elemeDailyPointAmountTrend: elemeTrends.totalAmountTrend
      }),
      operatorTermination: buildOperatorTerminationRanking(operatorTerminationTrend)
    }
  };

  setCachedReportPayload(CACHE_NAMESPACE, cacheKey, payload);
  return payload;
}
