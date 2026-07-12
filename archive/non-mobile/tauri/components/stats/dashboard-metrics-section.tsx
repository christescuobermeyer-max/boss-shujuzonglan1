import { MetricCard } from "@/components/stats/metric-card";

type MetricCardItem = {
  label: string;
  value: number | string;
  accent: "blue" | "green" | "teal" | "orange";
};

export function DashboardMetricsSection({
  items
}: {
  items: MetricCardItem[];
}) {
  return (
    <section className="metrics-grid">
      {items.map((item) => (
        <MetricCard
          key={item.label}
          label={item.label}
          value={item.value}
          accent={item.accent}
        />
      ))}
    </section>
  );
}
