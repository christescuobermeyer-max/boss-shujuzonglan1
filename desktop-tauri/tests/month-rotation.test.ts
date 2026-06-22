import { describe, expect, it } from "vitest";
import {
  buildRecentMonthOptions,
  getNextAllowedMonth,
  getNextRotationMonth,
  getPreviousMonthValue,
  shiftMonthValue
} from "@/lib/stats/month-rotation";

describe("month rotation", () => {
  it("生成从当前月向前的月份选项", () => {
    expect(buildRecentMonthOptions("2026-04", 4)).toEqual([
      "2026-04",
      "2026-03",
      "2026-02",
      "2026-01"
    ]);
  });

  it("支持月份前后切换", () => {
    expect(shiftMonthValue("2026-04", -1)).toBe("2026-03");
    expect(shiftMonthValue("2026-01", -1)).toBe("2025-12");
    expect(shiftMonthValue("2026-12", 1)).toBe("2027-01");
  });

  it("在轮播列表中循环到下一个月份", () => {
    const months = ["2026-04", "2026-03", "2026-02"];
    expect(getNextRotationMonth(months, "2026-04")).toBe("2026-03");
    expect(getNextRotationMonth(months, "2026-02")).toBe("2026-04");
  });

  it("手动切换月份时上一月正常回退", () => {
    expect(getPreviousMonthValue("2026-04")).toBe("2026-03");
    expect(getPreviousMonthValue("2026-01")).toBe("2025-12");
  });

  it("手动切换月份时下一月不能超过当前月", () => {
    expect(getNextAllowedMonth("2026-03", "2026-04")).toBe("2026-04");
    expect(getNextAllowedMonth("2026-04", "2026-04")).toBe("2026-04");
  });
});
