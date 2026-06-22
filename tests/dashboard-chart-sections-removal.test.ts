import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard chart sections removal", () => {
  it("月度总览页不应再挂载下方补充图表区", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "monthly-stats-dashboard.tsx"),
      "utf8"
    );

    expect(source).not.toContain("DashboardChartSections");
  });
});
