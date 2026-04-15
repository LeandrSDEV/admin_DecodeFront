import { useMemo, useState } from "react";

// =============================================================================
// Página interna do AFILIADO — material de venda
// Rota: /afiliado/material-vendas (dentro do AffiliateShell)
//
// Objetivo: dar ao afiliado APROVADO uma página única, intuitiva e visual
// com tudo que ele precisa pra vender o sistema:
//
//   1. Pitch curto: o que é a gestão e por que adotar
//   2. Catálogo dos 3 planos (mesmo visual do landing externo)
//   3. Tiers de desconto por tempo
//   4. Calculadora interativa: "quanto você ganha por X clientes"
//   5. Diferenciais bullet
//   6. Como o fluxo de comissão funciona
// =============================================================================

const COMMISSION_RATE = 0.15; // 15%

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

type PlanOption = { key: string; name: string; price: number; emoji: string };

const PLANS: PlanOption[] = [
  { key: "mesas", name: "Gestão de Mesas", price: 79.9, emoji: "🍽️" },
  { key: "delivery", name: "Gestão Delivery", price: 99.9, emoji: "🛵" },
  { key: "completa", name: "Gestão Completa", price: 149.9, emoji: "💎" },
];

const FEATURES_BY_PLAN: Record<string, string[]> = {
  mesas: [
    "Dashboard operacional",
    "Gestão de mesas e comandas",
    "PDV (Ponto de Venda)",
    "Cozinha (KDS)",
    "Avaliações de clientes",
    "Controle de permissões",
  ],
  delivery: [
    "Painel de delivery completo",
    "Robô WhatsApp + IA",
    "Áreas de entrega com mapa",
    "Rotas e motoboys",
    "Cupons e promoções",
    "Mensagens em massa",
    "Avaliações de clientes",
  ],
  completa: [
    "TUDO dos planos anteriores",
    "Mesas + Delivery integrados",
    "PDV + Cozinha + Rotas",
    "WhatsApp + IA + Cupons",
    "Permissões avançadas",
    "Suporte prioritário",
  ],
};

const DIFERENCIAIS = [
  {
    icon: "⚡",
    title: "Implantação rápida",
    text: "Sistema operacional em minutos, sem instalação complicada nem treinamento extenso.",
  },
  {
    icon: "🤖",
    title: "Robô WhatsApp + IA",
    text: "Atendimento automatizado que entende pedidos por texto, foto e áudio. Reduz fila e aumenta conversão.",
  },
  {
    icon: "📊",
    title: "Dashboard em tempo real",
    text: "O dono vê vendas, pedidos, equipe e tudo mais sem precisar de planilha.",
  },
  {
    icon: "🛵",
    title: "Delivery completo",
    text: "Áreas de entrega com mapa, rotas otimizadas, motoboys, taxa por km, cupons. Mata iFood pra quem quer escalar.",
  },
  {
    icon: "🍽️",
    title: "PDV + KDS integrados",
    text: "Garçom no celular, cozinha vendo o pedido na hora, fechamento de comanda em 1 clique.",
  },
  {
    icon: "🔒",
    title: "Permissões granulares",
    text: "Cada cargo (admin, garçom, cozinha, caixa) vê só o que precisa. Controle total.",
  },
];

const FLUXO_COMISSAO = [
  { step: "1", title: "Você indica", text: "Compartilha seu link único de afiliado com o restaurante interessado." },
  { step: "2", title: "Cliente assina", text: "Quando o cliente assina qualquer plano, fica vinculado a você automaticamente." },
  { step: "3", title: "Carência de 2 meses", text: "Pra evitar fraude, comissão entra em carência por 2 meses (cliente precisa permanecer)." },
  { step: "4", title: "Pagamento via PIX", text: "Após carência, comissão é liberada e paga via PIX no fechamento mensal." },
];

