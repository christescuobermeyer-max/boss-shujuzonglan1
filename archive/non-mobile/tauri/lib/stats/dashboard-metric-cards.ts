import type { StatsMonthlyPayload } from "@/lib/stats/types";

export type DashboardMetricCardItem = {
  label: string;
  value: number | string;
  accent: "blue" | "green" | "teal" | "orange";
};

export function buildDashboardMetricCards(params: {
  loading: boolean;
  stats: StatsMonthlyPayload;
  terminationTotal: number;
  wuhanShopCount: number;
  yichangShopCount: number;
}) {
  const { loading, stats, terminationTotal, wuhanShopCount, yichangShopCount } = params;

  return [
    { label: "月总店铺数", value: loading ? "..." : stats.monthlyShopCount, accent: "blue" as const },
    {
      label: "本月武汉回款总金额",
      value: loading
        ? "..."
        : `¥${stats.wuhanMonthlyPointSummary.totalAmount.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`,
      accent: "green" as const
    },
    { label: "本月抽点店铺数", value: loading ? "..." : stats.monthlyCommissionShopCount, accent: "teal" as const },
    {
      label: "本月回款总金额",
      value: loading
        ? "..."
        : `¥${stats.monthlyPointAmount.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`,
      accent: "orange" as const
    },
    { label: "本月解约数", value: loading ? "..." : terminationTotal, accent: "green" as const },
    { label: "武汉部开单数", value: loading ? "..." : wuhanShopCount, accent: "orange" as const },
    { label: "宜昌部开单数", value: loading ? "..." : yichangShopCount, accent: "blue" as const }
  ];
}
