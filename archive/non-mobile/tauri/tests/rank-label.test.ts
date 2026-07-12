import { describe, expect, it } from "vitest";
import { formatTopRankLabel } from "@/lib/stats/rank-label";

describe("rank label", () => {
  it("将榜单名次格式化为中文序位文案", () => {
    expect(formatTopRankLabel(1)).toBe("第1名");
    expect(formatTopRankLabel(12)).toBe("第12名");
  });

  it("非法名次时回退到第1名", () => {
    expect(formatTopRankLabel(0)).toBe("第1名");
    expect(formatTopRankLabel(Number.NaN)).toBe("第1名");
  });
});
