import {
  buildRecentSignedTerminationStats,
  resolveRecentSignedTerminationMonth,
  type RecentSignedTerminationShopRow,
  type RecentSignedTerminationStatsResponse
} from "../lib/stats/recent-signed-termination.js";
import { Shop } from "../models/shop.js";

export async function getRecentSignedTerminationStats(
  monthParam: string | null
): Promise<RecentSignedTerminationStatsResponse> {
  const range = resolveRecentSignedTerminationMonth(monthParam);

  const shops = await Shop.find({
    contractSignedDate: {
      $gte: range.twoMonthSignedStart,
      $lt: range.twoMonthSignedEnd
    }
  })
    .select({
      _id: 1,
      shopName: 1,
      merchantId: 1,
      deliveryPlatform: 1,
      operatorName: 1,
      contractSignedDate: 1,
      shopStatus: 1,
      terminationDate: 1,
      terminationCooperationDays: 1
    })
    .lean<RecentSignedTerminationShopRow[]>();

  return buildRecentSignedTerminationStats(range.month, shops);
}
