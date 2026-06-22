import { describe, expect, it } from "vitest";
import { filterDetailsByBusinessMonth } from "@/lib/stats/daily-point-month-scope";

describe("daily point month scope", () => {
  it("保留业务日期落在当月内的明细，包括次月入库但归属上月的数据", () => {
    const details = filterDetailsByBusinessMonth({
      month: "2026-03",
      details: [
        {
          platform: "meituan",
          recordDateKey: "2026-04-01",
          amountValue: 7.89,
          rowData: {
            结算周期: "2026-03-31~2026-03-31"
          }
        },
        {
          platform: "eleme",
          recordDateKey: "2026-03-12",
          amountValue: 12
        },
        {
          platform: "meituan",
          recordDateKey: "2026-04-02",
          amountValue: 20,
          rowData: {
            结算周期: "2026-04-01~2026-04-01"
          }
        }
      ]
    });

    expect(details).toHaveLength(2);
    expect(details.map((item) => item.businessDateKey)).toEqual([
      "2026-03-31",
      "2026-03-12"
    ]);
  });
});
