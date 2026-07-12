import { describe, expect, it } from "vitest";
import { buildProvinceMapSeriesData } from "@/lib/stats/province-map-style";

describe("province map style", () => {
  it("根据省份店铺数生成地图高亮配置", () => {
    const result = buildProvinceMapSeriesData({
      data: [
        { name: "湖南", value: 44 },
        { name: "湖北", value: 14 },
        { name: "青海", value: 0 }
      ],
      highlightedProvinces: ["湖南"],
      activeProvince: "湖北"
    });

    expect(result).toEqual([
      {
        name: "湖南省",
        value: 44,
        itemStyle: {
          borderColor: "#1677ff",
          borderWidth: 1.8,
          shadowBlur: 14,
          shadowColor: "rgba(22,119,255,0.24)"
        }
      },
      {
        name: "湖北省",
        value: 14,
        itemStyle: {
          borderColor: "#ff6b35",
          borderWidth: 2.2,
          shadowBlur: 18,
          shadowColor: "rgba(255,107,53,0.3)"
        }
      },
      {
        name: "青海省",
        value: 0,
        itemStyle: {
          borderColor: "#c3d8ff",
          borderWidth: 0.7
        }
      }
    ]);
  });
});
