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
    expect(existsSync(filePath("app", "api", "mobile", "stats", "monthly", "route.ts"))).toBe(true);
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
      readProjectFile("lib", "mobile-dashboard.ts")
    ].join("\n");

    expect(source).toContain("呈尚策划 · BOSS快看");
    expect(source).toContain("本月总回款金额");
    expect(source).toContain("本月武汉回款");
    expect(source).toContain("本月宜昌回款");
    expect(source).toContain("月总店铺数");
    expect(source).toContain("本月解约数");
    expect(source).toContain("美团在线店铺数");
    expect(source).toContain("饿了么在线店铺数");
    expect(source).toContain("最新数据日期");
    expect(source).toContain("mobile-kpi-note");
    expect(source).toContain("每日回款趋势");
    expect(source).toContain("每日回款列表");
    expect(source).toContain("展开本月全部");
    expect(source).toContain("销售开单");
    expect(source).toContain("运营回款");
    expect(source).toContain("解约");
    expect(source).not.toContain("每日开单趋势");
    expect(source).not.toContain("每日简报");
    expect(source).not.toContain("销售开单 Top");
    expect(source).not.toContain("运营回款 Top");
    expect(source).not.toContain("解约 Top");
  });

  it("loads data from the mobile-only lightweight stats endpoint", () => {
    const source = readProjectFile("components", "mobile", "mobile-boss-dashboard.tsx");

    expect(source).toContain("/api/mobile/stats/monthly?month=");
    expect(source).not.toContain("/api/stats/monthly");
    expect(source).toContain("response.text()");
    expect(source).toContain("JSON.parse");
  });

  it("uses mobile-specific chart wrappers", () => {
    const source = readProjectFile("components", "mobile", "mobile-boss-charts.tsx");

    expect(source).toContain("MobileAmountTrendChart");
    expect(source).toContain("MobileOrderTrendChart");
    expect(source).toContain("echarts-for-react");
    expect(source).toContain("height = 180");
  });

  it("adds mobile-prefixed CSS without rewriting desktop dashboard shells", () => {
    const source = readProjectFile("app", "globals.css");

    expect(source).toContain(".mobile-page");
    expect(source).toContain(".mobile-kpi-grid");
    expect(source).toContain(".mobile-daily-card");
    expect(source).toContain("@media (max-width: 430px)");
    expect(source).toContain(".dashboard-shell");
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
