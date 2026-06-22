import { ChartPanel } from "@/components/stats/chart-panel";

type RankAccent = "blue" | "orange" | "teal" | "red";

export function ValueRankPanel({
  title,
  subtitle,
  items,
  accent,
  formatValue
}: {
  title: string;
  subtitle: string;
  items: Array<{ name: string; value: number }>;
  accent: RankAccent;
  formatValue: (value: number) => string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <ChartPanel title={title} subtitle={subtitle}>
      <div className="rank-list">
        {items.map((item, index) => (
          <div className="rank-item" key={`${item.name}-${index}`}>
            <div className={`rank-index accent-${accent}`}>{index + 1}</div>
            <div className="rank-main">
              <div className="rank-name">{item.name}</div>
              <div className="rank-track">
                <div
                  className={`rank-fill accent-${accent}`}
                  style={{ width: `${Math.max((item.value / maxValue) * 100, 6)}%` }}
                />
              </div>
            </div>
            <div className="rank-value">{formatValue(item.value)}</div>
          </div>
        ))}
      </div>
    </ChartPanel>
  );
}
