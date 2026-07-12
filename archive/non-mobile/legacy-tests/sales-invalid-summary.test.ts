import { describe, expect, it } from "vitest";
import { buildSalesInvalidSummary } from "../lib/stats/sales-invalid-summary";

describe("buildSalesInvalidSummary", () => {
  it("按销售汇总15天零回款和3天内解约，并对最终异常店铺去重", () => {
    const summary = buildSalesInvalidSummary({
      month: "2026-04",
      shops: [
        {
          _id: "s1",
          shopName: "零回款店铺",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          salesName: "张三",
          contractSignedDate: "2026-04-01T00:00:00+08:00",
        },
        {
          _id: "s2",
          shopName: "3天内解约店铺",
          merchantId: "e1",
          deliveryPlatform: "饿了么餐饮",
          salesName: "张三",
          contractSignedDate: "2026-04-05T00:00:00+08:00",
          terminationDate: "2026-04-07T00:00:00+08:00",
          terminationCooperationDays: 3,
        },
        {
          _id: "s3",
          shopName: "正常回款店铺",
          merchantId: "m2",
          deliveryPlatform: "美团餐饮",
          salesName: "李四",
          contractSignedDate: "2026-04-06T00:00:00+08:00",
        },
        {
          _id: "s4",
          shopName: "数据未满15天店铺",
          merchantId: "m3",
          deliveryPlatform: "美团餐饮",
          salesName: "王五",
          contractSignedDate: "2026-04-30T00:00:00+08:00",
        },
        {
          _id: "s5",
          shopName: "历史店铺",
          merchantId: "m4",
          deliveryPlatform: "美团餐饮",
          salesName: "赵六",
          contractSignedDate: "2026-03-31T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          storeId: "m2",
          recordDateKey: "2026-04-06",
          amountValue: 0.01,
        },
      ],
      latestAvailableDateKeys: {
        meituan: "2026-04-30",
        eleme: "2026-05-31",
      },
    });

    expect(summary).toEqual([
      {
        salesName: "张三",
        totalSignedShopCount: 2,
        invalidShopCount: 2,
        terminatedWithinDaysCount: 1,
        finalShopCount: 2,
      },
      {
        salesName: "李四",
        totalSignedShopCount: 1,
        invalidShopCount: 0,
        terminatedWithinDaysCount: 0,
        finalShopCount: 0,
      },
      {
        salesName: "王五",
        totalSignedShopCount: 1,
        invalidShopCount: 0,
        terminatedWithinDaysCount: 0,
        finalShopCount: 0,
      },
    ]);
  });

  it("优先按商家ID或门店ID匹配，匹配不到再按店铺名，并要求满15天数据才判定", () => {
    const summary = buildSalesInvalidSummary({
      month: "2026-04",
      shops: [
        {
          _id: "s1",
          shopName: "同名店铺",
          merchantId: "m1",
          deliveryPlatform: "美团餐饮",
          salesName: "陈七",
          contractSignedDate: "2026-04-10T00:00:00+08:00",
        },
        {
          _id: "s2",
          shopName: "只匹配店名",
          merchantId: "",
          deliveryPlatform: "美团餐饮",
          salesName: "陈七",
          contractSignedDate: "2026-04-10T00:00:00+08:00",
        },
      ],
      dailyDetails: [
        {
          platform: "meituan",
          merchantId: "m1",
          shopName: "别名",
          recordDateKey: "2026-04-10",
          amountValue: 5,
        },
        {
          platform: "meituan",
          shopName: "同名店铺",
          recordDateKey: "2026-04-10",
          amountValue: 99,
        },
        {
          platform: "meituan",
          shopName: "只匹配店名",
          recordDateKey: "2026-04-10",
          amountValue: 8,
        },
      ],
      latestAvailableDateKeys: {
        meituan: "2026-04-30",
      },
    });

    expect(summary).toEqual([
      {
        salesName: "陈七",
        totalSignedShopCount: 2,
        invalidShopCount: 0,
        terminatedWithinDaysCount: 0,
        finalShopCount: 0,
      },
    ]);
  });
});
