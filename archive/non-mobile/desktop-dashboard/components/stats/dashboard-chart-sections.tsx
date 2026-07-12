import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { ChartPanel } from "@/components/stats/chart-panel";
import type { StatsMonthlyPayload } from "@/lib/stats/types";

export function DashboardChartSections({ stats }: { stats: StatsMonthlyPayload }) {
  const operatorData = stats.operatorShopTrend.map((item) => ({
    label: String(item.name ?? "未分配"),
    value: Number(item.count ?? 0)
  }));
  const cityData = stats.salesCityShopTrend.map((item) => ({
    label: String(item.name ?? "未知"),
    value: Number(item.count ?? 0)
  }));
  const operatorTerminationData = stats.operatorTerminationTrend.map((item) => ({
    label: String(item.name ?? "未分配"),
    value: Number(item.count ?? 0)
  }));

  return (
    <>
      <section className="charts-grid">
        <ChartPanel title="运营店铺分布" subtitle="各运营当前负责店铺数量">
          <BarChart data={operatorData} />
        </ChartPanel>
        <ChartPanel title="武汉 vs 宜昌 柱状对比" subtitle="以柱状图复核两城市开单差异">
          <BarChart data={cityData} />
        </ChartPanel>
        <ChartPanel title="运营解约排行" subtitle="按当月解约店铺数统计">
          <BarChart data={operatorTerminationData} />
        </ChartPanel>
      </section>

      <section className="charts-grid">
        <ChartPanel title="美团每日解约趋势" subtitle="按日查看美团解约店铺数">
          <LineChart series={stats.meituanDailyTerminationShopTrend} valueType="count" />
        </ChartPanel>
        <ChartPanel title="饿了么每日解约趋势" subtitle="按日查看饿了么解约店铺数">
          <LineChart series={stats.elemeDailyTerminationShopTrend} valueType="count" />
        </ChartPanel>
        <ChartPanel title="美团每日抽点店铺数" subtitle="按运营查看美团抽点去重店铺数变化">
          <LineChart series={stats.meituanDailyPointShopTrend} valueType="count" />
        </ChartPanel>
        <ChartPanel title="美团每日抽点总金额" subtitle="按运营查看美团回款金额变化">
          <LineChart series={stats.meituanDailyPointAmountTrend} valueType="amount" />
        </ChartPanel>
        <ChartPanel title="饿了么每日抽点店铺数" subtitle="按运营查看饿了么抽点去重店铺数变化">
          <LineChart series={stats.elemeDailyPointShopTrend} valueType="count" />
        </ChartPanel>
        <ChartPanel title="饿了么每日抽点总金额" subtitle="按运营查看饿了么回款金额变化">
          <LineChart series={stats.elemeDailyPointAmountTrend} valueType="amount" />
        </ChartPanel>
      </section>
    </>
  );
}
