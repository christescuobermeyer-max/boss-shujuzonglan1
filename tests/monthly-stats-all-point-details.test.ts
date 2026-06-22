import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("monthly stats all point details source", () => {
  it("每日平台回款应使用月度全部抽点明细，未匹配店铺归入未分配而不是过滤", () => {
    const source = readFileSync(
      join(process.cwd(), "lib", "stats", "monthly-stats-service.ts"),
      "utf8"
    );

    expect(source).toContain("details: monthlyMeituanDetails");
    expect(source).toContain("details: monthlyElemeDetails");
    expect(source).not.toContain("shopMatcher.matches(detail)");
  });
});
