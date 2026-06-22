import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("overview average line", () => {
  it("总览区两张柱状图应开启平均线", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "dashboard-overview-section.tsx"),
      "utf8"
    );

    expect(source).toContain("<BarChart data={props.dailyOrderData} height={MIDDLE_BAR_PANEL_HEIGHT} showAverageLine");
    expect(source).toContain("<BarChart data={props.salesDistributionData} height={MIDDLE_BAR_PANEL_HEIGHT} showAverageLine");
  });
});
