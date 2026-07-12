import { describe, expect, it } from "vitest";
import {
  buildProvinceDistribution,
  resolveProvinceMapName,
  resolveProvinceName
} from "@/lib/stats/province-map";

describe("province map", () => {
  it("把常见城市和区县归属到省级名称", () => {
    expect(resolveProvinceName("武汉市")).toBe("湖北");
    expect(resolveProvinceName("长沙")).toBe("湖南");
    expect(resolveProvinceName("重庆市")).toBe("重庆");
    expect(resolveProvinceName("万柏林区")).toBe("山西");
    expect(resolveProvinceName("内蒙古自治区")).toBe("内蒙古");
  });

  it("忽略无效城市并按省份汇总数量", () => {
    const result = buildProvinceDistribution([
      "武汉市",
      "武汉市",
      "长沙市",
      "万柏林区",
      "主营: 鱼火锅"
    ]);

    expect(result).toEqual([
      { name: "湖北", value: 2 },
      { name: "湖南", value: 1 },
      { name: "山西", value: 1 }
    ]);
  });

  it("把简称省份转换成地图可识别的全称", () => {
    expect(resolveProvinceMapName("湖南")).toBe("湖南省");
    expect(resolveProvinceMapName("湖北")).toBe("湖北省");
    expect(resolveProvinceMapName("内蒙古")).toBe("内蒙古自治区");
    expect(resolveProvinceMapName("重庆")).toBe("重庆市");
  });
});
