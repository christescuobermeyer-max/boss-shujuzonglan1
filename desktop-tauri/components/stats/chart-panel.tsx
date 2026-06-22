type ChartPanelProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function ChartPanel({ title, subtitle, children }: ChartPanelProps) {
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          <p className="panel-subtitle">{subtitle}</p>
        </div>
      </header>
      <div>{children}</div>
    </section>
  );
}
