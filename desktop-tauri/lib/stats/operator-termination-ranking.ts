import type { TrendItem } from "@/lib/stats/types";

export function buildOperatorTerminationRanking(items: TrendItem[]) {
  return items
    .map((item) => ({
      name: String(item.name ?? "").trim() || "未分配",
      value: Number(item.count ?? 0)
    }))
    .filter((item) => item.name !== "未分配")
    .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name, "zh-CN"))
    .slice(0, 8);
}
