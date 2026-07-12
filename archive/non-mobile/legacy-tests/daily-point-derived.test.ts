import { describe, expect, it } from "vitest";
import {
  extractDailyPointAmount,
  normalizeDateKey
} from "@/lib/daily-point-derived";

describe("daily-point-derived", () => {
  it("把多种日期格式统一为 yyyy-mm-dd", () => {
    expect(normalizeDateKey("2026/4/2")).toBe("2026-04-02");
    expect(normalizeDateKey("2026年4月12日")).toBe("2026-04-12");
    expect(normalizeDateKey("2026-04-22")).toBe("2026-04-22");
  });

  it("提取美团抽点金额", () => {
    const amount = extractDailyPointAmount(
      { 抽点金额: "￥128.50", 其他字段: "忽略" },
      "meituan"
    );

    expect(amount).toBe(128.5);
  });

  it("提取饿了么结算金额", () => {
    const amount = extractDailyPointAmount(
      { 代运营结算金额: "256.80", 门店: "测试店" },
      "eleme"
    );

    expect(amount).toBe(256.8);
  });
});
