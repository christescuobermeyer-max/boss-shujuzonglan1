import { describe, expect, it } from "vitest";
import { buildMetricGridTemplateColumns } from "@/lib/stats/metric-grid";

describe("metric grid", () => {
  it("按卡片数量生成桌面端单行栅格列数", () => {
    expect(buildMetricGridTemplateColumns(7)).toBe("repeat(7, minmax(0, 1fr))");
    expect(buildMetricGridTemplateColumns(1)).toBe("repeat(1, minmax(0, 1fr))");
  });

  it("数量非法时回退到 1 列", () => {
    expect(buildMetricGridTemplateColumns(0)).toBe("repeat(1, minmax(0, 1fr))");
  });
});
