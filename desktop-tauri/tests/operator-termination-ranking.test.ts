import { describe, expect, it } from "vitest";
import { buildOperatorTerminationRanking } from "@/lib/stats/operator-termination-ranking";

describe("operator termination ranking", () => {
  it("移除未分配项并按解约店铺数倒序排序", () => {
    const result = buildOperatorTerminationRanking([
      { name: "未分配", count: 9 },
      { name: "王涛", count: 4 },
      { name: "王清月", count: 7 },
      { name: "杨有淇", count: 7 }
    ]);

    expect(result).toEqual([
      { name: "王清月", value: 7 },
      { name: "杨有淇", value: 7 },
      { name: "王涛", value: 4 }
    ]);
  });
});
