import { describe, expect, it } from "vitest";
import { buildBarChartOption } from "@/components/charts/bar-chart";

describe("bar chart option", () => {
  it("开启平均线时，应生成虚线平均线配置", () => {
    const option = buildBarChartOption({
      data: [
        { label: "04-01", value: 10 },
        { label: "04-02", value: 20 },
        { label: "04-03", value: 30 }
      ],
      showAverageLine: true
    });

    const series = Array.isArray(option.series) ? option.series[0] : undefined;
    expect(series).toBeDefined();
    expect(series).toMatchObject({
      markLine: {
        lineStyle: { type: "dashed" },
        data: [{ type: "average" }]
      }
    });
  });

  it("未开启平均线时，不应输出平均线配置", () => {
    const option = buildBarChartOption({
      data: [{ label: "04-01", value: 10 }]
    });

    const series = Array.isArray(option.series) ? option.series[0] : undefined;
    expect(series).toBeDefined();
    expect(series).not.toHaveProperty("markLine");
  });
});
