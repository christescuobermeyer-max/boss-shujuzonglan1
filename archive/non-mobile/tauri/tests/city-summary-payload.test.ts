import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("city summary payload", () => {
  it("月统计接口应同时提供武汉和宜昌回款汇总", () => {
    const typesSource = readFileSync(join(process.cwd(), "lib", "stats", "types.ts"), "utf8");
    const defaultsSource = readFileSync(
      join(process.cwd(), "lib", "stats", "monthly-stats-defaults.ts"),
      "utf8"
    );
    const serviceSource = readFileSync(
      join(process.cwd(), "lib", "stats", "monthly-stats-service.ts"),
      "utf8"
    );
    const helperSource = readFileSync(
      join(process.cwd(), "lib", "stats", "key-city-monthly-point-summaries.ts"),
      "utf8"
    );
    const dashboardSource = readFileSync(
      join(process.cwd(), "components", "stats", "monthly-stats-dashboard.tsx"),
      "utf8"
    );
    const overviewSource = readFileSync(
      join(process.cwd(), "components", "stats", "dashboard-overview-section.tsx"),
      "utf8"
    );

    expect(typesSource).toContain("yichangMonthlyPointSummary");
    expect(defaultsSource).toContain("yichangMonthlyPointSummary");
    expect(helperSource).toContain('cityName: "宜昌"');
    expect(helperSource).toContain("yichangMonthlyPointSummary");
    expect(serviceSource).toContain("buildKeyCityMonthlyPointSummaries");
    expect(serviceSource).toContain("yichangMonthlyPointSummary,");
    expect(dashboardSource).toContain("yichangMonthlyPointSummary={stats.yichangMonthlyPointSummary}");
    expect(overviewSource).toContain("yichangMonthlyPointSummary: CityMonthlyPointSummary;");
    expect(overviewSource).toContain("summaryYichang={props.yichangMonthlyPointSummary}");
  });
});
