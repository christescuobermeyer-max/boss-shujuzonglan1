"use client";

import { BarChart } from "@/components/charts/bar-chart";
import { ChartPanel } from "@/components/stats/chart-panel";
import { AmountRankPanel } from "@/components/stats/amount-rank-panel";
import { CompactAmountTrendChart } from "@/components/charts/compact-amount-trend-chart";
import { ComparePanel } from "@/components/stats/compare-panel";
import { CountRankPanel } from "@/components/stats/count-rank-panel";
import { RankListPanel } from "@/components/stats/rank-list-panel";
import { ServiceSummaryPanel } from "@/components/stats/service-summary-panel";
import { useMiddleStripMinHeight } from "@/components/stats/use-middle-strip-min-height";
import { useSidePanelMinHeight } from "@/components/stats/use-side-panel-min-height";
import { WuhanOpenedPointStrip } from "@/components/stats/wuhan-opened-point-strip";
import type { DailyAmountPoint } from "@/lib/stats/daily-total-amount-trend";
import type { CityMonthlyPointSummary, TrendItem } from "@/lib/stats/types";

type AmountRankItem = {
  name: string;
  value: number;
};

const MIDDLE_BAR_PANEL_HEIGHT = 198;
const TOTAL_AMOUNT_TREND_PANEL_HEIGHT = 452;

