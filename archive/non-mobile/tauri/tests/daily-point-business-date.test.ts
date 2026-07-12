import { describe, expect, it } from "vitest";
import { resolveDailyPointBusinessDateKey } from "@/lib/stats/daily-point-business-date";

describe("daily point business date", () => {
  it("美团按结算周期最后一天归属业务日期", () => {
    expect(
      resolveDailyPointBusinessDateKey({
        platform: "meituan",
        recordDateKey: "2026-04-01",
        rowData: {
          结算周期: "2026-03-31~2026-03-31"
        }
      })
    ).toBe("2026-03-31");
  });

  it("非美团默认使用记录日期", () => {
    expect(
      resolveDailyPointBusinessDateKey({
        platform: "eleme",
        recordDateKey: "2026-04-01"
      })
    ).toBe("2026-04-01");
  });
});
