import { describe, expect, it } from "vitest";
import {
  buildMapFocusActions,
  hasMapSeries
} from "@/lib/stats/map-focus";

describe("map focus", () => {
  it("图表序列未就绪时不派发任何地图动作", () => {
    expect(
      buildMapFocusActions({
        hasSeries: false,
        previousActiveProvince: "湖南",
        activeProvince: "湖北"
      })
    ).toEqual([]);
  });

  it("图表序列就绪时按顺序生成 downplay/hideTip/highlight/showTip", () => {
    expect(
      buildMapFocusActions({
        hasSeries: true,
        previousActiveProvince: "湖南",
        activeProvince: "湖北"
      })
    ).toEqual([
      { type: "downplay", seriesIndex: 0, name: "湖南" },
      { type: "hideTip", seriesIndex: 0 },
      { type: "highlight", seriesIndex: 0, name: "湖北" },
      { type: "showTip", seriesIndex: 0, name: "湖北" }
    ]);
  });

  it("图表配置为空时安全返回 false", () => {
    expect(hasMapSeries(undefined)).toBe(false);
    expect(hasMapSeries(null)).toBe(false);
    expect(hasMapSeries({})).toBe(false);
    expect(hasMapSeries({ series: [] })).toBe(false);
    expect(hasMapSeries({ series: [{}] })).toBe(true);
  });
});
