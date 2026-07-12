import { ChartPanel } from "@/components/stats/chart-panel";

type CompareItem = {
  label: string;
  value: number;
  color: "wuhan" | "yichang";
};

type AmountItem = {
  label: string;
  value: number;
  color: "meituan" | "eleme";
};

function formatAmount(value: number) {
  return `¥${new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2
  }).format(value)}`;
}

export function ComparePanel({
  cityItems,
  amountItems
}: {
  cityItems: CompareItem[];
  amountItems: AmountItem[];
}) {
  const maxCityValue = Math.max(...cityItems.map((item) => item.value), 1);
  const totalAmount = amountItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="compare-stack">
      <ChartPanel title="武汉 vs 宜昌" subtitle="销售城市开单量对比">
        <div className="compare-list">
          {cityItems.map((item) => (
            <div className="compare-item" key={item.label}>
              <div className="compare-label">{item.label}</div>
              <div className="compare-bar">
                <div
                  className={`compare-fill compare-${item.color}`}
                  style={{ width: `${(item.value / maxCityValue) * 100}%` }}
                />
              </div>
              <div className="compare-value">{item.value}</div>
            </div>
          ))}
        </div>
      </ChartPanel>

      <ChartPanel title="平台回款拆分" subtitle="本月抽点回款金额拆分">
        <div className="platform-amount-grid">
          {amountItems.map((item) => (
            <article className={`platform-amount-card platform-${item.color}`} key={item.label}>
              <div className="platform-amount-label">{item.label}</div>
              <div className="platform-amount-value">{formatAmount(item.value)}</div>
              <div className="platform-amount-share">
                占比 {totalAmount > 0 ? `${((item.value / totalAmount) * 100).toFixed(1)}%` : "0%"}
              </div>
            </article>
          ))}
        </div>
      </ChartPanel>
    </div>
  );
}
