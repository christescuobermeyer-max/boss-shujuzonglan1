import { describe, expect, it } from "vitest";
import {
  buildDailyPointShopMatcher,
  resolveDailyPointPlatform
} from "@/lib/stats/daily-point-shop-matcher";

describe("daily point shop matcher", () => {
  it("按平台区分相同商家 ID 的店铺匹配和运营归属", () => {
    const matcher = buildDailyPointShopMatcher([
      {
        merchantId: "1001",
        shopName: "同名店",
        operatorName: "王涛",
        deliveryPlatform: "美团"
      },
      {
        merchantId: "1001",
        shopName: "同名店",
        operatorName: "杨有淇",
        deliveryPlatform: "饿了么"
      }
    ]);

    expect(
      matcher.resolveOperator({ platform: "meituan", merchantId: "1001" })
    ).toBe("王涛");
    expect(
      matcher.resolveOperator({ platform: "eleme", merchantId: "1001" })
    ).toBe("杨有淇");
  });

  it("支持用 storeId 回查店铺匹配", () => {
    const matcher = buildDailyPointShopMatcher([
      {
        merchantId: "2002",
        shopName: "测试店",
        operatorName: "张玉莲",
        deliveryPlatform: "饿了么"
      }
    ]);

    expect(matcher.matches({ platform: "eleme", storeId: "2002" })).toBe(true);
    expect(matcher.matches({ platform: "meituan", storeId: "2002" })).toBe(false);
  });

  it("根据履约平台文字解析抽点平台", () => {
    expect(resolveDailyPointPlatform("饿了么")).toBe("eleme");
    expect(resolveDailyPointPlatform("美团专送")).toBe("meituan");
  });
});
