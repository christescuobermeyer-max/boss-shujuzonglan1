import { describe, expect, it } from "vitest";
import {
  buildEmployeeStatusMap,
  filterActiveDailyTrendSeries,
  filterActiveNamedItems,
} from "@/lib/stats/employee-employment";

describe("employee employment", () => {
  it("按角色汇总员工在职离职状态", () => {
    const salesMap = buildEmployeeStatusMap(
      [
        { salesName: "李帅", salesEmploymentStatus: "离职" },
        { salesName: "屈维涛", salesEmploymentStatus: "在职" },
      ],
      "sales"
    );
    const operatorMap = buildEmployeeStatusMap(
      [
        { operatorName: "王涛", operatorEmploymentStatus: "在职" },
        { operatorName: "已离职运营", operatorEmploymentStatus: "离职" },
      ],
      "operator"
    );

    expect(salesMap.get("李帅")).toBe("离职");
    expect(salesMap.get("屈维涛")).toBe("在职");
    expect(operatorMap.get("王涛")).toBe("在职");
    expect(operatorMap.get("已离职运营")).toBe("离职");
  });

  it("只保留在职员工的排行数据", () => {
    const salesMap = new Map([
      ["屈维涛", "在职"],
      ["李帅", "离职"],
    ]);

    const result = filterActiveNamedItems(
      [
        { salesName: "屈维涛", count: 10 },
        { salesName: "李帅", count: 5 },
        { salesName: "未分配", count: 3 },
      ],
      salesMap,
      (item) => item.salesName
    );

    expect(result).toEqual([{ salesName: "屈维涛", count: 10 }]);
  });

  it("只保留在职员工的每日趋势序列", () => {
    const operatorMap = new Map([
      ["王涛", "在职"],
      ["离职运营", "离职"],
    ]);

    const result = filterActiveDailyTrendSeries(
      [
        { name: "王涛", values: [{ date: "2026-04-01", value: 10 }] },
        { name: "离职运营", values: [{ date: "2026-04-01", value: 8 }] },
      ],
      operatorMap
    );

    expect(result).toEqual([
      { name: "王涛", values: [{ date: "2026-04-01", value: 10 }] },
    ]);
  });
});
