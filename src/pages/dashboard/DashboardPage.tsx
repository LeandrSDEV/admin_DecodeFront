import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import LineAreaChart from "../../components/charts/LineAreaChart";
import BarChart from "../../components/charts/BarChart";
import StatusRow from "./StatusRow";
import KpiGrid from "./KpiGrid";

type MeResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type DashboardSummary = {
  applicationStatus: string;
  monitoredSiteStatus: string;
  incidentsOpen: number;
  lastCheckAt: string;
  message: string;
};

type Decode = {
  id: string;
  status?: string | null;
  createdAt?: string | null;
};

type Affiliate = {
  id: string;
  status: string;
  createdAt?: string | null;
};

type Subscription = {
  id: string;
  planName: string;
  price: number;
  status: string;
  active: boolean;
  createdAt?: string | null;
};

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PLAN_TYPES = ["Gestão de Mesas", "Gestão Delivery", "Gestão Completa"] as const;

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function lastNMonths(n: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTHS_PT[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
    out.push({ key, label });
  }
  return out;
}

function monthKey(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [decodes, setDecodes] = useState<Decode[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const dashCfg = useMemo(() => {
    try {
      const raw = localStorage.getItem("decode.dashboard.config");
      if (!raw) throw new Error("no");
      const p = JSON.parse(raw);
      return {
        title: p.title ?? "Dashboard",
        subtitle: p.subtitle ?? "Visão geral",
      };
    } catch {
      return { title: "Dashboard", subtitle: "Visão geral" };
    }
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadAll() {
      try {
        const [meRes, sumRes, decodesRes, affRes, subsRes] = await Promise.all([
          api.get("/api/auth/me"),
          api.get("/api/dashboard/summary"),
          api.get("/api/decodes?size=1000"),
          api.get("/api/admin/affiliates?size=1000"),
          api.get("/api/subscriptions?size=1000"),
        ]);
        if (!alive) return;
        setMe(meRes.data);
        setSummary(sumRes.data);
        setDecodes((decodesRes.data?.content ?? []) as Decode[]);
        setAffiliates((affRes.data?.content ?? []) as Affiliate[]);
        setSubscriptions((subsRes.data?.content ?? []) as Subscription[]);
      } catch {
        if (!alive) return;
        setMe({ id: "-", name: "Usuário", email: "-", role: "-" });
        setSummary({
          applicationStatus: "-",
          monitoredSiteStatus: "-",
          incidentsOpen: 0,
          lastCheckAt: "",
          message: "Sem dados da API.",
        });
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAll();
    return () => {
      alive = false;
    };
  }, []);

  // ================= KPIs numéricos =================
  const totalDecodes = decodes.length;
  const totalAffiliates = affiliates.length;

  const totalPlanValue = useMemo(
    () =>
      subscriptions
        .filter((s) => s.active && s.status === "ACTIVE")
        .reduce((acc, s) => acc + (Number(s.price) || 0), 0),
    [subscriptions]
  );

  // ================= Séries mensais (últimos 12 meses) =================
  const months = useMemo(() => lastNMonths(12), []);

  const decodesPorMes = useMemo(() => {
    const counts = new Map<string, number>(months.map((m) => [m.key, 0]));
    for (const d of decodes) {
      const k = monthKey(d.createdAt);
      if (k && counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return months.map((m) => ({ label: m.label, value: counts.get(m.key) ?? 0 }));
  }, [decodes, months]);

  const planosPorMes = useMemo(() => {
    const counts = new Map<string, number>(months.map((m) => [m.key, 0]));
    for (const s of subscriptions) {
      const k = monthKey(s.createdAt);
      if (k && counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return months.map((m) => ({ label: m.label, value: counts.get(m.key) ?? 0 }));
  }, [subscriptions, months]);

  const valorPlanosPorMes = useMemo(() => {
    const sums = new Map<string, number>(months.map((m) => [m.key, 0]));
    for (const s of subscriptions) {
      const k = monthKey(s.createdAt);
      if (k && sums.has(k)) sums.set(k, (sums.get(k) ?? 0) + (Number(s.price) || 0));
    }
    return months.map((m) => ({ label: m.label, value: sums.get(m.key) ?? 0 }));
  }, [subscriptions, months]);

  const planosPorTipo = useMemo(() => {
    const counts = new Map<string, number>(PLAN_TYPES.map((p) => [p, 0]));
    const revenue = new Map<string, number>(PLAN_TYPES.map((p) => [p, 0]));
    for (const s of subscriptions) {
      if (!s.active || s.status !== "ACTIVE") continue;
      const name = s.planName?.trim();
      if (!name || !counts.has(name)) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
      revenue.set(name, (revenue.get(name) ?? 0) + (Number(s.price) || 0));
    }
    const totalCount = PLAN_TYPES.reduce((acc, p) => acc + (counts.get(p) ?? 0), 0);
    return PLAN_TYPES.map((p) => ({
      label: p,
      count: counts.get(p) ?? 0,
      revenue: revenue.get(p) ?? 0,
      pct: totalCount > 0 ? ((counts.get(p) ?? 0) / totalCount) * 100 : 0,
    }));
  }, [subscriptions]);

  const afiliadosPorMes = useMemo(() => {
    const counts = new Map<string, number>(months.map((m) => [m.key, 0]));
    for (const a of affiliates) {
      const k = monthKey(a.createdAt);
      if (k && counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return months.map((m) => ({ label: m.label, value: counts.get(m.key) ?? 0 }));
  }, [affiliates, months]);

  if (loading) {
    return <div className="page center">Carregando…</div>;
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{dashCfg.title}</h1>
          <p className="page-sub">
            {dashCfg.subtitle} • Olá, <strong>{me?.name ?? "-"}</strong> • {summary?.message}
          </p>
        </div>
        <StatusRow summary={summary} />
      </div>

      <KpiGrid
        items={[
          {
            label: "Decodes",
            value: totalDecodes.toLocaleString("pt-BR"),
            hint: "Total cadastrados",
          },
          {
            label: "Montante",
            value: BRL(totalPlanValue),
            hint: "Soma das assinaturas ativas",
          },
          {
            label: "Afiliados",
            value: totalAffiliates.toLocaleString("pt-BR"),
            hint: "Total cadastrados",
          },
        ]}
      />

      <section className="grid-2" style={{ marginTop: 14 }}>
        <div className="panel accent-blue">
          <LineAreaChart
            title="Decodes criados por mês"
            subtitle="Últimos 12 meses"
            data={decodesPorMes}
          />
        </div>
        <div className="panel accent-green">
          <LineAreaChart
            title="Planos criados por mês"
            subtitle="Últimos 12 meses"
            data={planosPorMes}
          />
        </div>
      </section>

      <section className="grid-1" style={{ marginTop: 14 }}>
        <div className="panel accent-blue">
          <BarChart
            title="Valor dos planos por mês"
            subtitle="Soma de assinaturas criadas (R$)"
            data={valorPlanosPorMes}
            valuePrefix="R$ "
          />
        </div>
      </section>

      <section className="grid-2" style={{ marginTop: 14 }}>
        <div className="panel accent-green">
          <LineAreaChart
            title="Afiliados criados por mês"
            subtitle="Últimos 12 meses"
            data={afiliadosPorMes}
          />
        </div>
        <div className="panel accent-blue">
          <PlanosIndiceCard data={planosPorTipo} />
        </div>
      </section>
    </div>
  );
}

const PLAN_ACCENTS: Record<string, { bg: string; fg: string; bar: string }> = {
  "Gestão de Mesas": { bg: "#eff6ff", fg: "#1d4ed8", bar: "#3b82f6" },
  "Gestão Delivery": { bg: "#fef3c7", fg: "#b45309", bar: "#f59e0b" },
  "Gestão Completa": { bg: "#ecfdf5", fg: "#047857", bar: "#10b981" },
};

function PlanosIndiceCard({
  data,
}: {
  data: Array<{ label: string; count: number; revenue: number; pct: number }>;
}) {
  const totalCount = data.reduce((a, d) => a + d.count, 0);
  const totalRevenue = data.reduce((a, d) => a + d.revenue, 0);
  return (
    <div className="plan-index">
      <div className="plan-index-head">
        <div>
          <div className="plan-index-title">Planos ativos por tipo</div>
          <div className="plan-index-sub">
            {totalCount} assinaturas • {BRL(totalRevenue)}
          </div>
        </div>
      </div>

      <div className="plan-index-list">
        {data.map((d) => {
          const acc = PLAN_ACCENTS[d.label] ?? {
            bg: "#f3f4f6",
            fg: "#111827",
            bar: "#6b7280",
          };
          return (
            <div key={d.label} className="plan-index-item">
              <div className="plan-index-row">
                <div className="plan-index-label">
                  <span
                    className="plan-index-dot"
                    style={{ background: acc.bar }}
                  />
                  <span>{d.label}</span>
                </div>
                <div className="plan-index-count" style={{ color: acc.fg }}>
                  {d.count}
                </div>
              </div>
              <div className="plan-index-bar-track">
                <div
                  className="plan-index-bar-fill"
                  style={{
                    width: `${d.pct}%`,
                    background: acc.bar,
                  }}
                />
              </div>
              <div className="plan-index-row plan-index-foot">
                <span className="plan-index-pct">{d.pct.toFixed(0)}%</span>
                <span className="plan-index-rev">{BRL(d.revenue)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
