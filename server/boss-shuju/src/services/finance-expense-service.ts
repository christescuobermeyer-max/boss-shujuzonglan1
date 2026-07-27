import mongoose, { type Connection } from "mongoose";
import { getEnv } from "../config/env.js";

export const FINANCE_PEOPLE = ["徐晓辉", "吴思湘", "盛亚娥"] as const;

export type FinancePerson = (typeof FINANCE_PEOPLE)[number];
export type FinanceCity = "yichang" | "wuhan";
export type FinanceCityParam = FinanceCity | "all";
export type FinanceSortBy = "date" | "amount" | "id";
export type FinanceSortOrder = "asc" | "desc";

type MonthRange = {
  startMonth: string;
  endMonth: string;
  months: string[];
  startUtc: Date;
  endExclusiveUtc: Date;
};

export type FinanceMonthlySummaryQuery = {
  city: FinanceCityParam;
  people: FinancePerson[];
  range: MonthRange;
};

export type FinanceTransactionsQuery = {
  city: FinanceCity;
  people: FinancePerson[];
  range: MonthRange;
  page: number;
  limit: number;
  sortBy: FinanceSortBy;
  sortOrder: FinanceSortOrder;
};

export type FinanceMonthlyPoint = {
  month: string;
  expenseAmount: number;
  expenseCount: number;
};

export type FinancePersonMonthlySummary = {
  name: FinancePerson;
  months: FinanceMonthlyPoint[];
  totalExpenseAmount: number;
  totalExpenseCount: number;
};

export type FinanceCityMonthlySummary = {
  city: FinanceCity;
  people: FinancePersonMonthlySummary[];
  cityTotal: {
    expenseAmount: number;
    expenseCount: number;
  };
};

export type FinanceMonthlySummaryPayload =
  | (FinanceCityMonthlySummary & {
      range: { startMonth: string; endMonth: string };
    })
  | {
      city: "all";
      range: { startMonth: string; endMonth: string };
      cities: FinanceCityMonthlySummary[];
      grandTotal: {
        expenseAmount: number;
        expenseCount: number;
      };
    };

export type FinanceTransactionItem = {
  id: number | string | null;
  date: Date;
  amount: number;
  content: string;
  registrant: FinancePerson;
  timestamp?: Date | null;
  hasPaymentImage: boolean;
  hasChatImage: boolean;
};

export type FinanceTransactionsPayload = {
  city: FinanceCity;
  filters: {
    people: FinancePerson[];
    startMonth: string;
    endMonth: string;
    type: "expense";
  };
  data: FinanceTransactionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

type FinanceConnectionCache = {
  conn: Connection | null;
  promise: Promise<Connection> | null;
};

const globalCache = globalThis as typeof globalThis & {
  bossShujuFinanceMongooseCache?: FinanceConnectionCache;
};

const financeCache = globalCache.bossShujuFinanceMongooseCache ?? {
  conn: null,
  promise: null
};

globalCache.bossShujuFinanceMongooseCache = financeCache;

function roundMoney(value: number) {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

function getShanghaiMonthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  return `${year}-${month}`;
}

function assertValidMonth(value: string, label: string) {
  const matched = value.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!matched) throw new FinanceQueryError(400, `${label}格式无效`);
  return value;
}

function addMonths(monthKey: string, delta: number) {
  const [yearText, monthText] = monthKey.split("-");
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function compareMonth(a: string, b: string) {
  return a.localeCompare(b);
}

function listMonths(startMonth: string, endMonth: string) {
  const months: string[] = [];
  let current = startMonth;
  while (compareMonth(current, endMonth) <= 0) {
    months.push(current);
    current = addMonths(current, 1);
    if (months.length > 120) throw new FinanceQueryError(400, "月份范围不能超过120个月");
  }
  return months;
}

function monthStartUtc(monthKey: string) {
  const [yearText, monthText] = monthKey.split("-");
  return new Date(Date.UTC(Number(yearText), Number(monthText) - 1, 1, -8));
}

function parseMonthRange(searchParams: URLSearchParams): MonthRange {
  const rawStart = searchParams.get("startMonth")?.trim() ?? "";
  const rawEnd = searchParams.get("endMonth")?.trim() ?? "";
  const currentMonth = getShanghaiMonthKey();

  let startMonth = rawStart ? assertValidMonth(rawStart, "startMonth") : "";
  let endMonth = rawEnd ? assertValidMonth(rawEnd, "endMonth") : "";

  if (!startMonth && !endMonth) {
    endMonth = currentMonth;
    startMonth = addMonths(endMonth, -11);
  } else if (!startMonth) {
    startMonth = addMonths(endMonth, -11);
  } else if (!endMonth) {
    endMonth = addMonths(startMonth, 11);
  }

  if (compareMonth(startMonth, endMonth) > 0) {
    throw new FinanceQueryError(400, "startMonth不能晚于endMonth");
  }

  const months = listMonths(startMonth, endMonth);
  return {
    startMonth,
    endMonth,
    months,
    startUtc: monthStartUtc(startMonth),
    endExclusiveUtc: monthStartUtc(addMonths(endMonth, 1))
  };
}

function parsePeople(searchParams: URLSearchParams) {
  const person = searchParams.get("person")?.trim() ?? "";
  if (!person) return [...FINANCE_PEOPLE];
  if (!FINANCE_PEOPLE.includes(person as FinancePerson)) {
    throw new FinanceQueryError(400, "person不在允许范围内");
  }
  return [person as FinancePerson];
}

export class FinanceQueryError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "FinanceQueryError";
  }
}

