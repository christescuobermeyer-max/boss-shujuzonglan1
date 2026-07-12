import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("overview bar label", () => {
  it("总览区两张柱状图应开启柱顶数值标签", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "dashboard-overview-section.tsx"),
      "utf8"
    );

    expect(source).toContain("showAverageLine showValueLabel");
  });
});