export default function AfiliadoMaterialVendasPage() {
  const [clientCount, setClientCount] = useState(5);
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>("delivery");

  const selectedPlan = PLANS.find((p) => p.key === selectedPlanKey) || PLANS[0];

  const calc = useMemo(() => {
    const monthly = selectedPlan.price * clientCount * COMMISSION_RATE;
    const yearly = monthly * 12;
    return { monthly, yearly };
  }, [clientCount, selectedPlan]);

  return (
    <div className="page sales-pitch-page">
      {/* ========== HERO ========== */}
      <div className="sales-hero">
        <div className="sales-eyebrow">Material de venda exclusivo</div>
        <h1>Você indica. O cliente economiza tempo. Você ganha todo mês.</h1>
        <p>
          Esse é o resumo do que você precisa pra vender o sistema de gestão da DECODE: o que ele faz,
          quanto custa, por que vale a pena, e quanto você ganha em cada indicação.
        </p>
      </div>

      {/* ========== CALCULADORA ========== */}
      <section className="sales-calculator card">
        <div className="page-section-header">
          <h3 style={{ margin: 0 }}>📊 Calculadora — quanto você pode ganhar?</h3>
          <span className="muted">Comissão de {(COMMISSION_RATE * 100).toFixed(0)}% sobre o valor do plano</span>
        </div>

        <div className="calc-body">
          <div className="calc-left">
            <label className="calc-label">Quantos clientes você acha que consegue fechar?</label>
            <div className="calc-slider-wrap">
              <input
                type="range"
                min="1"
                max="50"
                value={clientCount}
                onChange={(e) => setClientCount(Number(e.target.value))}
                className="calc-slider"
              />
              <div className="calc-slider-value">
                {clientCount} {clientCount === 1 ? "cliente" : "clientes"}
              </div>
            </div>

            <label className="calc-label" style={{ marginTop: 16 }}>
              Plano médio que você pretende vender:
            </label>
            <div className="calc-plan-buttons">
              {PLANS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`calc-plan-btn ${selectedPlanKey === p.key ? "active" : ""}`}
                  onClick={() => setSelectedPlanKey(p.key)}
                >
                  <div className="calc-plan-emoji">{p.emoji}</div>
                  <div className="calc-plan-price">{fmtCurrency(p.price)}</div>
                  <div className="calc-plan-name">{p.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="calc-right">
            <div className="calc-result-label">Sua renda mensal estimada:</div>
            <div className="calc-result-value calc-monthly">{fmtCurrency(calc.monthly)}</div>

            <div className="calc-result-label" style={{ marginTop: 16 }}>
              Anualmente (12 meses):
            </div>
            <div className="calc-result-value calc-yearly">{fmtCurrency(calc.yearly)}</div>

            <div className="calc-formula muted">
              {clientCount} × {fmtCurrency(selectedPlan.price)} ×{" "}
              {(COMMISSION_RATE * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </section>

      {/* ========== PLANOS ========== */}
      <section style={{ marginTop: 18 }}>
        <div className="page-section-header">
          <h3 style={{ margin: 0 }}>💼 Os 3 planos disponíveis</h3>
          <span className="muted">Use esse comparativo na conversa com o lead</span>
        </div>

        <div className="plans-grid" style={{ marginTop: 12 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`plan-card ${plan.key === "delivery" ? "plan-popular" : ""} ${
                plan.key === "completa" ? "plan-complete" : ""
              }`}
            >
              {plan.key === "delivery" && <div className="plan-badge">⭐ Mais popular</div>}
              {plan.key === "completa" && <div className="plan-badge">💎 Tudo incluso</div>}

              <div className="plan-emoji">{plan.emoji}</div>
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                {fmtCurrency(plan.price)}
                <small>/mês</small>
              </div>

              <div className="plan-active-stats">
                Sua comissão mensal por cliente:{" "}
                <span className="plan-active-mrr">
                  {fmtCurrency(plan.price * COMMISSION_RATE)}
                </span>
              </div>

              <ul className="plan-features">
                {FEATURES_BY_PLAN[plan.key].map((f) => (
                  <li key={f} className="f-on">
                    ✓ {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ========== DIFERENCIAIS ========== */}
      <section style={{ marginTop: 24 }}>
        <div className="page-section-header">
          <h3 style={{ margin: 0 }}>✨ Por que o cliente deve aderir?</h3>
          <span className="muted">Argumentos pra usar na hora da venda</span>
        </div>

        <div className="diferencial-grid">
          {DIFERENCIAIS.map((d) => (
            <div key={d.title} className="diferencial-card">
              <div className="diferencial-icon">{d.icon}</div>
              <div className="diferencial-title">{d.title}</div>
              <div className="diferencial-text">{d.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== FLUXO DE COMISSÃO ========== */}
      <section className="card" style={{ marginTop: 24 }}>
        <div className="page-section-header">
          <h3 style={{ margin: 0 }}>💰 Como funciona o pagamento da sua comissão</h3>
          <span className="muted">Fluxo simples e transparente</span>
        </div>

        <div className="fluxo-grid">
          {FLUXO_COMISSAO.map((f) => (
            <div key={f.step} className="fluxo-step">
              <div className="fluxo-step-number">{f.step}</div>
              <div className="fluxo-step-title">{f.title}</div>
              <div className="fluxo-step-text">{f.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== CTA FINAL ========== */}
      <section className="sales-cta card">
        <div>
          <h3 style={{ margin: 0 }}>Pronto pra vender?</h3>
          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
            Pega seu link de afiliado no menu Perfil e compartilhe com restaurantes interessados.
          </p>
        </div>
      </section>
    </div>
  );
}
