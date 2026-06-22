import {
  extractDailyPointAmount,
  normalizeDateKey,
  type DailyPointPlatform
} from "@/lib/daily-point-derived";
import { buildMonthRecordDateRegex } from "@/lib/stats/month";
import type { DailyPointDerivedRow } from "@/lib/stats/types";
import { DailyPointDetail } from "@/models/daily-point-detail";

const PREPARED_TTL_MS = 30 * 60 * 1000;
const preparedCache = new Map<string, number>();

export async function ensureMonthlyDerivedPrepared(
  platform: DailyPointPlatform,
  month: string
) {
  const cacheKey = `${platform}:${month}`;
  const cachedUntil = preparedCache.get(cacheKey);
  if (cachedUntil && cachedUntil > Date.now()) return;

  const monthRegex = buildMonthRecordDateRegex(month);
  const missingDocs = await DailyPointDetail.find({
    platform,
    recordDate: { $regex: monthRegex },
    $or: [
      { recordDateKey: { $exists: false } },
      { recordDateKey: "" },
      { amountValue: { $exists: false } },
      { amountValue: null }
    ]
  })
    .select({ _id: 1, recordDate: 1, rowData: 1 })
    .lean<DailyPointDerivedRow[]>();

  const operations = missingDocs
    .filter((doc) => Boolean(doc._id))
    .map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            recordDateKey: normalizeDateKey(doc.recordDate),
            amountValue: extractDailyPointAmount(doc.rowData ?? {}, platform)
          }
        }
      }
    }));

  if (operations.length > 0) {
    await DailyPointDetail.bulkWrite(operations, { ordered: false });
  }

  preparedCache.set(cacheKey, Date.now() + PREPARED_TTL_MS);
}

export async function fetchMonthlyDerivedDetails(
  platform: DailyPointPlatform,
  month: string
) {
  await ensureMonthlyDerivedPrepared(platform, month);
  const monthDateKeyRegex = new RegExp(`^${month.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-`);

  return DailyPointDetail.find({
    platform,
    recordDateKey: { $regex: monthDateKeyRegex }
  })
    .select({
      _id: 0,
      businessDateKey: 1,
      platform: 1,
      recordDate: 1,
      recordDateKey: 1,
      merchantId: 1,
      storeId: 1,
      shopName: 1,
      amountValue: 1,
      rowData: 1
    })
    .lean<DailyPointDerivedRow[]>();
}

export async function fetchAllDerivedDetails(platform: DailyPointPlatform) {
  return DailyPointDetail.find({ platform })
    .select({
      _id: 0,
      businessDateKey: 1,
      platform: 1,
      recordDate: 1,
      recordDateKey: 1,
      merchantId: 1,
      storeId: 1,
      shopName: 1,
      amountValue: 1,
      rowData: 1
    })
    .lean<DailyPointDerivedRow[]>();
}