export function parseFinanceMonthlySummaryQuery(url: string): FinanceMonthlySummaryQuery {
  const searchParams = new URL(url).searchParams;
  const city = searchParams.get("city")?.trim() ?? "";
  if (city !== "yichang" && city !== "wuhan" && city !== "all") {
    throw new FinanceQueryError(400, "city参数无效");
  }

  return {
    city,
    people: parsePeople(searchParams),
    range: parseMonthRange(searchParams)
  };
}

export function parseFinanceTransactionsQuery(url: string): FinanceTransactionsQuery {
  const searchParams = new URL(url).searchParams;
  const city = searchParams.get("city")?.trim() ?? "";
  if (city !== "yichang" && city !== "wuhan") {
    throw new FinanceQueryError(400, "明细查询city仅支持yichang或wuhan");
  }

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const sortBy = searchParams.get("sortBy")?.trim() || "date";
  const sortOrder = searchParams.get("sortOrder")?.trim() || "desc";

  if (!Number.isInteger(page) || page < 1) throw new FinanceQueryError(400, "page参数无效");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new FinanceQueryError(400, "limit参数无效");
  }
  if (sortBy !== "date" && sortBy !== "amount" && sortBy !== "id") {
    throw new FinanceQueryError(400, "sortBy参数无效");
  }
  if (sortOrder !== "asc" && sortOrder !== "desc") {
    throw new FinanceQueryError(400, "sortOrder参数无效");
  }

  return {
    city,
    people: parsePeople(searchParams),
    range: parseMonthRange(searchParams),
    page,
    limit,
    sortBy,
    sortOrder
  };
}

async function connectFinanceMongo() {
  if (financeCache.conn) return financeCache.conn;

  if (!financeCache.promise) {
    financeCache.promise = mongoose
      .createConnection(getEnv().financeMongoUri, {
        bufferCommands: false,
        appName: "boss-shuju-finance-readonly",
        maxPoolSize: 5,
        minPoolSize: 0,
        maxIdleTimeMS: 60_000,
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000
      })
      .asPromise();
  }

  financeCache.conn = await financeCache.promise;
  return financeCache.conn;
}

async function getFinanceCollection(city: FinanceCity) {
  const env = getEnv();
  const conn = await connectFinanceMongo();
  const dbName = city === "yichang" ? env.financeDbYichang : env.financeDbWuhan;
  const db = conn.useDb(dbName, { useCache: true }).db;
  if (!db) throw new Error("finance database unavailable");
  return db.collection("transactions");
}

function buildBaseMatch(range: MonthRange) {
  return {
    type: "expense",
    date: { $gte: range.startUtc, $lt: range.endExclusiveUtc },
    amount: { $type: ["int", "long", "double", "decimal"] }
  };
}

function buildTrimmedFieldsStage() {
  return {
    $addFields: {
      registrantTrimmed: {
        $trim: { input: { $ifNull: ["$registrant", ""] } }
      },
      amountNumber: {
        $convert: {
          input: "$amount",
          to: "double",
          onError: null,
          onNull: null
        }
      }
    }
  };
}

function emptyPersonSummary(name: FinancePerson, months: string[]): FinancePersonMonthlySummary {
  return {
    name,
    months: months.map((month) => ({
      month,
      expenseAmount: 0,
      expenseCount: 0
    })),
    totalExpenseAmount: 0,
    totalExpenseCount: 0
  };
}

