import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("monthly stats sales invalid source", () => {
  it("销售异常统计所需的解约字段应从店铺查询中选出", () => {
    const source = readFileSync(
      join(process.cwd(), "lib", "stats", "monthly-stats-service.ts"),
      "utf8"
    );

    expect(source).toContain("terminationDate: 1");
    expect(source).toContain("terminationCooperationDays: 1");
  });
});
