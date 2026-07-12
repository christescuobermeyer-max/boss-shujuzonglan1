import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("monthly stats employee status source", () => {
  it("月统计查询定义应从店铺中选出销售和运营在职状态字段", () => {
    const source = readFileSync(
      join(process.cwd(), "lib", "stats", "monthly-stats-shop-source.ts"),
      "utf8"
    );

    expect(source).toContain("salesEmploymentStatus: 1");
    expect(source).toContain("operatorEmploymentStatus: 1");
  });
});
