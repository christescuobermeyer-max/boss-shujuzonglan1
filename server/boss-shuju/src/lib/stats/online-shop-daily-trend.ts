import type { OnlineShopPlatform } from "./online-shop-latest.js";

export type OnlineShopTrendSnapshot = {
  platform?: OnlineShopPlatform;
  statDateKey?: string;
  count?: number;
  capturedAt?: Date | string;
};

export type OnlineShopDailyTrendPoint = {
  date: string;
  totalCount: number | null;
  meituanCount: number | null;
  elemeCount: number | null;
};

function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function toCapturedAtValue(value: Date | string | undefined) {
  const parsed = value instanceof Date ? value : new Date(String(value ?? ""));
  const time = parsed.getTime();
  return Number.isFinite(time) ? time : 0;
}

function buildDateRange(firstDate: string, lastDate: string) {
  const dates: string[] = [];
  const cursor = new Date(`${firstDate}T00:00:00.000Z`);
  const end = new Date(`${lastDate}T00:00:00.000Z`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function buildOnlineShopDailyTrend(
  snapshots: OnlineShopTrendSnapshot[]
): OnlineShopDailyTrendPoint[] {
  const latestByDate = new Map<
    string,
    Map<OnlineShopPlatform, OnlineShopTrendSnapshot>
  >();

  snapshots.forEach((snapshot) => {
    const date = String(snapshot.statDateKey ?? "").trim();
    const platform = snapshot.platform;
    const count = Number(snapshot.count);
    if (!isValidDateKey(date) || !platform || !Number.isFinite(count) || count < 0) {
      return;
    }

    const platformMap = latestByDate.get(date) ?? new Map();
    const current = platformMap.get(platform);
    if (
      !current ||
      toCapturedAtValue(current.capturedAt) <= toCapturedAtValue(snapshot.capturedAt)
    ) {
      platformMap.set(platform, snapshot);
    }
    latestByDate.set(date, platformMap);
  });

  const availableDates = Array.from(latestByDate.keys()).sort((left, right) =>
    left.localeCompare(right)
  );
  if (availableDates.length === 0) return [];

  return buildDateRange(availableDates[0], availableDates[availableDates.length - 1]).map(
    (date) => {
      const platformMap = latestByDate.get(date);
      const meituanSnapshot = platformMap?.get("meituan");
      const elemeSnapshot = platformMap?.get("eleme");
      const meituanCount = meituanSnapshot ? Number(meituanSnapshot.count) : null;
      const elemeCount = elemeSnapshot ? Number(elemeSnapshot.count) : null;

      return {
        date,
        totalCount:
          meituanCount === null || elemeCount === null
            ? null
            : meituanCount + elemeCount,
        meituanCount,
        elemeCount
      };
    }
  );
}
