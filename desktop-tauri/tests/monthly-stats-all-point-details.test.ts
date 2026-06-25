import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("monthly stats all point details source", () => {
  it("每日平台回款应使用月度全部抽点明细，未匹配店铺归入未分配而不是过滤", () => {
    const source = readFileSync(
      join(process.cwd(), "lib", "stats", "monthly-stats-service.ts"),
      "utf8"
    );

    expect(source).toContain("details: monthlyMeituanDetails");
    expect(source).toContain("details: monthlyElemeDetails");
    expect(source).not.toContain("shopMatcher.matches(detail)");
  });

  it("每日平台回款 payload 不应使用员工在职过滤后的趋势", () => {
    const source = readFileSync(
      join(process.cwd(), "lib", "stats", "monthly-stats-service.ts"),
      "utf8"
    );

    expect(source).toContain("meituanDailyPointShopTrend: meituanTrends.shopCountTrend");
    expect(source).toContain("meituanDailyPointAmountTrend: meituanTrends.totalAmountTrend");
    expect(source).toContain("elemeDailyPointShopTrend: elemeTrends.shopCountTrend");
    expect(source).toContain("elemeDailyPointAmountTrend: elemeTrends.totalAmountTrend");
    expect(source).not.toContain(
      "meituanDailyPointAmountTrend: employeeFilteredStats.meituanDailyPointAmountTrend"
    );
  });

  it("首页每日总回款趋势应复用本月平台每日趋势合计", () => {
    const source = readFileSync(
      join(process.cwd(), "lib", "stats", "monthly-stats-service.ts"),
      "utf8"
    );

    expect(source).toContain("allDailyPointAmountTrend: buildDailyTotalAmountTrend([");
    expect(source).toContain("...meituanTrends.totalAmountTrend");
    expect(source).toContain("...elemeTrends.totalAmountTrend");
    expect(source).not.toContain("buildAllDailyPointAmountTrend");
    expect(source).not.toContain("fetchAllDerivedDetails");
  });
});
