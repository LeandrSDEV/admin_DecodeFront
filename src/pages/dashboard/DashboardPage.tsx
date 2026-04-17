import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import {
  listAffiliates,
  fetchAffiliateDashboard,
  type Affiliate,
  type AdminAffiliateDashboard,
} from "../../services/affiliateService";

// =============================================================================
// Types — espelhando GET /api/admin/dashboard/overview
// =============================================================================

type Counts = { total: number; mesa: number; delivery: number };
type DailyPoint = { date: string; value: number };

type TenantMetrics = {
  id: number;
  slug: string;
  schemaName: string;
  name: string;
  lastSeenAt: string | null;
  sales: {
    today: number;
    last7Days: number;
    thisMonth: number;
    trend7Days: DailyPoint[];
  };
  orders: { today: Counts; last7Days: Counts; thisMonth: Counts };
  users: { total: number; byRole: Record<string, number> };
};

type TopAffiliate = {
  rank: number;
  id: string;
  name: string;
  refCode: string;
  activeClients: number;
  totalEarned: number;
};

type DashboardOverview = {
  tenancy: { generatedAt: string; tenantCount: number; tenants: TenantMetrics[] };
  crm: { affiliatesActive: number; affiliatesPending: number; decodesTotal: number };
  topAffiliates: TopAffiliate[];
};

type TenantListItem = {
  id: number;
  createdAt: string;
};

// =============================================================================
// Helpers
// =============================================================================

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const fmtNumber = (v: number) => new Intl.NumberFormat("pt-BR").format(v || 0);

const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
};

// =============================================================================
// Componente principal
// =============================================================================

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [tenantsList, setTenantsList] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<number | "all">("all");

  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>("");
  const [affiliateDashboard, setAffiliateDashboard] = useState<AdminAffiliateDashboard | null>(null);
  const [loadingAffiliateDash, setLoadingAffiliateDash] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selectedAffiliateId) {
      setAffiliateDashboard(null);
      return;
    }
    setLoadingAffiliateDash(true);
    fetchAffiliateDashboard(selectedAffiliateId)
      .then(setAffiliateDashboard)
      .catch(() => setAffiliateDashboard(null))
      .finally(() => setLoadingAffiliateDash(false));
  }, [selectedAffiliateId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, tenantsRes, affiliatesRes] = await Promise.all([
        api.get<DashboardOverview>("/api/admin/dashboard/overview"),
        api.get<TenantListItem[]>("/api/admin/tenants"),
        listAffiliates({ size: 200 }).catch(() => ({ content: [] as Affiliate[], totalElements: 0, number: 0, size: 0 })),
      ]);
      setData(overviewRes.data);
      setTenantsList(Array.isArray(tenantsRes.data) ? tenantsRes.data : []);
      setAffiliates(affiliatesRes.content || []);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (e as any)?.response?.data?.message || "Falha ao carregar dashboard";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const newTenants = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let today = 0;
    let month = 0;
    for (const t of tenantsList) {
      if (!t.createdAt) continue;
      const ts = new Date(t.createdAt).getTime();
      if (Number.isNaN(ts)) continue;
      if (ts >= startOfDay) today += 1;
      if (ts >= startOfMonth) month += 1;
    }
    return { today, month };
  }, [tenantsList]);

