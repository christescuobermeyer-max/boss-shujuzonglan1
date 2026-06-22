import { describe, expect, it } from "vitest";
import { buildDailyTotalAmountTrend } from "@/lib/stats/daily-total-amount-trend";

describe("daily total amount trend", () => {
  it("按日期汇总各运营的金额序列", () => {
    const result = buildDailyTotalAmountTrend([
      {
        name: "王涛",
        values: [
          { date: "2026-04-01", value: 10.2 },
          { date: "2026-04-02", value: 6.3 }
        ]
      },
      {
        name: "杨有淇",
        values: [
          { date: "2026-04-01", value: 3.5 },
          { date: "2026-04-03", value: 9.4 }
        ]
      }
    ]);

    expect(result).toEqual([
      { date: "2026-04-01", value: 13.7 },
      { date: "2026-04-02", value: 6.3 },
      { date: "2026-04-03", value: 9.4 }
    ]);
  });
});
