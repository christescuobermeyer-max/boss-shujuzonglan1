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
  it("defines mobile login and dashboard routes", () => {
    expect(existsSync(filePath("app", "mobile", "login", "page.tsx"))).toBe(true);
    expect(existsSync(filePath("app", "mobile", "page.tsx"))).toBe(true);
  });

  it("renders the mobile login shell with password flow copy", () => {
    const source = readProjectFile("components", "mobile", "mobile-boss-login.tsx");

    expect(source).toContain("呈尚策划 · BOSS快看");
    expect(source).toContain("访问密码");
    expect(source).toContain("/api/mobile/login");
    expect(source).toContain("密码错误，请重新输入");
  });

  it("renders the agreed mobile dashboard sections", () => {
    const source = readProjectFile("components", "mobile", "mobile-boss-dashboard.tsx");

    expect(source).toContain("呈尚策划 · BOSS快看");
    expect(source).toContain("本月回款总金额");
    expect(source).toContain("每日回款趋势");
    expect(source).toContain("每日开单趋势");
    expect(source).toContain("每日回款列表");
    expect(source).toContain("展开本月全部");
    expect(source).toContain("销售开单 Top");
    expect(source).toContain("运营回款 Top");
    expect(source).toContain("解约 Top");
    expect(source).toContain("每日简报");
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
});
