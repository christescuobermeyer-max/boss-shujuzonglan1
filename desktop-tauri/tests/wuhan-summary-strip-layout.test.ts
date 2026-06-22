import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("wuhan summary strip layout", () => {
  it("总览区应在销售业绩分布下方渲染武汉累计开单本月回款卡片条带", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "wuhan-opened-point-strip.tsx"),
      "utf8"
    );

    expect(source).toContain("累计开单本月回款");
    expect(source).toContain("累计开单门店纳入统计");
  });
});
