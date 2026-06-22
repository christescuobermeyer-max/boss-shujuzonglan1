import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("daily summary exception layout", () => {
  it("销售异常店铺对比应展示在总回款趋势图和武汉回款趋势图上方", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "daily-summary-section.tsx"),
      "utf8"
    );

    const exceptionPanelIndex = source.indexOf('title="销售异常店铺对比"');
    const totalTrendIndex = source.indexOf('title="总回款趋势图"');

    expect(exceptionPanelIndex).toBeGreaterThan(-1);
    expect(totalTrendIndex).toBeGreaterThan(-1);
    expect(exceptionPanelIndex).toBeLessThan(totalTrendIndex);
  });
});
