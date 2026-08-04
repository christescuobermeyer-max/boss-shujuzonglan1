export type RecentSignedTerminationShopRow = {
  _id?: unknown;
  shopName?: string;
  merchantId?: string;
  deliveryPlatform?: string;
  operatorName?: string;
  contractSignedDate?: Date | string | null;
  shopStatus?: string;
  terminationDate?: Date | string | null;
  terminationCooperationDays?: number | null;
};

export type RecentSignedTerminationStatsResponse = {
  month: string;
  signedMonthRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  twoMonthSignedRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  totalTerminatedCount: number;
  twoMonthSignedShopCount: number;
  operatorCount: number;
  operatorStats: Array<{
    operatorName: string;
    count: number;
    twoMonthSignedShopCount: number;
    terminationRate: number;
  }>;
  shops: Array<{
    id: string;
    shopName: string;
    merchantId: string;
    deliveryPlatform: string;
    operatorName: string;
    contractSignedDate: string;
    terminationDate: string;
    terminationCooperationDays: number | null;
  }>;
};

export type RecentSignedTerminationRange = {
  month: string;
  signedMonthRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  twoMonthSignedRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  previousMonthDateRange: {
    startDate: string;
    endDate: string;
  };
  terminationDateRange: {
    startDate: string;
    endDate: string;
  };
  twoMonthSignedStart: Date;
  twoMonthSignedEnd: Date;
};

