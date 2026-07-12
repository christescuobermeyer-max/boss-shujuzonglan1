import { describe, expect, it } from "vitest";
import { resolveSalesCity } from "@/lib/sales-city";

describe("sales city", () => {
  it("使用明确的销售城市标签归属", () => {
    expect(resolveSalesCity("任意姓名", "武汉")).toBe("武汉");
    expect(resolveSalesCity("任意姓名", "宜昌")).toBe("宜昌");
  });

  it("销售城市标签缺失时不再按销售姓名回推城市", () => {
    expect(resolveSalesCity("屈维涛", "")).toBe("");
    expect(resolveSalesCity("李帅", null)).toBe("");
    expect(resolveSalesCity("梁智", "")).toBe("");
  });
});
