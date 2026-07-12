export function MetricCard({
  label,
  value,
  accent
}: {
  label: string;
  value: string | number;
  accent: "blue" | "teal" | "orange" | "green";
}) {
  return (
    <article className={`metric-card metric-${accent}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </article>
  );
}
