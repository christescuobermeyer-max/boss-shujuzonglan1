import { normalizeText } from "@/lib/daily-point-derived";
import type {
  SalesInvalidDailyPointRow,
  SalesInvalidLatestAvailableDateKeys,
  SalesInvalidShopRow,
  SalesInvalidSummaryItem,
} from "@/lib/stats/sales-invalid-types";

const SALES_INVALID_WINDOW_DAYS = 15;
const TERMINATION_WITHIN_DAYS = 3;

function parseDate(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatShanghaiDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(dateKey: string, offset: number) {
  const matched = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return "";
  const value = new Date(
    Date.UTC(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
  );
  value.setUTCDate(value.getUTCDate() + offset);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(
    value.getUTCDate()
  ).padStart(2, "0")}`;
}

function buildSignedWindow(contractSignedDate: string) {
  return Array.from({ length: SALES_INVALID_WINDOW_DAYS }, (_, index) =>
    addDays(contractSignedDate, index)
  ).filter(Boolean);
}

function normalizePlatform(value: unknown) {
  return normalizeText(value).includes("饿了么") ? "eleme" : "meituan";
}

function roundToTwo(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildShopKey(shop: SalesInvalidShopRow, salesName: string, contractSignedDate: string) {
  return (
    normalizeText(shop.merchantId) ||
    normalizeText(shop.shopName) ||
    normalizeText(shop._id) ||
    `${salesName}|${contractSignedDate}`
  );
}

function buildMonthlyShops(month: string, shops: SalesInvalidShopRow[]) {
  return shops.filter((shop) => {
    const contractSignedDate = parseDate(shop.contractSignedDate);
    if (!contractSignedDate) return false;
    return formatShanghaiDate(contractSignedDate).startsWith(`${month}-`);
  });
}

function buildWindowTotalAmount(
  shop: SalesInvalidShopRow,
  contractSignedDate: string,
  dailyDetails: SalesInvalidDailyPointRow[]
) {
  const platform = normalizePlatform(shop.deliveryPlatform);
  const platformRows = dailyDetails.filter(
    (row) => normalizeText(row.platform) === platform
  );
  const merchantId = normalizeText(shop.merchantId);
  const shopName = normalizeText(shop.shopName);
  const idMatchedRows = merchantId
    ? platformRows.filter((row) => {
        const rowMerchantId = normalizeText(row.merchantId);
        const rowStoreId = normalizeText(row.storeId);
        return rowMerchantId === merchantId || rowStoreId === merchantId;
      })
    : [];
  const matchedRows =
    idMatchedRows.length > 0
      ? idMatchedRows
      : platformRows.filter((row) => normalizeText(row.shopName) === shopName);
  const signedWindowSet = new Set(buildSignedWindow(contractSignedDate));

  return roundToTwo(
    matchedRows
      .filter((row) => signedWindowSet.has(normalizeText(row.recordDateKey)))
      .reduce((sum, row) => sum + Number(row.amountValue ?? 0), 0)
  );
}

function isInvalidShop(params: {
  shop: SalesInvalidShopRow;
  dailyDetails: SalesInvalidDailyPointRow[];
  latestAvailableDateKeys: SalesInvalidLatestAvailableDateKeys;
}) {
  const contractSignedAt = parseDate(params.shop.contractSignedDate);
  if (!contractSignedAt) return false;

  const contractSignedDate = formatShanghaiDate(contractSignedAt);
  const windowEndDate =
    buildSignedWindow(contractSignedDate)[SALES_INVALID_WINDOW_DAYS - 1] ||
    contractSignedDate;
  const platform = normalizePlatform(params.shop.deliveryPlatform);
  const latestAvailableDateKey = normalizeText(params.latestAvailableDateKeys[platform]);
  if (!latestAvailableDateKey || latestAvailableDateKey < windowEndDate) {
    return false;
  }

  return (
    buildWindowTotalAmount(params.shop, contractSignedDate, params.dailyDetails) === 0
  );
}

function isTerminatedWithinDays(shop: SalesInvalidShopRow) {
  const terminationDate = parseDate(shop.terminationDate);
  const days = Number(shop.terminationCooperationDays);
  return Boolean(terminationDate) && Number.isFinite(days) && days <= TERMINATION_WITHIN_DAYS;
}

export function buildSalesInvalidLatestDateKeys(details: SalesInvalidDailyPointRow[]) {
  return details.reduce<SalesInvalidLatestAvailableDateKeys>(
    (latestByPlatform, detail) => {
      const platform = normalizeText(detail.platform) as "meituan" | "eleme";
      const recordDateKey = normalizeText(detail.recordDateKey);
      if (!platform || !recordDateKey) return latestByPlatform;
      if (!latestByPlatform[platform] || latestByPlatform[platform]! < recordDateKey) {
        latestByPlatform[platform] = recordDateKey;
      }
      return latestByPlatform;
    },
    {}
  );
}

export function buildSalesInvalidSummary(params: {
  month: string;
  shops: SalesInvalidShopRow[];
  dailyDetails: SalesInvalidDailyPointRow[];
  latestAvailableDateKeys: SalesInvalidLatestAvailableDateKeys;
}) {
  const summaryMap = new Map<
    string,
    {
      totalSignedShopCount: number;
      invalidShopKeys: Set<string>;
      terminatedShopKeys: Set<string>;
      finalShopKeys: Set<string>;
    }
  >();

  buildMonthlyShops(params.month, params.shops).forEach((shop) => {
    const contractSignedAt = parseDate(shop.contractSignedDate);
    if (!contractSignedAt) return;
    const salesName = normalizeText(shop.salesName) || "未分配";
    const contractSignedDate = formatShanghaiDate(contractSignedAt);
    const shopKey = buildShopKey(shop, salesName, contractSignedDate);
    const summary = summaryMap.get(salesName) ?? {
      totalSignedShopCount: 0,
      invalidShopKeys: new Set<string>(),
      terminatedShopKeys: new Set<string>(),
      finalShopKeys: new Set<string>(),
    };

    summary.totalSignedShopCount += 1;

    if (
      isInvalidShop({
        shop,
        dailyDetails: params.dailyDetails,
        latestAvailableDateKeys: params.latestAvailableDateKeys,
      })
    ) {
      summary.invalidShopKeys.add(shopKey);
      summary.finalShopKeys.add(shopKey);
    }

    if (isTerminatedWithinDays(shop)) {
      summary.terminatedShopKeys.add(shopKey);
      summary.finalShopKeys.add(shopKey);
    }

    summaryMap.set(salesName, summary);
  });

  return Array.from(summaryMap.entries())
    .map(([salesName, summary]): SalesInvalidSummaryItem => ({
      salesName,
      totalSignedShopCount: summary.totalSignedShopCount,
      invalidShopCount: summary.invalidShopKeys.size,
      terminatedWithinDaysCount: summary.terminatedShopKeys.size,
      finalShopCount: summary.finalShopKeys.size,
    }))
    .sort(
      (left, right) =>
        right.finalShopCount - left.finalShopCount ||
        right.invalidShopCount - left.invalidShopCount ||
        right.terminatedWithinDaysCount - left.terminatedWithinDaysCount ||
        right.totalSignedShopCount - left.totalSignedShopCount ||
        left.salesName.localeCompare(right.salesName, "zh-CN")
    );
}
