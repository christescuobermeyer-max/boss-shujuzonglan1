import {
  extractDailyPointAmount,
  normalizeDateKey,
  normalizeText,
  type DailyPointPlatform
} from "../daily-point-derived.js";
import type { DailyAmountPoint } from "./daily-total-amount-trend.js";
import { buildMonthRecordDateRegex } from "./month.js";
import type { DailyPointDerivedRow } from "./types.js";
import { DailyPointDetail } from "../../models/daily-point-detail.js";

const PREPARED_TTL_MS = 30 * 60 * 1000;
const preparedCache = new Map<string, number>();
const SETTLEMENT_DATE_REGEX = /\d{4}[-/年]\d{1,2}[-/月]\d{1,2}/;

type AggregatedAmountTrendRow = {
  date?: unknown;
  value?: unknown;
};

function normalizeAggregatedAmountTrend(
  rows: AggregatedAmountTrendRow[]
): DailyAmountPoint[] {
  const totalByDate = new Map<string, number>();

  rows.forEach((row) => {
    const date = normalizeDateKey(row.date) || normalizeText(row.date);
    const amount = Number(row.value ?? 0);
    if (!date || !Number.isFinite(amount)) return;

    totalByDate.set(
      date,
      Number(((totalByDate.get(date) ?? 0) + amount).toFixed(2))
    );
  });

  return Array.from(totalByDate.entries())
    .map(([date, value]) => ({
      date,
      value: Number(value.toFixed(2))
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, -1);
}

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

export async function fetchAllDailyPointAmountTrend() {
  const rows = await DailyPointDetail.aggregate<AggregatedAmountTrendRow>([
    { $match: { platform: { $in: ["meituan", "eleme"] } } },
    {
      $project: {
        platform: { $ifNull: ["$platform", ""] },
        recordDateKey: { $ifNull: ["$recordDateKey", ""] },
        merchantId: { $ifNull: ["$merchantId", ""] },
        storeId: { $ifNull: ["$storeId", ""] },
        shopName: { $ifNull: ["$shopName", ""] },
        amount: {
          $convert: {
            input: "$amountValue",
            to: "double",
            onError: 0,
            onNull: 0
          }
        },
        settlementDateMatches: {
          $cond: [
            { $eq: ["$platform", "meituan"] },
            {
              $regexFindAll: {
                input: {
                  $toString: { $ifNull: ["$rowData.结算周期", ""] }
                },
                regex: SETTLEMENT_DATE_REGEX
              }
            },
            []
          ]
        }
      }
    },
    {
      $set: {
        date: {
          $cond: [
            { $gt: [{ $size: "$settlementDateMatches" }, 0] },
            {
              $let: {
                vars: {
                  lastMatch: {
                    $arrayElemAt: ["$settlementDateMatches", -1]
                  }
                },
                in: "$$lastMatch.match"
              }
            },
            "$recordDateKey"
          ]
        }
      }
    },
    { $match: { date: { $ne: "" } } },
    {
      $group: {
        _id: {
          platform: "$platform",
          date: "$date",
          merchantId: "$merchantId",
          storeId: "$storeId",
          shopName: "$shopName",
          amount: "$amount"
        },
        amount: { $first: "$amount" }
      }
    },
    {
      $group: {
        _id: "$_id.date",
        value: { $sum: "$amount" }
      }
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        value: { $round: ["$value", 2] }
      }
    },
    { $sort: { date: 1 } }
  ]).allowDiskUse(true);

  return normalizeAggregatedAmountTrend(rows);
}