function normalizeText(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function operatorOf(shop: RecentSignedTerminationShopRow) {
  return normalizeText(shop.operatorName) || "未分配";
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function parseMonth(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("month 参数无效");
  }

  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  if (!Number.isInteger(year) || monthNumber < 1 || monthNumber > 12) {
    throw new Error("month 参数无效");
  }

  return { year, monthNumber };
}

function monthValue(year: number, monthIndexZeroBased: number) {
  const date = new Date(Date.UTC(year, monthIndexZeroBased, 1));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

function dateKey(year: number, monthIndexZeroBased: number, day: number) {
  const date = new Date(Date.UTC(year, monthIndexZeroBased, day));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function shanghaiBoundary(year: number, monthIndexZeroBased: number, day: number) {
  return new Date(Date.UTC(year, monthIndexZeroBased, day, -8, 0, 0, 0));
}

function formatShanghaiDateKey(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(date);
}

function isInClosedDateKeyRange(date: string, start: string, end: string) {
  return Boolean(date) && date >= start && date <= end;
}

function isSignedAndTerminatedInSameMonth(
  signedDateKey: string,
  terminationDateKey: string,
  startDate: string,
  endDate: string
) {
  return (
    isInClosedDateKeyRange(signedDateKey, startDate, endDate) &&
    isInClosedDateKeyRange(terminationDateKey, startDate, endDate)
  );
}

export function resolveRecentSignedTerminationMonth(
  monthParam: string | null
): RecentSignedTerminationRange {
  const now = new Date();
  const currentShanghaiMonth = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit"
  }).format(now);
  const month = normalizeText(monthParam) || currentShanghaiMonth;
  const { year, monthNumber } = parseMonth(month);
  const monthIndex = monthNumber - 1;

  const startMonth = monthValue(year, monthIndex - 1);
  const endMonth = monthValue(year, monthIndex);
  const signedStartDate = dateKey(year, monthIndex - 1, 1);
  const previousMonthEndDate = dateKey(year, monthIndex, 0);
  const terminationStartDate = dateKey(year, monthIndex, 1);
  const signedEndDate = dateKey(year, monthIndex + 1, 0);

  return {
    month,
    signedMonthRange: {
      startMonth,
      endMonth,
      startDate: signedStartDate,
      endDate: signedEndDate
    },
    twoMonthSignedRange: {
      startMonth,
      endMonth,
      startDate: signedStartDate,
      endDate: signedEndDate
    },
    previousMonthDateRange: {
      startDate: signedStartDate,
      endDate: previousMonthEndDate
    },
    terminationDateRange: {
      startDate: terminationStartDate,
      endDate: dateKey(year, monthIndex + 1, 0)
    },
    twoMonthSignedStart: shanghaiBoundary(year, monthIndex - 1, 1),
    twoMonthSignedEnd: shanghaiBoundary(year, monthIndex + 1, 1)
  };
}

export function buildRecentSignedTerminationStats(
  monthParam: string,
  shops: RecentSignedTerminationShopRow[]
): RecentSignedTerminationStatsResponse {
  const range = resolveRecentSignedTerminationMonth(monthParam);

  const twoMonthSignedShops = shops.filter((shop) => {
    const signedDateKey = formatShanghaiDateKey(shop.contractSignedDate);
    return isInClosedDateKeyRange(
      signedDateKey,
      range.twoMonthSignedRange.startDate,
      range.twoMonthSignedRange.endDate
    );
  });

  const terminatedShops = twoMonthSignedShops.filter((shop) => {
    if (normalizeText(shop.shopStatus) !== "已解约") return false;

    const signedDateKey = formatShanghaiDateKey(shop.contractSignedDate);
    const terminationDateKey = formatShanghaiDateKey(shop.terminationDate);

    return (
      isSignedAndTerminatedInSameMonth(
        signedDateKey,
        terminationDateKey,
        range.previousMonthDateRange.startDate,
        range.previousMonthDateRange.endDate
      ) ||
      isSignedAndTerminatedInSameMonth(
        signedDateKey,
        terminationDateKey,
        range.terminationDateRange.startDate,
        range.terminationDateRange.endDate
      )
    );
  });

  const totalByOperator = new Map<string, number>();
  for (const shop of twoMonthSignedShops) {
    const operatorName = operatorOf(shop);
    totalByOperator.set(operatorName, (totalByOperator.get(operatorName) ?? 0) + 1);
  }

  const terminatedByOperator = new Map<string, number>();
  for (const shop of terminatedShops) {
    const operatorName = operatorOf(shop);
    terminatedByOperator.set(operatorName, (terminatedByOperator.get(operatorName) ?? 0) + 1);
  }

  const operatorStats = Array.from(
    new Set([...totalByOperator.keys(), ...terminatedByOperator.keys()])
  )
    .map((operatorName) => {
      const count = terminatedByOperator.get(operatorName) ?? 0;
      const twoMonthSignedShopCount = totalByOperator.get(operatorName) ?? 0;
      return {
        operatorName,
        count,
        twoMonthSignedShopCount,
        terminationRate:
          twoMonthSignedShopCount === 0 ? 0 : count / twoMonthSignedShopCount
      };
    })
    .sort(
      (left, right) =>
        right.count - left.count ||
        right.twoMonthSignedShopCount - left.twoMonthSignedShopCount ||
        left.operatorName.localeCompare(right.operatorName, "zh-CN")
    );

  const detailRows = terminatedShops
    .map((shop) => ({
      id: normalizeText(shop._id) || normalizeText(shop.merchantId),
      shopName: normalizeText(shop.shopName),
      merchantId: normalizeText(shop.merchantId),
      deliveryPlatform: normalizeText(shop.deliveryPlatform),
      operatorName: operatorOf(shop),
      contractSignedDate: formatShanghaiDateKey(shop.contractSignedDate),
      terminationDate: formatShanghaiDateKey(shop.terminationDate),
      terminationCooperationDays:
        typeof shop.terminationCooperationDays === "number" &&
        Number.isFinite(shop.terminationCooperationDays)
          ? shop.terminationCooperationDays
          : null
    }))
    .sort(
      (left, right) =>
        right.terminationDate.localeCompare(left.terminationDate) ||
        left.shopName.localeCompare(right.shopName, "zh-CN")
    );

  return {
    month: range.month,
    signedMonthRange: range.signedMonthRange,
    twoMonthSignedRange: range.twoMonthSignedRange,
    totalTerminatedCount: detailRows.length,
    twoMonthSignedShopCount: twoMonthSignedShops.length,
    operatorCount: operatorStats.length,
    operatorStats,
    shops: detailRows
  };
}
