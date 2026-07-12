export type SalesInvalidSummaryItem = {
  salesName: string;
  totalSignedShopCount: number;
  invalidShopCount: number;
  terminatedWithinDaysCount: number;
  finalShopCount: number;
};

export type SalesInvalidShopRow = {
  _id?: unknown;
  shopName?: string;
  merchantId?: string;
  deliveryPlatform?: string;
  salesName?: string;
  contractSignedDate?: Date | string;
  terminationDate?: Date | string | null;
  terminationCooperationDays?: number | null;
};

export type SalesInvalidDailyPointRow = {
  platform?: string;
  merchantId?: string;
  storeId?: string;
  shopName?: string;
  recordDateKey?: string;
  amountValue?: number;
};

export type SalesInvalidLatestAvailableDateKeys = Partial<
  Record<"meituan" | "eleme", string>
>;
