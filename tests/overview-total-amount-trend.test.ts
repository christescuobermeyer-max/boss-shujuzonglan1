import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("overview total amount trend", () => {
  it("全国开单省份分布位置应改为美团和淘宝闪购每日总回款趋势", () => {
    const overviewSource = readFileSync(
      join(process.cwd(), "components", "stats", "dashboard-overview-section.tsx"),
      "utf8"
    );
    const dashboardSource = readFileSync(
      join(process.cwd(), "components", "stats", "monthly-stats-dashboard.tsx"),
      "utf8"
    );

    expect(overviewSource).toContain("allDailyPointAmountTrendData: DailyAmountPoint[];");
    expect(overviewSource).toContain('title="每日总回款趋势"');
    expect(overviewSource).toContain("美团 + 淘宝闪购");
    expect(overviewSource).toContain("data={props.allDailyPointAmountTrendData}");
    expect(overviewSource).toContain("TOTAL_AMOUNT_TREND_PANEL_HEIGHT");
    expect(overviewSource).toContain("height={TOTAL_AMOUNT_TREND_PANEL_HEIGHT}");
    expect(overviewSource).not.toContain("height={332}");
    expect(overviewSource).not.toContain("全国开单省份分布");
    expect(overviewSource).not.toContain("<ChinaProvinceMap");
    expect(overviewSource).not.toContain("<ProvinceRankList");
    expect(dashboardSource).toContain("allDailyPointAmountTrendData={stats.allDailyPointAmountTrend}");
    expect(dashboardSource).toContain("totalAmountTrendData={totalAmountTrendData}");
  });
});
