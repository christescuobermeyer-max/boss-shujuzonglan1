import { OnlineShopCountSnapshot } from "../../models/online-shop-count-snapshot.js";
import {
  buildOnlineShopDailyTrend,
  type OnlineShopTrendSnapshot
} from "./online-shop-daily-trend.js";

export async function fetchAllOnlineShopTrend() {
  const snapshots = await OnlineShopCountSnapshot.find({})
    .sort({ statDateKey: 1, capturedAt: 1 })
    .select({ _id: 0, platform: 1, statDateKey: 1, count: 1, capturedAt: 1 })
    .lean<OnlineShopTrendSnapshot[]>();

  return buildOnlineShopDailyTrend(snapshots);
}
