import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function filePath(...parts: string[]) {
  return join(process.cwd(), ...parts);
}

function readProjectFile(...parts: string[]) {
  return readFileSync(filePath(...parts), "utf8");
}

describe("mobile boss quick view layout source", () => {
  it("defines mobile login, dashboard, and lightweight stats routes", () => {
    expect(existsSync(filePath("app", "mobile", "login", "page.tsx"))).toBe(true);
    expect(existsSync(filePath("app", "mobile", "page.tsx"))).toBe(true);
    expect(
      existsSync(filePath("server", "boss-shuju", "src", "routes", "mobile-stats.ts"))
    ).toBe(true);
  });

  it("renders the mobile login shell with password flow copy", () => {
    const source = readProjectFile("components", "mobile", "mobile-boss-login.tsx");

    expect(source).toContain("呈尚策划 · BOSS快看");
    expect(source).toContain("访问密码");
    expect(source).toContain("/api/mobile/login");
    expect(source).toContain("密码错误，请重新输入");
  });

  it("renders the agreed mobile dashboard sections", () => {
    const source = [
      readProjectFile("components", "mobile", "mobile-boss-dashboard.tsx"),
      readProjectFile("components", "mobile", "mobile-finance-expense-section.tsx"),
      readProjectFile("components", "mobile", "mobile-all-online-shop-trend.tsx"),
      readProjectFile("lib", "mobile-dashboard.ts")
    ].join("\n");

    expect(source).toContain("呈尚策划 · BOSS快看");
    expect(source).toContain("本月总回款金额");
    expect(source).toContain("本月武汉回款");
    expect(source).toContain("本月宜昌回款");
    expect(source).toContain("月总店铺数");
    expect(source).toContain("两个月解约数");
    expect(source).toContain("totalTerminatedCount");
    expect(source).toContain("美团在线店铺数");
    expect(source).toContain("饿了么在线店铺数");
    expect(source).toContain("最新数据日期");
    expect(source).toContain("mobile-kpi-note");
    expect(source).toContain("全部日期在线店铺趋势");
    expect(source).toContain("暂无在线店铺历史数据");
    expect(source).toContain("每日回款趋势");
    expect(source).toContain("每日开单趋势");
    expect(source).toContain("dailyOrderTrendData");
    expect(source).toContain("美团 / 饿了么每日开单趋势");
    expect(source).toContain("dailyOrderPlatformTrendData");
    expect(source).toContain("美团日均");
    expect(source).toContain("饿了么日均");
    expect(source).toContain("mobile-order-platform-averages");
    expect(source).toContain("buildPlatformDailyOrderAverages");
    expect(source).toContain("mobile-daily-order-average");
    expect(source).toContain("日均 {dailyOrderAverage.toFixed(1)}单");
    expect(source).toContain("每日回款列表");
    expect(source).toContain("展开本月全部");
    expect(source).toContain("dashboardData.dailyRepaymentRows.length > 3");
    expect(source).toContain("rows.slice(0, 3)");
    expect(source).not.toContain("资源统计");
    expect(source).not.toContain("资源账号录入统计");
    expect(source).not.toContain("销售跟进统计");
    expect(source).toContain("销售开单");
    expect(source).toContain("运营回款");
    expect(source).toContain("账号生图");
    expect(source).toContain("财务三人支出");
    expect(source).toContain("/api/mobile/finance/monthly-summary");
    expect(source).toContain("/api/mobile/finance/transactions");
    expect(source).toContain("解约");
    expect(source).not.toContain("每日简报");
    expect(source).not.toContain("销售开单 Top");
    expect(source).not.toContain("运营回款 Top");
    expect(source).not.toContain("解约 Top");
  });

  it("loads daily order trend from the mobile monthly stats payload", () => {
    const source = readProjectFile("components", "mobile", "mobile-boss-dashboard.tsx");

    expect(source).toContain("/api/mobile/stats/monthly?month=");
    expect(source).not.toContain("/api/stats/monthly?month=");
    expect(source).not.toContain("setDailyOrderTrendOverride");
    expect(source).not.toContain("dailyOrderTrendOverride");
    expect(source).toContain("response.text()");
    expect(source).toContain("JSON.parse");
  });

  it("loads public account generation stats between operator repayment and termination", () => {
    const dashboardSource = readProjectFile("components", "mobile", "mobile-boss-dashboard.tsx");
    const clientSource = readProjectFile("lib", "mobile-api-client.ts");

    expect(clientSource).toContain("buildAccountGenerationSummaryUrl");
    expect(clientSource).toContain("https://gw.hbcsch.pw/api/admin/account-generation-summary");
    expect(dashboardSource).toContain("MobileAccountGenerationSection");
    expect(dashboardSource.indexOf('<RankingList title="运营回款"')).toBeLessThan(
      dashboardSource.indexOf("<MobileAccountGenerationSection")
    );
    expect(dashboardSource.indexOf("<MobileAccountGenerationSection")).toBeLessThan(
      dashboardSource.indexOf("<MobileRecentSignedTerminationSection")
    );
  });

  it("does not request or render resource stats on the mobile dashboard", () => {
    const dashboardSource = readProjectFile("components", "mobile", "mobile-boss-dashboard.tsx");
    const clientSource = readProjectFile("lib", "mobile-api-client.ts");

    expect(clientSource).not.toContain("buildResourceStatsUrl");
    expect(clientSource).not.toContain("store-resources/stats/public-users");
    expect(dashboardSource).not.toContain("MobileResourceStatsSection");
    expect(dashboardSource).not.toContain("ResourceStatsPayload");
    expect(dashboardSource).not.toContain("资源统计");
    expect(dashboardSource).not.toContain("fetch(buildResourceStatsUrl())");
  });

  it("uses mobile-specific chart wrappers", () => {
    const source = [
      readProjectFile("components", "mobile", "mobile-boss-charts.tsx"),
      readProjectFile("components", "mobile", "mobile-all-online-shop-trend.tsx"),
      readProjectFile("components", "mobile", "mobile-boss-dashboard.tsx")
    ].join("\n");

    expect(source).toContain("MobileAmountTrendChart");
    expect(source).toContain("MobileOnlineShopTrendChart");
    expect(source).toContain("MobileOrderTrendChart");
    expect(source).toContain("MobilePlatformOrderTrendChart");
    expect(source).toContain(
      "<MobileOnlineShopTrendChart data={payload.points}"
    );
    expect(source).toContain('name: "总在线"');
    expect(source).toContain('name: "美团"');
    expect(source).toContain('name: "饿了么"');
    expect(source).toContain("connectNulls: false");
    expect(source).toContain("<MobileOrderTrendChart data={displayedDailyOrderTrendData}");
    expect(source).toContain(
      "data={displayedDailyOrderPlatformTrendData}"
    );
    expect(source).toContain("echarts-for-react");
    expect(source).toContain("height = 180");
  });

  it("keeps the daily order trend section visible while data loads or is empty", () => {
    const source = readProjectFile("components", "mobile", "mobile-boss-dashboard.tsx");

    expect(source).toContain("暂无每日开单数据");
    expect(source).not.toContain("{displayedDailyOrderTrendData.length > 0 ? (\r\n            <section");
    expect(source).not.toContain("{displayedDailyOrderTrendData.length > 0 ? (\n            <section");
  });

  it("keeps the active stylesheet scoped to mobile pages", () => {
    const source = readProjectFile("app", "globals.css");

    expect(source).toContain(".mobile-page");
    expect(source).toContain(".mobile-kpi-grid");
    expect(source).toContain(".mobile-daily-card");
    expect(source).toContain("@media (max-width: 430px)");
    expect(source).not.toContain(".dashboard-shell");
  });

  it("lays out the three online shop KPI cards in one equal-width row", () => {
    const dashboardSource = readProjectFile("components", "mobile", "mobile-boss-dashboard.tsx");
    const cssSource = readProjectFile("app", "globals.css");

    expect(dashboardSource).toContain("mobile-kpi-online");
    expect(cssSource).toContain(".mobile-kpi-online");
    expect(cssSource).toContain("grid-template-columns: repeat(6, minmax(0, 1fr))");
    expect(cssSource).toContain("grid-column: span 3");
    expect(cssSource).toContain("grid-column: span 2");
  });
});
