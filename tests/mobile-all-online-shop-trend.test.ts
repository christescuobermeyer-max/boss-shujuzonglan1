import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as mobileApiClientModule from "@/lib/mobile-api-client";

const readProjectFile = (...parts: string[]) =>
  readFileSync(join(process.cwd(), ...parts), "utf8");

describe("mobile all online shop trend", () => {
  it("builds the dedicated backend URL", () => {
    const buildAllOnlineShopTrendUrl = (
      mobileApiClientModule as typeof mobileApiClientModule & {
        buildAllOnlineShopTrendUrl?: () => string;
      }
    ).buildAllOnlineShopTrendUrl;

    expect(buildAllOnlineShopTrendUrl).toBeTypeOf("function");
    expect(buildAllOnlineShopTrendUrl?.()).toMatch(
      /\/api\/mobile\/stats\/online-shop-trend\/all$/
    );
  });

  it("defines an all-history response contract", () => {
    const source = readProjectFile("lib", "mobile-contracts.ts");

    expect(source).toContain("export type AllOnlineShopTrendResponse");
    expect(source).toContain("points: OnlineShopDailyTrendPoint[]");
  });

  it("provides an independently loaded all-history component", () => {
    const path = join(
      process.cwd(),
      "components",
      "mobile",
      "mobile-all-online-shop-trend.tsx"
    );
    expect(existsSync(path)).toBe(true);

    const source = readFileSync(path, "utf8");
    expect(source).toContain("buildAllOnlineShopTrendUrl()");
    expect(source).toContain('credentials: "include"');
    expect(source).toContain("useEffect(() => {");
    expect(source).not.toContain("[month]");
    expect(source).toContain("全部日期在线店铺趋势");
    expect(source).toContain("暂无在线店铺历史数据");
  });

  it("supports zooming and a full-screen view", () => {
    const chartSource = readProjectFile("components", "mobile", "mobile-boss-charts.tsx");
    const componentSource = readProjectFile(
      "components",
      "mobile",
      "mobile-all-online-shop-trend.tsx"
    );

    expect(chartSource).toContain("shouldShowOnlineShopHistoryDateLabel");
    expect(chartSource).toContain('type: "inside"');
    expect(chartSource).toContain('type: "slider"');
    expect(chartSource).toContain("connectNulls: false");
    expect(componentSource).toContain("Maximize2");
    expect(componentSource).toContain('role="dialog"');
    expect(componentSource).toContain('event.key !== "Escape"');
  });

  it("renders independently from the selected monthly payload", () => {
    const dashboardSource = readProjectFile(
      "components",
      "mobile",
      "mobile-boss-dashboard.tsx"
    );
    const dataSource = readProjectFile("lib", "mobile-dashboard.ts");
    const backendSource = readProjectFile(
      "server",
      "boss-shuju",
      "src",
      "services",
      "mobile-monthly-stats-service.ts"
    );

    expect(dashboardSource).toContain("<MobileAllOnlineShopTrend />");
    expect(dashboardSource).not.toContain("dashboardData.onlineShopTrendData");
    expect(dataSource).not.toContain("onlineShopDailyTrend");
    expect(backendSource).not.toContain("getMonthlyOnlineShopTrend");
  });
});
