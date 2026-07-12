import { describe, expect, it, vi, beforeEach } from "vitest";

const { aggregateMock, allowDiskUseMock } = vi.hoisted(() => ({
  aggregateMock: vi.fn(),
  allowDiskUseMock: vi.fn()
}));

vi.mock("@/models/daily-point-detail", () => ({
  DailyPointDetail: {
    aggregate: aggregateMock
  }
}));

import { fetchAllDailyPointAmountTrend } from "@/lib/stats/daily-point-monthly";

describe("daily point all amount trend query", () => {
  beforeEach(() => {
    aggregateMock.mockReset();
    allowDiskUseMock.mockReset();
  });

  it("在 Mongo 内按业务日期去重汇总，并只返回已汇总趋势点", async () => {
    aggregateMock.mockReturnValue({
      allowDiskUse: allowDiskUseMock
    });
    allowDiskUseMock.mockResolvedValue([
      { date: "2026-04-01", value: 10.234 },
      { date: "2026-04-02", value: 20 },
      { date: "2026-04-03", value: 30 }
    ]);

    const result = await fetchAllDailyPointAmountTrend();

    expect(result).toEqual([
      { date: "2026-04-01", value: 10.23 },
      { date: "2026-04-02", value: 20 }
    ]);
    expect(aggregateMock).toHaveBeenCalledTimes(1);
    expect(allowDiskUseMock).toHaveBeenCalledWith(true);

    const pipeline = aggregateMock.mock.calls[0][0];
    const serializedPipeline = JSON.stringify(pipeline);
    expect(serializedPipeline).toContain("$regexFindAll");
    expect(serializedPipeline).toContain("rowData.结算周期");
    expect(serializedPipeline).toContain("\"$group\"");
    expect(serializedPipeline).toContain("\"$sort\"");
  });
});
