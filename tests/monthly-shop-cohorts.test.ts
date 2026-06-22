import { describe, expect, it } from "vitest";
import { buildMonthlyShopCohorts } from "@/lib/stats/monthly-shop-cohorts";

describe("monthly shop cohorts", () => {
  it("区分当月开单店铺和截至当月末累计店铺", () => {
    const result = buildMonthlyShopCohorts({
      start: new Date("2026-04-01T00:00:00Z"),
      end: new Date("2026-05-01T00:00:00Z"),
      shops: [
        {
          shopName: "三月店",
          merchantId: "m-march",
          entryDate: "2026-03-10T00:00:00+08:00",
          contractSignedDate: "2026-03-10T00:00:00+08:00"
        },
        {
          shopName: "四月店",
          merchantId: "m-april",
          entryDate: "2026-04-03T00:00:00+08:00",
          contractSignedDate: "2026-04-02T00:00:00+08:00"
        },
        {
          shopName: "五月店",
          merchantId: "m-may",
          entryDate: "2026-05-02T00:00:00+08:00",
          contractSignedDate: "2026-05-02T00:00:00+08:00"
        }
      ]
    });

    expect(result.monthlyShops.map((item) => item.merchantId)).toEqual(["m-april"]);
    expect(result.cumulativeShops.map((item) => item.merchantId)).toEqual([
      "m-march",
      "m-april"
    ]);
  });
});
