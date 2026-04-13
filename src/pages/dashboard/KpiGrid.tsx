type KpiItem = {
  label: string;
  value: string | number;
  hint: string;
};

type Props = {
  items: KpiItem[];
};

export default function KpiGrid({ items }: Props) {
  return (
    <section className="kpi-grid">
      {items.map((k) => (
        <div className="kpi" key={k.label}>
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">{k.value}</div>
          <div className="kpi-hint">{k.hint}</div>
        </div>
      ))}
    </section>
  );
}
