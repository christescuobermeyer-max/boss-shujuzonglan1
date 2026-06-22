import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard header online shop summary", () => {
  it("看板页应通过独立 hook 读取最新在线店铺数", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "monthly-stats-dashboard.tsx"),
      "utf8"
    );

    expect(source).toContain("useLatestOnlineShopSummary");
  });

  it("在线店铺数 hook 应请求独立接口并禁用缓存", () => {
    const source = readFileSync(
      join(process.cwd(), "lib", "stats", "use-latest-online-shop-summary.ts"),
      "utf8"
    );

    expect(source).toContain("/api/stats/latest-online-shop");
    expect(source).toContain('cache: "no-store"');
  });

  it("页头组件应展示在线店铺数文案与平台明细", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "dashboard-header.tsx"),
      "utf8"
    );

    expect(source).toContain("在线店铺数");
    expect(source).toContain("美团");
    expect(source).toContain("饿了么");
    expect(source).toContain("latestOnlineShopSummary");
  });

  it("在线店铺数卡片应包含强调性的实时在线徽标与总数胶囊", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "dashboard-header.tsx"),
      "utf8"
    );

    expect(source).toContain("实时在线");
    expect(source).toContain("online-shop-inline-stats");
  });

  it("在线店铺数卡片应排在统计月份卡片左侧", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "dashboard-header.tsx"),
      "utf8"
    );
    const onlineIndex = source.indexOf('className="toolbar-card toolbar-card-online"');
    const monthIndex = source.indexOf('className="toolbar-card toolbar-card-month"');

    expect(onlineIndex).toBeGreaterThanOrEqual(0);
    expect(monthIndex).toBeGreaterThanOrEqual(0);
    expect(onlineIndex).toBeLessThan(monthIndex);
  });
});
