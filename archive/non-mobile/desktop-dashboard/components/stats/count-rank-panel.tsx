import { ValueRankPanel } from "@/components/stats/value-rank-panel";

function formatCount(value: number) {
  return `${value}家`;
}

export function CountRankPanel({
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
      accent="red"
      formatValue={formatCount}
    />
  );
}