const focusedTenant = useMemo(() => {
    if (!data || selectedTenantId === "all") return null;
    return data.tenancy.tenants.find((t) => t.id === selectedTenantId) || null;
  }, [data, selectedTenantId]);

  if (loading) {
    return (
      <div className="page">
        <div className="card" style={{ padding: 30, textAlign: "center" }}>
          Carregando dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert-danger">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="page dashboard-page">
      {/* ============ KPI ROW ============ */}
      <div className="kpi-grid">
        <KpiCard
          color="blue"
          label="Tenants ativos"
          value={fmtNumber(data.tenancy.tenantCount)}
          hint="Restaurantes operacionais"
        />
        <KpiCard
          color="purple"
          label="Afiliados ativos"
          value={fmtNumber(data.crm.affiliatesActive)}
          hint={
            data.crm.affiliatesPending > 0
              ? `${data.crm.affiliatesPending} aguardando aprovação`
              : "Nenhum pendente"
          }
        />
        <KpiCard
          color="green"
          label="Novos estabelecimentos hoje"
          value={fmtNumber(newTenants.today)}
          hint={
            newTenants.today === 0
              ? "Nenhum cadastro hoje"
              : `${newTenants.today} cadastrado${newTenants.today !== 1 ? "s" : ""} via afiliados`
          }
        />
        <KpiCard
          color="amber"
          label="Novos estabelecimentos no mês"
          value={fmtNumber(newTenants.month)}
          hint={`${data.crm.affiliatesActive} afiliado${data.crm.affiliatesActive !== 1 ? "s" : ""} ativo${data.crm.affiliatesActive !== 1 ? "s" : ""}`}
        />
      </div>

      {/* ============ TOP 3 PEDESTAL ============ */}
      <section className="card" style={{ marginTop: 14 }}>
        <div className="page-section-header">
          <h3 style={{ margin: 0 }}>🏆 Top 3 Afiliados</h3>
          <span className="muted">Ranqueado por comissão total</span>
        </div>
        <Podium affiliates={data.topAffiliates} />
      </section>

      {/* ============ FILTRO DE AFILIADO ============ */}
      <section className="card" style={{ marginTop: 14 }}>
        <div className="page-section-header" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>🎯 Visão por Afiliado</h3>
          <span className="muted">
            {selectedAffiliateId
              ? "Detalhe individual do afiliado selecionado"
              : "Selecione para inspecionar um afiliado específico"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={selectedAffiliateId}
            onChange={(e) => setSelectedAffiliateId(e.target.value)}
            className="input"
            style={{ minWidth: 280 }}
          >
            <option value="">— Nenhum (visão consolidada) —</option>
            {affiliates.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.refCode} · {a.status}
              </option>
            ))}
          </select>
          {selectedAffiliateId && (
            <button
              type="button"
              className="btn"
              onClick={() => setSelectedAffiliateId("")}
            >
              Limpar
            </button>
          )}
        </div>

        {selectedAffiliateId && (
          <AffiliateFocusPanel
            loading={loadingAffiliateDash}
            dashboard={affiliateDashboard}
          />
        )}
      </section>

      {/* ============ FILTRO DE TENANT ============ */}
      <section className="card" style={{ marginTop: 14 }}>
        <div className="page-section-header" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Visão por Tenant</h3>
          <span className="muted">
            {selectedTenantId === "all"
              ? "Mostrando lista geral"
              : `Foco em ${focusedTenant?.name || ""}`}
          </span>
        </div>
        <div className="tenant-filter-tabs">
          <button
            className={`tenant-tab ${selectedTenantId === "all" ? "active" : ""}`}
            onClick={() => setSelectedTenantId("all")}
            type="button"
          >
            Todos
          </button>
          {data.tenancy.tenants.map((t) => (
            <button
              key={t.id}
              className={`tenant-tab ${selectedTenantId === t.id ? "active" : ""}`}
              onClick={() => setSelectedTenantId(t.id)}
              type="button"
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      {/* ============ DETALHES (focused) OU TABELA (all) ============ */}
      {focusedTenant ? (
        <TenantDetails tenant={focusedTenant} />
      ) : (
        <AllTenantsTable tenants={data.tenancy.tenants} onSelect={setSelectedTenantId} />
      )}
    </div>
  );
}

// =============================================================================
// KPI Card
// =============================================================================

function KpiCard({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string;
  hint?: string;
  color?: "blue" | "green" | "purple" | "amber" | "red";
}) {
  return (
    <div className={`kpi accent-${color || "blue"}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </div>
  );
}

// =============================================================================
// Top 3 Pedestal (bronze, prata, ouro)
// =============================================================================

function Podium({ affiliates }: { affiliates: TopAffiliate[] }) {
  if (!affiliates || affiliates.length === 0) {
    return <div className="muted" style={{ padding: 30, textAlign: "center" }}>Nenhum afiliado ativo ainda.</div>;
  }
  const second = affiliates.find((a) => a.rank === 2);
  const first = affiliates.find((a) => a.rank === 1);
  const third = affiliates.find((a) => a.rank === 3);
  return (
    <div className="podium">
      {second ? <PodiumBlock affiliate={second} medal="silver" height={110} /> : <PodiumEmpty height={110} />}
      {first ? <PodiumBlock affiliate={first} medal="gold" height={150} /> : <PodiumEmpty height={150} />}
      {third ? <PodiumBlock affiliate={third} medal="bronze" height={80} /> : <PodiumEmpty height={80} />}
    </div>
  );
}

function PodiumBlock({
  affiliate,
  medal,
  height,
}: {
  affiliate: TopAffiliate;
  medal: "gold" | "silver" | "bronze";
  height: number;
}) {
  const medalIcon = medal === "gold" ? "🥇" : medal === "silver" ? "🥈" : "🥉";
  return (
    <div className="podium-col">
      <div className="podium-medal">{medalIcon}</div>
      <div className="podium-name" title={affiliate.name}>
        {affiliate.name}
      </div>
      <div className="podium-stats">
        <div className="podium-clients">{fmtNumber(affiliate.activeClients)} clientes</div>
        <div className="podium-earned">{fmtCurrency(affiliate.totalEarned)}</div>
      </div>
      <div className={`podium-bar podium-${medal}`} style={{ height: `${height}px` }}>
        <div className="podium-rank">{affiliate.rank}º</div>
      </div>
    </div>
  );
}

function PodiumEmpty({ height }: { height: number }) {
  return (
    <div className="podium-col podium-empty">
      <div className="podium-medal" style={{ opacity: 0.3 }}>—</div>
      <div className="podium-name muted">vago</div>
      <div className="podium-stats" />
      <div className="podium-bar podium-empty-bar" style={{ height: `${height}px` }} />
    </div>
  );
}

// =============================================================================
// Detalhes do tenant focado
// =============================================================================

function TenantDetails({ tenant }: { tenant: TenantMetrics }) {
  return (
    <div className="grid-2" style={{ marginTop: 14 }}>
      <div className="card">
        <div className="page-section-header" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Vendas — últimos 7 dias</h3>
          <span className="muted">{tenant.name}</span>
        </div>
        <SparklineChart points={tenant.sales.trend7Days} />
      </div>

      <div className="card">
        <div className="page-section-header" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Pedidos hoje</h3>
          <span className="muted">Mesa vs Delivery</span>
        </div>
        <DonutChart
          parts={[
            { label: "Mesa", value: tenant.orders.today.mesa, color: "#2563eb" },
            { label: "Delivery", value: tenant.orders.today.delivery, color: "#059669" },
          ]}
        />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Vendas por período</h3>
        <div className="period-list">
          <PeriodRow
            label="Hoje"
            value={tenant.sales.today}
            orders={tenant.orders.today.total}
            split={`${tenant.orders.today.mesa} mesa · ${tenant.orders.today.delivery} delivery`}
          />
          <PeriodRow
            label="Últimos 7 dias"
            value={tenant.sales.last7Days}
            orders={tenant.orders.last7Days.total}
            split={`${tenant.orders.last7Days.mesa} mesa · ${tenant.orders.last7Days.delivery} delivery`}
          />
          <PeriodRow
            label="Este mês"
            value={tenant.sales.thisMonth}
            orders={tenant.orders.thisMonth.total}
            split={`${tenant.orders.thisMonth.mesa} mesa · ${tenant.orders.thisMonth.delivery} delivery`}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Equipe — {tenant.users.total} usuários ativos</h3>
        <UserRoleList byRole={tenant.users.byRole} />
      </div>
    </div>
  );
}

function PeriodRow({
  label,
  value,
  orders,
  split,
}: {
  label: string;
  value: number;
  orders: number;
  split: string;
}) {
  return (
    <div className="period-row">
      <div>
        <div className="period-label">{label}</div>
        <div className="period-split">{split}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="period-value">{fmtCurrency(value)}</div>
        <div className="period-orders">{fmtNumber(orders)} pedidos</div>
      </div>
    </div>
  );
}

function UserRoleList({ byRole }: { byRole: Record<string, number> }) {
  const entries = Object.entries(byRole).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) {
    return <div className="muted">Nenhum usuário cadastrado.</div>;
  }
  const total = entries.reduce((s, [, c]) => s + c, 0);
  return (
    <ul className="role-list">
      {entries.map(([role, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <li key={role}>
            <div className="role-row-top">
              <span className="role-name">{role}</span>
              <span className="role-count">{count}</span>
            </div>
            <div className="role-bar">
              <div className="role-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// =============================================================================
// Tabela "All Tenants"
// =============================================================================

function AllTenantsTable({
  tenants,
  onSelect,
}: {
  tenants: TenantMetrics[];
  onSelect: (id: number) => void;
}) {
  if (!tenants || tenants.length === 0) {
    return (
      <div className="card" style={{ marginTop: 14, padding: 30, textAlign: "center" }}>
        Nenhum tenant ativo. Provisione o primeiro pelo menu Tenants.
      </div>
    );
  }
  return (
    <div className="card" style={{ marginTop: 14, padding: 0, overflow: "hidden" }}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th style={{ textAlign: "right" }}>Vendas hoje</th>
              <th style={{ textAlign: "right" }}>Pedidos hoje</th>
              <th>Mesa / Delivery</th>
              <th style={{ textAlign: "right" }}>Usuários</th>
              <th>Última atividade</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr
                key={t.id}
                onClick={() => onSelect(t.id)}
                style={{ cursor: "pointer" }}
                className="row-hover"
              >
                <td>
                  <div style={{ fontWeight: 700 }}>{t.name}</div>
                  <div className="muted" style={{ fontSize: 11 }}>
                    <code>{t.slug}</code>
                  </div>
                </td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtCurrency(t.sales.today)}</td>
                <td style={{ textAlign: "right" }}>{fmtNumber(t.orders.today.total)}</td>
                <td>
                  <span className="badge blue" style={{ marginRight: 4 }}>
                    {t.orders.today.mesa} mesa
                  </span>
                  <span className="badge ok">{t.orders.today.delivery} delivery</span>
                </td>
                <td style={{ textAlign: "right" }}>{fmtNumber(t.users.total)}</td>
                <td style={{ fontSize: 12 }}>
                  {t.lastSeenAt
                    ? new Date(t.lastSeenAt).toLocaleString("pt-BR")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// SVG Charts inline
// =============================================================================

function SparklineChart({ points }: { points: DailyPoint[] }) {
  if (!points || points.length === 0) {
    return <div className="muted" style={{ padding: 20 }}>Sem dados</div>;
  }
  const width = 600;
  const height = 200;
  const padding = 30;
  const max = Math.max(...points.map((p) => p.value), 1);
  const stepX = (width - padding * 2) / Math.max(points.length - 1, 1);

  const pathPoints = points.map((p, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (p.value / max) * (height - padding * 2);
    return { x, y, p };
  });

  const linePath = pathPoints
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${(padding + (points.length - 1) * stepX).toFixed(1)} ${height - padding}` +
    ` L ${padding} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="grad-sparkline" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid horizontal */}
      {[0.25, 0.5, 0.75].map((f) => {
        const y = height - padding - f * (height - padding * 2);
        return (
          <line
            key={f}
            x1={padding}
            x2={width - padding}
            y1={y}
            y2={y}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="1"
          />
        );
      })}
      <path d={areaPath} fill="url(#grad-sparkline)" />
      <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" />
      {pathPoints.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r="4" fill="#2563eb" stroke="#fff" strokeWidth="2" />
          <text
            x={pt.x}
            y={pt.y - 10}
            textAnchor="middle"
            fontSize="10"
            fill="#1a1d23"
            fontWeight="600"
          >
            {fmtCurrency(pt.p.value)}
          </text>
          <text
            x={pt.x}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(55,65,81,0.72)"
          >
            {shortDate(pt.p.date)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function DonutChart({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (total === 0) {
    return (
      <div className="muted" style={{ textAlign: "center", padding: 40 }}>
        Sem pedidos finalizados hoje
      </div>
    );
  }
  const size = 180;
  const radius = 75;
  const innerRadius = 48;
  const cx = size / 2;
  const cy = size / 2;

  let cumAngle = -Math.PI / 2;
  const arcs = parts.map((p) => {
    if (p.value === 0) return { ...p, path: "" };
    const angle = (p.value / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const xi1 = cx + innerRadius * Math.cos(startAngle);
    const yi1 = cy + innerRadius * Math.sin(startAngle);
    const xi2 = cx + innerRadius * Math.cos(endAngle);
    const yi2 = cy + innerRadius * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${xi1} ${yi1} Z`;
    return { ...p, path };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
      <svg width={size} height={size}>
        {arcs.map((arc, i) =>
          arc.path ? <path key={i} d={arc.path} fill={arc.color} stroke="#fff" strokeWidth="2" /> : null,
        )}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="#1a1d23">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="rgba(55,65,81,0.72)">
          pedidos hoje
        </text>
      </svg>
      <div className="donut-legend">
        {arcs.map((arc, i) => {
          const pct = total > 0 ? ((arc.value / total) * 100).toFixed(0) : "0";
          return (
            <div key={i} className="donut-legend-item">
              <span className="donut-color-dot" style={{ background: arc.color }} />
              <span className="donut-label">{arc.label}</span>
              <span className="donut-value">
                {arc.value} <small>({pct}%)</small>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Painel focado em um afiliado (usado no filtro do dashboard admin)
// =============================================================================

function AffiliateFocusPanel({
  loading,
  dashboard,
}: {
  loading: boolean;
  dashboard: AdminAffiliateDashboard | null;
}) {
  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>
        Carregando dashboard do afiliado...
      </div>
    );
  }
  if (!dashboard) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#fca5a5" }}>
        Não foi possível carregar o dashboard deste afiliado.
      </div>
    );
  }

  const trend = dashboard.productionTrend || [];
  const maxDec = Math.max(1, ...trend.map((p) => p.decodes));
  const totalDec = trend.reduce((s, p) => s + p.decodes, 0);
  const peak = trend.reduce((best, p) => (p.decodes > best.decodes ? p : best), trend[0] || { date: "", decodes: 0, commissionAmount: 0 });

  return (
    <div style={{ marginTop: 14 }}>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <KpiCard color="green" label="Cadastros hoje" value={fmtNumber(dashboard.decodesToday)} />
        <KpiCard color="amber" label="Cadastros no mês" value={fmtNumber(dashboard.decodesThisMonth)} />
        <KpiCard color="blue" label="Total de decodes" value={fmtNumber(dashboard.decodesTotal)} />
        <KpiCard color="purple" label="Ativos agora" value={fmtNumber(dashboard.activeClients)} hint={`${dashboard.totalConversions} conversões lifetime`} />
      </div>

      <div className="kpi-grid" style={{ marginTop: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <KpiCard color="green" label="Comissão hoje" value={fmtCurrency(dashboard.dailyEarned)} />
        <KpiCard color="amber" label="Estimativa do mês" value={fmtCurrency(dashboard.currentMonthEstimate)} />
        <KpiCard color="blue" label="Mês anterior" value={fmtCurrency(dashboard.lastMonthEarned)} />
        <KpiCard color="purple" label="Total acumulado" value={fmtCurrency(dashboard.lifetimeEarned)} hint="pago + aprovado + pendente" />
      </div>

      <div className="kpi-grid" style={{ marginTop: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <KpiCard color="green" label="Já repassado" value={fmtCurrency(dashboard.alreadyPaid)} />
        <KpiCard color="amber" label="A receber" value={fmtCurrency(dashboard.readyForPayout)} hint="aprovado, aguardando payout" />
        <KpiCard color="red" label="Em carência" value={fmtCurrency(dashboard.pendingCarencia)} hint="aguardando 2 meses" />
        <KpiCard color="blue" label="Taxa" value={`${dashboard.commissionRate}%`} />
      </div>

      <div className="card" style={{ marginTop: 14, padding: 18 }}>
        <div className="page-section-header" style={{ marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>📈 Produção — últimos 30 dias</h3>
          <span className="muted">
            {totalDec} cadastros · pico {peak.decodes} em {peak.date ? shortDate(peak.date) : "-"}
          </span>
        </div>
        {trend.length === 0 ? (
          <div className="muted" style={{ padding: 10 }}>Sem dados.</div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80, paddingTop: 6 }}>
            {trend.map((p, i) => {
              const h = (p.decodes / maxDec) * 72;
              const isZero = p.decodes === 0;
              return (
                <div
                  key={i}
                  title={`${shortDate(p.date)}: ${p.decodes} cadastros · ${fmtCurrency(p.commissionAmount)}`}
                  style={{
                    flex: 1,
                    minWidth: 4,
                    height: isZero ? 2 : Math.max(4, h),
                    background: isZero ? "rgba(239, 68, 68, 0.6)" : p.decodes === peak.decodes ? "#ff9147" : "#ff6b1a",
                    borderRadius: 2,
                    opacity: p.decodes === peak.decodes ? 1 : 0.85,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
