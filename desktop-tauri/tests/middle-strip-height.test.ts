import { describe, expect, it } from "vitest";
import { getBottomAlignedStripMinHeight } from "@/lib/stats/middle-strip-height";

describe("middle strip height", () => {
  it("应按目标底边和条带顶部计算所需最小高度", () => {
    expect(
      getBottomAlignedStripMinHeight({
        stripTop: 1690,
        targetBottom: 1783
      })
    ).toBe(93);
  });

  it("当目标底边不高于条带顶部时，不应额外补高", () => {
    expect(
      getBottomAlignedStripMinHeight({
        stripTop: 1690,
        targetBottom: 1688
      })
    ).toBeNull();
  });
});
