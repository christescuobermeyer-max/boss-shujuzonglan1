import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function filePath(...parts: string[]) {
  return join(process.cwd(), ...parts);
}

function readProjectFile(...parts: string[]) {
  return readFileSync(filePath(...parts), "utf8");
}

describe("mobile lightweight stats api source", () => {
  it("adds a protected mobile-only monthly stats endpoint", () => {
    expect(existsSync(filePath("app", "api", "mobile", "stats", "monthly", "route.ts"))).toBe(true);
    const source = readProjectFile("app", "api", "mobile", "stats", "monthly", "route.ts");

    expect(source).toContain("isMobileRequestAuthenticated");
    expect(source).toContain("getMobileMonthlyStatsPayload");
    expect(source).not.toContain("getMonthlyStatsPayload");
  });

  it("does not compute desktop-only datasets for the mobile endpoint", () => {
    const source = readProjectFile("lib", "mobile-monthly-stats-service.ts");

    expect(source).toContain("getMobileMonthlyStatsPayload");
    expect(source).not.toContain("fetchAllDailyPointAmountTrend");
    expect(source).not.toContain("buildSalesInvalidSummary");
    expect(source).not.toContain("provinceDistribution");
    expect(source).not.toContain("allDailyPointAmountTrend");
    expect(source).toContain("rowData.结算周期");
    expect(source).not.toContain("rowData: 1");
    expect(source).toContain("getLatestOnlineShopSummary");
    expect(source).toContain("onlineShopCounts");
    expect(source).toContain("const meituanPointSummary = buildMonthlyPointSummary(monthlyMeituanDetails)");
    expect(source).toContain("const elemePointSummary = buildMonthlyPointSummary(monthlyElemeDetails)");
    expect(source).toContain("meituanMonthlyPointAmount");
    expect(source).toContain("elemeMonthlyPointAmount");
    expect(source).toContain("totalCount: latestOnlineShopSummary.totalCount");
  });

  it("defines the online shop snapshot model for the web runtime", () => {
    const source = readProjectFile("models", "online-shop-count-snapshot.ts");

    expect(source).toContain('collection: "online_shop_count_snapshots"');
    expect(source).toContain("statDateKey");
    expect(source).toContain("capturedAt");
    expect(source).toContain('enum: ["meituan", "eleme"]');
  });
});