export function DashboardOverviewSection(props: {
  dailyOrderData: Array<{ label: string; value: number }>;
  salesDistributionData: Array<{ label: string; value: number }>;
  meituanTotalAmountTrendData: DailyAmountPoint[];
  elemeTotalAmountTrendData: DailyAmountPoint[];
  allDailyPointAmountTrendData: DailyAmountPoint[];
  totalAmountTrendData: DailyAmountPoint[];
  salesTopItems: TrendItem[];
  operatorTopItems: TrendItem[];
  operatorAmountTopItems: AmountRankItem[];
  operatorTerminationTopItems: AmountRankItem[];
  wuhanMonthlyPointSummary: CityMonthlyPointSummary;
  yichangMonthlyPointSummary: CityMonthlyPointSummary;
  monthlyPointAmount: number;
  meituanMonthlyPointAmount: number;
  elemeMonthlyPointAmount: number;
  monthlyCommissionShopCount: number;
  wuhanShopCount: number;
  yichangShopCount: number;
}) {
  const salesTopSignature = props.salesTopItems.map((item) => `${item.name ?? ""}:${item.count}`).join("|");
  const operatorTopSignature = props.operatorTopItems.map((item) => `${item.name ?? ""}:${item.count}`).join("|");
  const operatorAmountSignature = props.operatorAmountTopItems
    .map((item) => `${item.name}:${item.value}`)
    .join("|");
  const operatorTerminationSignature = props.operatorTerminationTopItems
    .map((item) => `${item.name}:${item.value}`)
    .join("|");
  const {
    leftPanelRef: summaryPanelRef,
    rightPanelRef: terminationPanelRef,
    leftPanelMinHeight,
    rightPanelMinHeight
  } = useSidePanelMinHeight([
    props.monthlyCommissionShopCount,
    props.monthlyPointAmount,
    props.meituanMonthlyPointAmount,
    props.elemeMonthlyPointAmount,
    props.wuhanShopCount,
    props.yichangShopCount,
    salesTopSignature,
    operatorTopSignature,
    operatorAmountSignature,
    operatorTerminationSignature
  ]);
  const {
    stripRef: wuhanStripRef,
    leftTargetRef: leftTrendRef,
    rightTargetRef: rightTrendRef,
    stripMinHeight: wuhanStripMinHeight
  } = useMiddleStripMinHeight([
    props.wuhanMonthlyPointSummary.cohortShopCount,
    props.wuhanMonthlyPointSummary.commissionShopCount,
    props.wuhanMonthlyPointSummary.totalAmount,
    props.wuhanMonthlyPointSummary.meituanAmount,
    props.wuhanMonthlyPointSummary.elemeAmount,
    props.yichangMonthlyPointSummary.cohortShopCount,
    props.yichangMonthlyPointSummary.commissionShopCount,
    props.yichangMonthlyPointSummary.totalAmount,
    props.allDailyPointAmountTrendData.length,
    props.meituanTotalAmountTrendData.length,
    props.elemeTotalAmountTrendData.length
  ]);

  return (
    <>
      <section className="overview-grid">
        <div className="column-stack">
          <RankListPanel
            title="销售开单排行"
            subtitle="按当月开单店铺数排序"
            items={props.salesTopItems}
            accent="orange"
          />
          <RankListPanel
            title="运营接单排行"
            subtitle="按当月负责店铺数排序"
            items={props.operatorTopItems}
            accent="teal"
          />
          <div
            ref={summaryPanelRef}
            className="summary-panel-shell"
            style={leftPanelMinHeight ? { minHeight: `${leftPanelMinHeight}px` } : undefined}
          >
            <ServiceSummaryPanel
              totalAmount={props.monthlyPointAmount}
              meituanAmount={props.meituanMonthlyPointAmount}
              elemeAmount={props.elemeMonthlyPointAmount}
              commissionShopCount={props.monthlyCommissionShopCount}
            />
          </div>
          <div ref={leftTrendRef}>
            <ChartPanel title="每日美团总回款趋势" subtitle="按日汇总美团平台回款金额">
              <CompactAmountTrendChart
                data={props.meituanTotalAmountTrendData}
                color="#CC9F00"
                areaStartColor="rgba(255, 209, 0, 0.24)"
                areaEndColor="rgba(255, 209, 0, 0)"
              />
            </ChartPanel>
          </div>
        </div>

        <div className="column-stack">
          <ChartPanel title="每日总回款趋势" subtitle="美团 + 淘宝闪购每日回款金额总和">
            <CompactAmountTrendChart
              data={props.allDailyPointAmountTrendData}
              color="#1677FF"
              areaStartColor="rgba(22, 119, 255, 0.22)"
              areaEndColor="rgba(22, 119, 255, 0)"
              height={TOTAL_AMOUNT_TREND_PANEL_HEIGHT}
            />
          </ChartPanel>
          <ChartPanel title="本月每日开单趋势" subtitle="按签约日期查看当月开单变化">
            <BarChart data={props.dailyOrderData} height={MIDDLE_BAR_PANEL_HEIGHT} showAverageLine showValueLabel />
          </ChartPanel>
          <ChartPanel title="销售业绩分布" subtitle="各销售当月开单店铺数量">
            <BarChart data={props.salesDistributionData} height={MIDDLE_BAR_PANEL_HEIGHT} showAverageLine showValueLabel />
          </ChartPanel>
          <div
            ref={wuhanStripRef}
            style={wuhanStripMinHeight ? { minHeight: `${wuhanStripMinHeight}px` } : undefined}
          >
            <WuhanOpenedPointStrip
              summaryWuhan={props.wuhanMonthlyPointSummary}
              summaryYichang={props.yichangMonthlyPointSummary}
            />
          </div>
        </div>

        <div className="column-stack">
          <ComparePanel
            cityItems={[
              { label: "武汉", value: props.wuhanShopCount, color: "wuhan" },
              { label: "宜昌", value: props.yichangShopCount, color: "yichang" }
            ]}
            amountItems={[
              { label: "美团", value: props.meituanMonthlyPointAmount, color: "meituan" },
              { label: "饿了么", value: props.elemeMonthlyPointAmount, color: "eleme" }
            ]}
          />
          <AmountRankPanel
            title="运营回款金额"
            subtitle="按运营汇总本月回款金额"
            items={props.operatorAmountTopItems}
          />
          <div
            ref={terminationPanelRef}
            className="termination-panel-shell"
            style={rightPanelMinHeight ? { minHeight: `${rightPanelMinHeight}px` } : undefined}
          >
            <CountRankPanel
              title="运营解约店铺数"
              subtitle="按运营汇总当月解约店铺数量"
              items={props.operatorTerminationTopItems}
            />
          </div>
          <div ref={rightTrendRef}>
            <ChartPanel title="每日饿了么总回款趋势" subtitle="按日汇总饿了么平台回款金额">
              <CompactAmountTrendChart
                data={props.elemeTotalAmountTrendData}
                color="#0099FF"
                areaStartColor="rgba(0, 153, 255, 0.22)"
                areaEndColor="rgba(0, 153, 255, 0)"
              />
            </ChartPanel>
          </div>
        </div>
      </section>
    </>
  );
}
