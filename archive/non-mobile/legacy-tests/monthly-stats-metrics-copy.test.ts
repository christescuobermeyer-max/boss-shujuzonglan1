import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("monthly stats metrics copy", () => {
  it("顶部指标应展示本月武汉回款总金额，而不是本月回款店铺数", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "monthly-stats-dashboard.tsx"),
      "utf8"
    );

    expect(source).toContain("本月武汉回款总金额");
    expect(source).not.toContain("本月回款店铺数");
  });

  it("顶部解约指标应使用新签解约接口的两个月解约数", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "monthly-stats-dashboard.tsx"),
      "utf8"
    );

    expect(source).toContain("两个月解约数");
    expect(source).toContain("recentSignedTerminationData?.totalTerminatedCount");
    expect(source).not.toContain("本月解约数");
    expect(source).not.toContain("operatorTerminationTrend.reduce");
  });
});
