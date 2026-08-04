import { describe, expect, it } from "vitest";
import {
  buildOperatorAmountRanking,
  buildOperatorTerminationRanking
} from "../server/boss-shuju/src/services/mobile-monthly-stats-service";

describe("mobile operator exclusions", () => {
  it("运营回款排行移出王涛", () => {
    expect(
      buildOperatorAmountRanking({
        meituanDailyPointAmountTrend: [
          {
            name: "王涛",
            values: [
              { date: "2026-08-01", value: 300 },
              { date: "2026-08-02", value: 200 }
            ]
          },
          {
            name: "李四",
            values: [{ date: "2026-08-01", value: 120 }]
          }
        ],
        elemeDailyPointAmountTrend: [
          {
            name: "王涛",
            values: [{ date: "2026-08-01", value: 99 }]
          },
          {
            name: "张三",
            values: [{ date: "2026-08-01", value: 220 }]
          }
        ]
      })
    ).toEqual([
      { name: "张三", value: 220 },
      { name: "李四", value: 120 }
    ]);
  });

  it("运营解约排行移出王涛", () => {
    expect(
      buildOperatorTerminationRanking([
        { name: "王涛", count: 9 },
        { name: "张三", count: 3 },
        { name: "未分配", count: 20 },
        { name: "李四", count: 1 }
      ])
    ).toEqual([
      { name: "张三", value: 3 },
      { name: "李四", value: 1 }
    ]);
  });
});
