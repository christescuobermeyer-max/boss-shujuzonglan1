export type OnlineShopPlatform = "meituan" | "eleme";

export type OnlineShopSnapshotLite = {
  platform?: OnlineShopPlatform;
  statDateKey?: string;
  count?: number;
  capturedAt?: Date | string;
};

export type LatestOnlineShopSummary = {
  latestDate: string;
  totalCount: number;
  meituanCount: number;
  elemeCount: number;
};

function toCapturedAtValue(value: Date | string | undefined) {
  const parsed = value instanceof Date ? value : new Date(String(value ?? ""));
  const time = parsed.getTime();
  return Number.isFinite(time) ? time : 0;
}

function buildLatestPlatformMap(
  snapshots: OnlineShopSnapshotLite[],
  latestDate: string
) {
  const platformMap = new Map<OnlineShopPlatform, OnlineShopSnapshotLite>();

  snapshots
    .filter((snapshot) => snapshot.statDateKey === latestDate && snapshot.platform)
    .forEach((snapshot) => {
      const platform = snapshot.platform as OnlineShopPlatform;
      const current = platformMap.get(platform);
      if (
        !current ||
        toCapturedAtValue(current.capturedAt) <= toCapturedAtValue(snapshot.capturedAt)
      ) {
        platformMap.set(platform, snapshot);
      }
    });

  return platformMap;
}

export function buildLatestOnlineShopSummary(
  snapshots: OnlineShopSnapshotLite[]
): LatestOnlineShopSummary {
  const latestDate =
    snapshots
      .map((snapshot) => snapshot.statDateKey ?? "")
      .filter(Boolean)
      .sort((left, right) => right.localeCompare(left))[0] ?? "";

  if (!latestDate) {
    return {
      latestDate: "",
      totalCount: 0,
      meituanCount: 0,
      elemeCount: 0
    };
  }

  const latestPlatformMap = buildLatestPlatformMap(snapshots, latestDate);
  const meituanCount = Number(latestPlatformMap.get("meituan")?.count ?? 0);
  const elemeCount = Number(latestPlatformMap.get("eleme")?.count ?? 0);

  return {
    latestDate,
    totalCount: meituanCount + elemeCount,
    meituanCount,
    elemeCount
  };
}
