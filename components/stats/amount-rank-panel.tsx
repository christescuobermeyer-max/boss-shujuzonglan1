import { ValueRankPanel } from "@/components/stats/value-rank-panel";

function formatAmount(value: number) {
  return `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
}

export function AmountRankPanel({
  title,
  subtitle,
  items
}: {
  title: string;
  subtitle: string;
  items: Array<{ name: string; value: number }>;
}) {
  return (
    <ValueRankPanel
      title={title}
      subtitle={subtitle}
      items={items}
      accent="blue"
      formatValue={formatAmount}
    />
  );
}
