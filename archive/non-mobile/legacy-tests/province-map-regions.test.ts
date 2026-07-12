import { describe, expect, it } from "vitest";
import { buildProvinceMapRegions } from "@/lib/stats/province-map-regions";

describe("province map regions", () => {
  it("按省份店铺数生成地图区域高亮配置", () => {
    const result = buildProvinceMapRegions({
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
        itemStyle: {
          areaColor: "#7fb2ff",
          borderColor: "#1677ff",
          borderWidth: 2
        },
        label: {
          show: true,
          color: "#ffffff",
          fontWeight: 700
        }
      },
      {
        name: "湖北省",
        itemStyle: {
          areaColor: "#ff8f66",
          borderColor: "#ff6b35",
          borderWidth: 2.4
        },
        label: {
          show: true,
          color: "#ffffff",
          fontWeight: 700
        }
      }
    ]);
  });
});
