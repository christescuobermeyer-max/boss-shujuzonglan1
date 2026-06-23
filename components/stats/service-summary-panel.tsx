import { ChartPanel } from "@/components/stats/chart-panel";

function formatAmount(value: number) {
  return `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
}

export function ServiceSummaryPanel({
  totalAmount,
  meituanAmount,
  elemeAmount,
  commissionShopCount
}: {
  totalAmount: number;
  meituanAmount: number;
  elemeAmount: number;
  commissionShopCount: number;
}) {
  return (
    <ChartPanel title="当月总回款金额" subtitle="按当月平台回款金额汇总">
      <div className="service-total">{formatAmount(totalAmount)}</div>
      <div className="service-list">
        <div className="service-row">
          <span>美团平台</span>
          <strong>{formatAmount(meituanAmount)}</strong>
        </div>
        <div className="service-row">
          <span>饿了么平台</span>
          <strong>{formatAmount(elemeAmount)}</strong>
        </div>
        <div className="service-row">
          <span>抽点店铺数</span>
          <strong>{commissionShopCount} 家</strong>
        </div>
      </div>
    </ChartPanel>
  );
}
