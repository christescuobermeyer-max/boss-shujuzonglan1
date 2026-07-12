export type ShopStatsRow = {
  city?: string;
  contractSignedDate?: Date | string;
  deliveryPlatform?: string;
  entryDate?: Date | string;
  merchantId?: string;
  operatorEmploymentStatus?: string;
  operatorName?: string;
  salesCity?: string;
  salesEmploymentStatus?: string;
  salesName?: string;
  shopName?: string;
  shopStatus?: string;
  terminationDate?: Date | null;
  terminationCooperationDays?: number | null;
};

export const CANDIDATE_SHOP_STATS_SELECT = {
  _id: 0,
  city: 1,
  contractSignedDate: 1,
  deliveryPlatform: 1,
  entryDate: 1,
  merchantId: 1,
  operatorEmploymentStatus: 1,
  operatorName: 1,
  salesCity: 1,
  salesEmploymentStatus: 1,
  salesName: 1,
  shopName: 1,
  shopStatus: 1,
  terminationDate: 1,
  terminationCooperationDays: 1
};

export const TERMINATION_SHOP_STATS_SELECT = {
  _id: 0,
  deliveryPlatform: 1,
  operatorEmploymentStatus: 1,
  operatorName: 1,
  salesCity: 1,
  salesEmploymentStatus: 1,
  salesName: 1,
  terminationDate: 1
};
