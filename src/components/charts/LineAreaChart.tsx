import { useMemo, useState } from "react";

export type LinePoint = {
  label: string;
  value: number;
};

type Props = {
  title?: string;
  subtitle?: string;
  data: LinePoint[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function LineAreaChart({
  title,
  subtitle,
  data,
  height = 180,
  valuePrefix = "",
  valueSuffix = "",
}: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const { pathD, areaD, min, max, points } = useMemo(() => {
    const padX = 18;
    const padY = 18;
    const w = 600;
    const h = height;

    const safe = data.length ? data : [{ label: "-", value: 0 }];
    const vals = safe.map((d) => d.value);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);

    const span = Math.max(1, maxV - minV);

    const x = (i: number) => {
      if (safe.length === 1) return w / 2;
      return padX + (i * (w - padX * 2)) / (safe.length - 1);
    };

    const y = (v: number) => {
      const t = (v - minV) / span;
      const yy = padY + (1 - t) * (h - padY * 2);
      return clamp(yy, padY, h - padY);
    };

    const pts = safe.map((d, i) => ({
      ...d,
      x: x(i),
      y: y(d.value),
    }));

    const line = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");

    const area =
      line +
      ` L${pts[pts.length - 1].x.toFixed(2)} ${(h - padY).toFixed(2)}` +
      ` L${pts[0].x.toFixed(2)} ${(h - padY).toFixed(2)} Z`;

    return { pathD: line, areaD: area, min: minV, max: maxV, points: pts };
  }, [data, height]);

  const active = hover == null ? null : points[hover];

  return (
    <div className="chart">
      {(title || subtitle) && (
        <div className="chart-head">
          <div>
            {title && <div className="chart-title">{title}</div>}
            {subtitle && <div className="chart-sub">{subtitle}</div>}
          </div>
          <div className="chart-range">
            <span className="pill">min {valuePrefix}{min.toLocaleString("pt-BR")}{valueSuffix}</span>
            <span className="pill">max {valuePrefix}{max.toLocaleString("pt-BR")}{valueSuffix}</span>
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
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.35" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid */}
          {[0.2, 0.4, 0.6, 0.8].map((t) => (
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

          <path d={areaD} fill="url(#areaFill)" />
          <path d={pathD} stroke="currentColor" strokeWidth="2.4" fill="none" />

          {points.map((p, i) => (
            <g
              key={p.label + i}
              onMouseMove={() => setHover(i)}
              style={{ cursor: "default" }}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hover === i ? 4.5 : 3.2}
                fill="currentColor"
                opacity={hover === i ? 1 : 0.65}
              />
              {/* hit area */}
              <rect x={p.x - 14} y={0} width={28} height={height} fill="transparent" />
            </g>
          ))}

          {active && (
            <g>
              <line
                x1={active.x}
                x2={active.x}
                y1={0}
                y2={height}
                stroke="rgba(148,163,184,0.22)"
              />
            </g>
          )}
        </svg>

        {active && (
          <div className="chart-tooltip" style={{ left: `${(active.x / 600) * 100}%` }}>
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
