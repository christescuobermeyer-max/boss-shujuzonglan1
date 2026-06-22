import { ChartPanel } from "@/components/stats/chart-panel";
import type { TrendItem } from "@/lib/stats/types";

export function RankListPanel({
  title,
  subtitle,
  items,
  accent
}: {
  title: string;
  subtitle: string;
  items: TrendItem[];
  accent: "blue" | "orange" | "teal";
}) {
  const maxValue = Math.max(...items.map((item) => Number(item.count ?? 0)), 1);

  return (
    <ChartPanel title={title} subtitle={subtitle}>
      <div className="rank-list">
        {items.map((item, index) => {
          const count = Number(item.count ?? 0);
          const width = `${Math.max((count / maxValue) * 100, 6)}%`;
          return (
            <div className="rank-item" key={`${item.name ?? "未知"}-${index}`}>
              <div className={`rank-index accent-${accent}`}>{index + 1}</div>
              <div className="rank-main">
                <div className="rank-name">{item.name || "未分配"}</div>
                <div className="rank-track">
                  <div className={`rank-fill accent-${accent}`} style={{ width }} />
                </div>
              </div>
              <div className="rank-value">{count}</div>
            </div>
          );
        })}
      </div>
    </ChartPanel>
  );
}
