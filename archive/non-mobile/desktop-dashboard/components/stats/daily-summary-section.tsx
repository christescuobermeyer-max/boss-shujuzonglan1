import { CompactAmountTrendChart } from "@/components/charts/compact-amount-trend-chart";
import { SalesExceptionComparisonChart } from "@/components/charts/sales-exception-comparison-chart";
import { ChartPanel } from "@/components/stats/chart-panel";
import { DailySummaryTable } from "@/components/stats/daily-summary-table";
import type { DailySummaryRow } from "@/lib/stats/daily-summary-rows";
import type { DailyAmountPoint } from "@/lib/stats/daily-total-amount-trend";
import type { SalesInvalidSummaryItem } from "@/lib/stats/sales-invalid-types";

export function DailySummarySection({
  totalAmountTrendData,
  wuhanAmountTrendData,
  salesInvalidSummary = [],
  rows
}: {
  totalAmountTrendData: DailyAmountPoint[];
  wuhanAmountTrendData: DailyAmountPoint[];
  salesInvalidSummary: SalesInvalidSummaryItem[];
  rows: DailySummaryRow[];
}) {
  return (
    <section className="detail-section">
      <div className="detail-top-panel">
        <ChartPanel
          title="销售异常店铺对比"
          subtitle="按销售查看当月15天零回款无效店铺与3天内解约店铺数量"
        >
          <SalesExceptionComparisonChart data={salesInvalidSummary} />
        </ChartPanel>
      </div>

      <div className="detail-trend-grid">
        <ChartPanel title="总回款趋势图" subtitle="按日查看当月整体回款金额变化">
          <CompactAmountTrendChart
            data={totalAmountTrendData}
            color="#1677FF"
            areaStartColor="rgba(22, 119, 255, 0.22)"
            areaEndColor="rgba(22, 119, 255, 0)"
          />
        </ChartPanel>
        <ChartPanel title="武汉回款趋势图" subtitle="按日查看武汉累计开单店铺在本月回款变化">
          <CompactAmountTrendChart
            data={wuhanAmountTrendData}
            color="#FF6B35"
            areaStartColor="rgba(255, 107, 53, 0.22)"
            areaEndColor="rgba(255, 107, 53, 0)"
          />
        </ChartPanel>
      </div>

      <ChartPanel title="当月逐日回款明细" subtitle="按日查看抽点店铺数与平台回款金额，武汉列为累计开单店铺在本月回款">
        <DailySummaryTable rows={rows} />
      </ChartPanel>
    </section>
  );
}
