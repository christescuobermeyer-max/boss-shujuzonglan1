import { describe, expect, it } from "vitest";
import { buildOperatorAmountRanking } from "@/lib/stats/operator-amount-ranking";

describe("operator amount ranking", () => {
  it("汇总运营回款金额时移除未分配项，并按金额倒序排序", () => {
    const result = buildOperatorAmountRanking({
      meituanDailyPointAmountTrend: [
        {
          name: "王涛",
          values: [
            { date: "2026-04-01", value: 10 },
            { date: "2026-04-02", value: 5 }
          ]
        },
        {
          name: "未分配",
          values: [{ date: "2026-04-01", value: 100 }]
        }
      ],
      elemeDailyPointAmountTrend: [
        {
          name: "王涛",
          values: [{ date: "2026-04-01", value: 3 }]
        },
        {
          name: "王清月",
          values: [{ date: "2026-04-01", value: 20 }]
        }
      ]
    });

    expect(result).toEqual([
      { name: "王清月", value: 20 },
      { name: "王涛", value: 18 }
    ]);
  });
});
