import { describe, expect, it } from "vitest";
import { getNextCarouselIndex } from "@/lib/stats/province-carousel";

describe("province carousel", () => {
  it("在列表内循环前进", () => {
    expect(getNextCarouselIndex(5, -1)).toBe(0);
    expect(getNextCarouselIndex(5, 0)).toBe(1);
    expect(getNextCarouselIndex(5, 4)).toBe(0);
  });

  it("空列表时固定返回 0", () => {
    expect(getNextCarouselIndex(0, 2)).toBe(0);
  });
});
