import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";

// =============================================================================
// Catálogo dos 3 planos da DECODE + descontos + stats
// Renderizado no topo de PlanosPage como hero/overview
// =============================================================================

type PlanDef = {
  key: string;
  name: string;
  price: number;
  highlight?: "popular" | "complete";
  emoji: string;
  features: { label: string; included: boolean }[];
};

const PLANS: PlanDef[] = [
  {
    key: "mesas",
    name: "Gestão de Mesas",
    price: 79.9,
    emoji: "🍽️",
    features: [
      { label: "Dashboard operacional", included: true },
      { label: "Gestão de mesas e comandas", included: true },
      { label: "PDV (Ponto de Venda)", included: true },
      { label: "Cozinha (KDS)", included: true },
      { label: "Avaliações de clientes", included: true },
      { label: "Controle de permissões", included: true },
      { label: "Delivery e rotas", included: false },
      { label: "Robô WhatsApp", included: false },
      { label: "Áreas de entrega", included: false },
    ],
  },
  {
    key: "delivery",
    name: "Gestão Delivery",
    price: 99.9,
    highlight: "popular",
    emoji: "🛵",
    features: [
      { label: "Dashboard operacional", included: true },
      { label: "Painel de delivery completo", included: true },
      { label: "Robô WhatsApp + IA", included: true },
      { label: "Áreas de entrega com mapa", included: true },
      { label: "Rotas e motoboys", included: true },
      { label: "Cupons e promoções", included: true },
      { label: "Mensagens em massa", included: true },
      { label: "Avaliações de clientes", included: true },
      { label: "Gestão de mesas", included: false },
      { label: "PDV (Ponto de Venda)", included: false },
    ],
  },
  {
    key: "completa",
    name: "Gestão Completa",
    price: 149.9,
    highlight: "complete",
    emoji: "💎",
    features: [
      { label: "TUDO dos planos anteriores", included: true },
      { label: "Mesas + Delivery integrados", included: true },
      { label: "PDV + Cozinha + Rotas", included: true },
      { label: "WhatsApp + IA + Cupons", included: true },
      { label: "Mensagens + Avaliações", included: true },
      { label: "Permissões avançadas", included: true },
      { label: "Suporte prioritário", included: true },
    ],
  },
];

const DISCOUNTS = [
  {
    months: "2 a 5 meses",
    pct: 5,
    finalCompleta: 149.9 * 0.95,
    label: "Comece a economizar",
  },
  {
    months: "6 a 11 meses",
    pct: 10,
    finalCompleta: 149.9 * 0.9,
    label: "Mais economia",
  },
  {
    months: "12 meses",
    pct: 15,
    finalCompleta: 149.9 * 0.85,
    label: "Melhor custo-benefício",
    highlight: true,
  },
];

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

type SubscriptionLite = {
  id: string;
  planName: string;
  status: string;
  price: number;
};

type PlanStats = {
  key: string;
  name: string;
  active: number;
  monthlyRevenue: number;
};

export default function PlansCatalog() {
  const [subs, setSubs] = useState<SubscriptionLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const res = await api.get("/api/subscriptions", { params: { size: 1000 } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list: SubscriptionLite[] = res.data?.content ?? res.data ?? [];
      setSubs(Array.isArray(list) ? list : []);
    } catch {
      setSubs([]);
    } finally {
      setLoading(false);
    }
  }

  const planStats: PlanStats[] = useMemo(() => {
    return PLANS.map((p) => {
      const active = subs.filter(
        (s) =>
          s.status === "ACTIVE" &&
          (s.planName || "").toLowerCase().includes(p.key.toLowerCase()),
      );
      const monthlyRevenue = active.reduce((sum, s) => sum + (s.price || 0), 0);
      return { key: p.key, name: p.name, active: active.length, monthlyRevenue };
    });
  }, [subs]);

  const totals = useMemo(() => {
    const totalActive = planStats.reduce((s, p) => s + p.active, 0);
    const mrr = planStats.reduce((s, p) => s + p.monthlyRevenue, 0);
    return { totalActive, mrr };
  }, [planStats]);

  return (
    <div className="plans-catalog">
      {/* ============ STATS GLOBAIS ============ */}
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="kpi accent-blue">
          <div className="kpi-label">Assinaturas ativas</div>
          <div className="kpi-value">{totals.totalActive}</div>
          <div className="kpi-hint">Todos os planos somados</div>
        </div>
        <div className="kpi accent-green">
          <div className="kpi-label">MRR</div>
          <div className="kpi-value">{fmtCurrency(totals.mrr)}</div>
          <div className="kpi-hint">Receita mensal recorrente</div>
        </div>
        <div className="kpi accent-purple">
          <div className="kpi-label">ARR projetado</div>
          <div className="kpi-value">{fmtCurrency(totals.mrr * 12)}</div>
          <div className="kpi-hint">12× MRR atual</div>
        </div>
        <div className="kpi accent-amber">
          <div className="kpi-label">Ticket médio</div>
          <div className="kpi-value">
            {fmtCurrency(totals.totalActive > 0 ? totals.mrr / totals.totalActive : 0)}
          </div>
          <div className="kpi-hint">Por assinatura</div>
        </div>
      </div>

      {/* ============ 3 PLANOS ============ */}
      <div className="page-section-header" style={{ marginTop: 8 }}>
        <h3 style={{ margin: 0 }}>Catálogo de Planos</h3>
        <span className="muted">3 opções disponíveis</span>
      </div>

      <div className="plans-grid">
        {PLANS.map((plan) => {
          const stats = planStats.find((s) => s.key === plan.key);
          return (
            <div
              key={plan.key}
              className={`plan-card ${plan.highlight === "popular" ? "plan-popular" : ""} ${
                plan.highlight === "complete" ? "plan-complete" : ""
              }`}
            >
              {plan.highlight === "popular" && <div className="plan-badge">⭐ Mais popular</div>}
              {plan.highlight === "complete" && <div className="plan-badge">💎 Tudo incluso</div>}

              <div className="plan-emoji">{plan.emoji}</div>
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                {fmtCurrency(plan.price)}
                <small>/mês</small>
              </div>

              {stats && (
                <div className="plan-active-stats">
                  <span className="plan-active-count">{stats.active}</span> assinaturas ativas ·{" "}
                  <span className="plan-active-mrr">{fmtCurrency(stats.monthlyRevenue)}</span> MRR
                </div>
              )}

              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f.label} className={f.included ? "f-on" : "f-off"}>
                    {f.included ? "✓" : "✗"} {f.label}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* ============ DESCONTOS POR DURAÇÃO ============ */}
      <div className="page-section-header" style={{ marginTop: 18 }}>
        <h3 style={{ margin: 0 }}>💰 Mais tempo, mais economia</h3>
        <span className="muted">Descontos acumulativos por compromisso</span>
      </div>

      <div className="discount-grid">
        {DISCOUNTS.map((d) => (
          <div key={d.months} className={`discount-card ${d.highlight ? "discount-best" : ""}`}>
            {d.highlight && <div className="discount-badge">🏆 Melhor custo-benefício</div>}
            <div className="discount-months">{d.months}</div>
            <div className="discount-pct">{d.pct}% OFF</div>
            <div className="discount-final">
              {fmtCurrency(d.finalCompleta)}
              <small>/mês</small>
            </div>
            <div className="discount-label muted">no plano Completa</div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          Carregando estatísticas de assinaturas...
        </div>
      )}
    </div>
  );
}
