import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("daily summary section layout", () => {
  it("逐日回款区应在表格上方新增总回款与武汉回款趋势图", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "daily-summary-section.tsx"),
      "utf8"
    );

    expect(source).toContain('title="总回款趋势图"');
    expect(source).toContain('title="武汉回款趋势图"');
    expect(source).toContain("CompactAmountTrendChart");
    expect(source).toContain("DailySummaryTable");
  });
});
