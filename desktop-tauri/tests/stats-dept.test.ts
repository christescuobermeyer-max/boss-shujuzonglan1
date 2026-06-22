import { describe, expect, it } from "vitest";
import { getStatsDeptCity, normalizeStatsDept } from "@/lib/stats/dept";

describe("stats dept", () => {
  it("规范化筛选参数", () => {
    expect(normalizeStatsDept("all")).toBe("all");
    expect(normalizeStatsDept("wuhan")).toBe("wuhan");
    expect(normalizeStatsDept("yichang")).toBe("yichang");
    expect(normalizeStatsDept("other")).toBe("all");
  });

  it("部门参数映射到销售城市", () => {
    expect(getStatsDeptCity("all")).toBe("");
    expect(getStatsDeptCity("wuhan")).toBe("武汉");
    expect(getStatsDeptCity("yichang")).toBe("宜昌");
  });
});
