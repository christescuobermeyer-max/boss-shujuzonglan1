import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("recent signed termination route source", () => {
  it("Sealos 后端注册新签解约运营汇总接口", () => {
    const indexSource = read("server/boss-shuju/src/index.ts");
    const routeSource = read("server/boss-shuju/src/routes/recent-signed-termination.ts");

    expect(indexSource).toContain("recentSignedTerminationRoute");
    expect(routeSource).toContain("/api/termination/recent-signed-stats");
    expect(routeSource).toContain("mobileAuthMiddleware");
    expect(routeSource).toContain("month 参数无效");
  });

  it("服务层只查询 shops 两个月签约候选集", () => {
    const serviceSource = read("server/boss-shuju/src/services/recent-signed-termination-service.ts");

    expect(serviceSource).toContain("Shop.find");
    expect(serviceSource).toContain("contractSignedDate");
    expect(serviceSource).toContain("$gte");
    expect(serviceSource).toContain("$lt");
    expect(serviceSource).toContain("buildRecentSignedTerminationStats");
  });
});

describe("recent signed termination frontend source", () => {
  it("前端通过 Sealos API Base 请求新签解约接口", () => {
    const clientSource = read("lib/mobile-api-client.ts");

    expect(clientSource).toContain("buildRecentSignedTerminationStatsUrl");
    expect(clientSource).toContain("/api/termination/recent-signed-stats");
    expect(clientSource).toContain("NEXT_PUBLIC_BOSS_API_BASE");
  });
});

describe("recent signed termination dashboard replacement", () => {
  it("桌面解约位置替换为新签解约运营汇总组件", () => {
    const overviewSource = read("components/stats/dashboard-overview-section.tsx");
    const dashboardSource = read("components/stats/monthly-stats-dashboard.tsx");
    const panelSource = read("components/stats/recent-signed-termination-panel.tsx");

    expect(overviewSource).toContain("RecentSignedTerminationPanel");
    expect(overviewSource).not.toContain('title="运营解约店铺数"');
    expect(dashboardSource).toContain("buildRecentSignedTerminationStatsUrl");
    expect(panelSource).toContain("新签解约运营汇总");
    expect(panelSource).toContain("两个月总数");
    expect(panelSource).toContain("解约率");
  });
});
