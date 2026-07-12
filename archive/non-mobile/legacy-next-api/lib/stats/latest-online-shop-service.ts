import {
  buildLatestOnlineShopSummary,
  type LatestOnlineShopSummary,
  type OnlineShopSnapshotLite
} from "@/lib/stats/online-shop-latest";
import { OnlineShopCountSnapshot } from "@/models/online-shop-count-snapshot";

const EMPTY_SUMMARY: LatestOnlineShopSummary = {
  latestDate: "",
  totalCount: 0,
  meituanCount: 0,
  elemeCount: 0
};

export async function getLatestOnlineShopSummary() {
  const latestSnapshot = await OnlineShopCountSnapshot.findOne({})
    .sort({ statDateKey: -1, capturedAt: -1 })
    .select({ _id: 0, statDateKey: 1 })
    .lean<{ statDateKey?: string } | null>();

  const latestDate = latestSnapshot?.statDateKey?.trim() ?? "";
  if (!latestDate) {
    return EMPTY_SUMMARY;
  }

  const snapshots = await OnlineShopCountSnapshot.find({
    statDateKey: latestDate
  })
    .sort({ capturedAt: -1 })
    .select({ _id: 0, platform: 1, statDateKey: 1, count: 1, capturedAt: 1 })
    .lean<OnlineShopSnapshotLite[]>();

  return buildLatestOnlineShopSummary(snapshots);
}
