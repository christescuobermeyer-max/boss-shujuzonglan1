import { describe, expect, it } from "vitest";
import { getSidePanelMinHeights } from "@/lib/stats/side-panel-height";

describe("side panel height", () => {
  it("左侧底边更高时，只应补齐左侧所需的最小高度差值", () => {
    expect(
      getSidePanelMinHeights({
        leftHeight: 286,
        leftBottom: 1454,
        rightHeight: 359,
        rightBottom: 1460
      })
    ).toEqual({
      leftPanelMinHeight: 292,
      rightPanelMinHeight: null
    });
  });

  it("右侧底边更高时，只应补齐右侧所需的最小高度差值", () => {
    expect(
      getSidePanelMinHeights({
        leftHeight: 286,
        leftBottom: 1527,
        rightHeight: 359,
        rightBottom: 1460
      })
    ).toEqual({
      leftPanelMinHeight: null,
      rightPanelMinHeight: 426
    });
  });

  it("两侧底边已对齐时，不应额外补高", () => {
    expect(
      getSidePanelMinHeights({
        leftHeight: 286,
        leftBottom: 1454,
        rightHeight: 359,
        rightBottom: 1454
      })
    ).toEqual({
      leftPanelMinHeight: null,
      rightPanelMinHeight: null
    });
  });
});