async function getCityMonthlySummary(
  city: FinanceCity,
  people: FinancePerson[],
  range: MonthRange
): Promise<FinanceCityMonthlySummary> {
  const collection = await getFinanceCollection(city);
  const rows = await collection
    .aggregate<{
      name: FinancePerson;
      month: string;
      expenseAmount: number;
      expenseCount: number;
    }>(
      [
        { $match: buildBaseMatch(range) },
        {
          $addFields: {
            ...buildTrimmedFieldsStage().$addFields,
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: "$date",
                timezone: "Asia/Shanghai"
              }
            }
          }
        },
        {
          $match: {
            registrantTrimmed: { $in: people },
            amountNumber: { $ne: null }
          }
        },
        {
          $group: {
            _id: { registrant: "$registrantTrimmed", month: "$month" },
            expenseAmount: { $sum: "$amountNumber" },
            expenseCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            name: "$_id.registrant",
            month: "$_id.month",
            expenseAmount: { $round: ["$expenseAmount", 2] },
            expenseCount: 1
          }
        },
        { $sort: { name: 1, month: 1 } }
      ],
      { maxTimeMS: getEnv().financeQueryTimeoutMs }
    )
    .toArray();

  const summaryByPerson = new Map(
    people.map((name) => [name, emptyPersonSummary(name, range.months)])
  );

  for (const row of rows) {
    const person = summaryByPerson.get(row.name);
    if (!person) continue;
    const month = person.months.find((item) => item.month === row.month);
    if (!month) continue;
    month.expenseAmount = roundMoney(row.expenseAmount);
    month.expenseCount = Number(row.expenseCount ?? 0);
    person.totalExpenseAmount = roundMoney(person.totalExpenseAmount + month.expenseAmount);
    person.totalExpenseCount += month.expenseCount;
  }

  const peopleRows = [...summaryByPerson.values()];
  return {
    city,
    people: peopleRows,
    cityTotal: {
      expenseAmount: roundMoney(
        peopleRows.reduce((sum, person) => sum + person.totalExpenseAmount, 0)
      ),
      expenseCount: peopleRows.reduce((sum, person) => sum + person.totalExpenseCount, 0)
    }
  };
}

export async function getFinanceMonthlySummary(
  query: FinanceMonthlySummaryQuery
): Promise<FinanceMonthlySummaryPayload> {
  const range = {
    startMonth: query.range.startMonth,
    endMonth: query.range.endMonth
  };

  if (query.city !== "all") {
    return {
      ...(await getCityMonthlySummary(query.city, query.people, query.range)),
      range
    };
  }

  const cities = await Promise.all([
    getCityMonthlySummary("yichang", query.people, query.range),
    getCityMonthlySummary("wuhan", query.people, query.range)
  ]);

  return {
    city: "all",
    range,
    cities,
    grandTotal: {
      expenseAmount: roundMoney(
        cities.reduce((sum, item) => sum + item.cityTotal.expenseAmount, 0)
      ),
      expenseCount: cities.reduce((sum, item) => sum + item.cityTotal.expenseCount, 0)
    }
  };
}

function buildTransactionSort(sortBy: FinanceSortBy, sortOrder: FinanceSortOrder) {
  const direction = sortOrder === "asc" ? 1 : -1;
  if (sortBy === "amount") return { amountNumber: direction, id: direction };
  if (sortBy === "id") return { id: direction };
  return { date: direction, id: direction };
}

export async function getFinanceTransactions(
  query: FinanceTransactionsQuery
): Promise<FinanceTransactionsPayload> {
  const collection = await getFinanceCollection(query.city);
  const skip = (query.page - 1) * query.limit;
  const rows = await collection
    .aggregate<{
      data: FinanceTransactionItem[];
      total: { value: number }[];
    }>(
      [
        { $match: buildBaseMatch(query.range) },
        buildTrimmedFieldsStage(),
        {
          $match: {
            registrantTrimmed: { $in: query.people },
            amountNumber: { $ne: null }
          }
        },
        { $sort: buildTransactionSort(query.sortBy, query.sortOrder) },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: query.limit },
              {
                $project: {
                  _id: 0,
                  id: { $ifNull: ["$id", null] },
                  date: 1,
                  amount: { $round: ["$amountNumber", 2] },
                  content: { $ifNull: ["$content", ""] },
                  registrant: "$registrantTrimmed",
                  timestamp: { $ifNull: ["$timestamp", null] },
                  hasPaymentImage: {
                    $gt: [
                      {
                        $strLenCP: {
                          $cond: [
                            { $eq: [{ $type: "$paymentImage" }, "string"] },
                            "$paymentImage",
                            ""
                          ]
                        }
                      },
                      0
                    ]
                  },
                  hasChatImage: {
                    $gt: [
                      {
                        $strLenCP: {
                          $cond: [
                            { $eq: [{ $type: "$chatImage" }, "string"] },
                            "$chatImage",
                            ""
                          ]
                        }
                      },
                      0
                    ]
                  }
                }
              }
            ],
            total: [{ $count: "value" }]
          }
        }
      ],
      { maxTimeMS: getEnv().financeQueryTimeoutMs }
    )
    .toArray();

  const first = rows[0] ?? { data: [], total: [] };
  const total = Number(first.total[0]?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  return {
    city: query.city,
    filters: {
      people: query.people,
      startMonth: query.range.startMonth,
      endMonth: query.range.endMonth,
      type: "expense"
    },
    data: first.data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrev: query.page > 1
    }
  };
}
