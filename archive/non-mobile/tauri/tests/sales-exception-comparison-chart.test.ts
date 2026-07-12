import { describe, expect, it } from "vitest";
import { buildSalesExceptionComparisonOption } from "../components/charts/sales-exception-comparison-chart";

describe("buildSalesExceptionComparisonOption", () => {
  it("应生成双系列竖向对比图，取消展示条并默认展示全部销售", () => {
    const option = buildSalesExceptionComparisonOption([
      {
        salesName: "张三",
        totalSignedShopCount: 8,
        invalidShopCount: 3,
        terminatedWithinDaysCount: 1,
        finalShopCount: 3,
      },
      {
        salesName: "李四",
        totalSignedShopCount: 5,
        invalidShopCount: 1,
        terminatedWithinDaysCount: 2,
        finalShopCount: 2,
      },
    ]);

    expect(option.legend.data).toEqual(["15天零回款", "3天内解约"]);
    expect(option.xAxis.data).toEqual(["张三", "李四"]);
    expect(option.yAxis.type).toBe("value");
    expect(option.dataZoom).toBeUndefined();
    expect(option.series).toHaveLength(2);
    expect(option.series[0]).toMatchObject({
      name: "15天零回款",
      type: "bar",
      data: [3, 1],
    });
    expect(option.series[1]).toMatchObject({
      name: "3天内解约",
      type: "bar",
      data: [1, 2],
    });
  });
});
