import { useMemo, useState } from "react";

export type BarPoint = {
  label: string;
  value: number;
};

type Props = {
  title?: string;
  subtitle?: string;
  data: BarPoint[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
};

export default function BarChart({
  title,
  subtitle,
  data,
  height = 180,
  valuePrefix = "",
  valueSuffix = "",
}: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const { max, bars } = useMemo(() => {
    const w = 600;
    const h = height;
    const padX = 18;
    const padY = 18;

    const safe = data.length ? data : [{ label: "-", value: 0 }];
    const maxV = Math.max(1, ...safe.map((d) => d.value));

    const colW = (w - padX * 2) / safe.length;
    const bw = Math.max(10, colW * 0.62);

    const items = safe.map((d, i) => {
      const x = padX + i * colW + (colW - bw) / 2;
      const hh = ((h - padY * 2) * d.value) / maxV;
      const y = h - padY - hh;
      return { ...d, x, y, w: bw, h: hh };
    });

    return { max: maxV, bars: items };
  }, [data, height]);

  const active = hover == null ? null : bars[hover];

  return (
    <div className="chart">
      {(title || subtitle) && (
        <div className="chart-head">
          <div>
            {title && <div className="chart-title">{title}</div>}
            {subtitle && <div className="chart-sub">{subtitle}</div>}
          </div>
          <div className="chart-range">
            <span className="pill">top {valuePrefix}{max.toLocaleString("pt-BR")}{valueSuffix}</span>
          </div>
        </div>
      )}

      <div className="chart-wrap" style={{ height }}>
        <svg
          className="chart-svg"
          viewBox={`0 0 600 ${height}`}
          preserveAspectRatio="none"
          onMouseLeave={() => setHover(null)}
        >
          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1="0"
              x2="600"
              y1={t * height}
              y2={t * height}
              stroke="rgba(148,163,184,0.16)"
              strokeWidth="1"
            />
          ))}

          {bars.map((b, i) => (
            <g key={b.label + i} onMouseMove={() => setHover(i)}>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={8}
                fill="currentColor"
                opacity={hover === i ? 0.95 : 0.58}
              />
              <rect x={b.x} y={0} width={b.w} height={height} fill="transparent" />
            </g>
          ))}
        </svg>

        {active && (
          <div className="chart-tooltip" style={{ left: `${((active.x + active.w / 2) / 600) * 100}%` }}>
            <div className="tt-title">{active.label}</div>
            <div className="tt-value">
              {valuePrefix}
              {active.value.toLocaleString("pt-BR")}
              {valueSuffix}
            </div>
          </div>
        )}
      </div>

      <div className="chart-foot">
        {data.slice(Math.max(0, data.length - 6)).map((d) => (
          <span key={d.label} className="tick" title={d.label}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
