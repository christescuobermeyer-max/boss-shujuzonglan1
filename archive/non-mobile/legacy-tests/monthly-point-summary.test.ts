import { describe, expect, it } from "vitest";
import { buildMonthlyPointSummary } from "@/lib/stats/monthly-point-summary";

describe("monthly point summary", () => {
  it("按平台和店铺去重统计回款店铺数，并累计不同明细金额", () => {
    const result = buildMonthlyPointSummary([
      { platform: "meituan", recordDateKey: "2026-03-01", merchantId: "m1", shopName: "店铺A", amountValue: 18.5 },
      { platform: "meituan", recordDateKey: "2026-03-01", merchantId: "m1", shopName: "店铺A", amountValue: 18.5 },
      { platform: "meituan", recordDateKey: "2026-03-01", merchantId: "m1", shopName: "店铺A", amountValue: 20.5 },
      { platform: "eleme", recordDateKey: "2026-03-01", merchantId: "m1", shopName: "店铺A", amountValue: 12 },
      { platform: "meituan", shopName: "店铺C", amountValue: 0 },
      { platform: "meituan", shopName: "店铺D", amountValue: 8.8 }
    ]);

    expect(result).toEqual({
      commissionShopCount: 4,
      repaidShopCount: 3,
      totalAmount: 59.8
    });
  });
});
