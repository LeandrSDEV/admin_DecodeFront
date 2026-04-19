import { useEffect, useMemo, useState } from "react";
import { fetchMe } from "../../services/affiliatePortalService";

// =============================================================================
// Página interna do AFILIADO — material de venda
// Rota: /afiliado/material-vendas (dentro do AffiliateShell)
// =============================================================================

const DEFAULT_COMMISSION_RATE = 0.15; // fallback enquanto o /me não respondeu

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
  const [commissionRate, setCommissionRate] = useState(DEFAULT_COMMISSION_RATE);

  useEffect(() => {
    fetchMe()
      .then((me) => {
        // backend retorna o valor em % (ex: 15 para 15%); normaliza para fração
        if (typeof me.commissionRate === "number" && me.commissionRate > 0) {
          setCommissionRate(me.commissionRate / 100);
        }
      })
      .catch(() => {
        // mantém o default se /me falhar
      });
  }, []);

  const selectedPlan = PLANS.find((p) => p.key === selectedPlanKey) || PLANS[0];

  const calc = useMemo(() => {
    const monthly = selectedPlan.price * clientCount * commissionRate;
    const yearly = monthly * 12;
    return { monthly, yearly };
  }, [clientCount, selectedPlan, commissionRate]);

  return (
    <div className="mv-page">
      <style>{MATERIAL_VENDAS_CSS}</style>
      {/* ========== HERO ========== */}
      <div className="mv-hero">
        <div className="mv-eyebrow">💎 Material de venda exclusivo</div>
        <h1>Você indica. O cliente economiza tempo.<br /><span className="mv-accent">Você ganha todo mês.</span></h1>
        <p>
          Tudo que você precisa pra vender o sistema de gestão da DECODE: o que ele faz,
          quanto custa, por que vale a pena, e quanto você ganha em cada indicação.
        </p>
      </div>

      {/* ========== CALCULADORA ========== */}
      <section className="mv-section mv-calc">
        <div className="mv-section-head">
          <h3>📊 Calculadora — quanto você pode ganhar?</h3>
          <span className="mv-muted">Comissão de {(commissionRate * 100).toFixed(0)}% sobre o valor do plano</span>
        </div>

        <div className="mv-calc-body">
          <div className="mv-calc-left">
            <label className="mv-calc-label">Quantos clientes você acha que consegue fechar?</label>
            <input
              type="range"
              min="1"
              max="50"
              value={clientCount}
              onChange={(e) => setClientCount(Number(e.target.value))}
              className="mv-slider"
            />
            <div className="mv-slider-value">
              {clientCount} <small>{clientCount === 1 ? "cliente" : "clientes"}</small>
            </div>

            <label className="mv-calc-label" style={{ marginTop: 22 }}>
              Plano médio que você pretende vender:
            </label>
            <div className="mv-plan-buttons">
              {PLANS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`mv-plan-btn ${selectedPlanKey === p.key ? "active" : ""}`}
                  onClick={() => setSelectedPlanKey(p.key)}
                >
                  <div className="mv-plan-btn-emoji">{p.emoji}</div>
                  <div className="mv-plan-btn-price">{fmtCurrency(p.price)}</div>
                  <div className="mv-plan-btn-name">{p.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mv-calc-right">
            <div className="mv-result-label">Sua renda mensal estimada</div>
            <div className="mv-result-monthly">{fmtCurrency(calc.monthly)}</div>

            <div className="mv-result-label" style={{ marginTop: 20 }}>
              Anualmente (12 meses)
            </div>
            <div className="mv-result-yearly">{fmtCurrency(calc.yearly)}</div>

            <div className="mv-formula">
              {clientCount} × {fmtCurrency(selectedPlan.price)} × {(commissionRate * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </section>

      {/* ========== PLANOS ========== */}
      <section className="mv-section">
        <div className="mv-section-head">
          <h3>💼 Os 3 planos disponíveis</h3>
          <span className="mv-muted">Use esse comparativo na conversa com o lead</span>
        </div>

        <div className="mv-plans-grid">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`mv-plan-card ${plan.key === "delivery" ? "mv-popular" : ""} ${
                plan.key === "completa" ? "mv-complete" : ""
              }`}
            >
              {plan.key === "delivery" && <div className="mv-plan-badge">⭐ Mais popular</div>}
              {plan.key === "completa" && <div className="mv-plan-badge">💎 Tudo incluso</div>}

              <div className="mv-plan-emoji">{plan.emoji}</div>
              <div className="mv-plan-name">{plan.name}</div>
              <div className="mv-plan-price">
                {fmtCurrency(plan.price)}
                <small>/mês</small>
              </div>

              <div className="mv-plan-commission">
                Sua comissão por cliente
                <span>{fmtCurrency(plan.price * commissionRate)}</span>
              </div>

              <ul className="mv-plan-features">
                {FEATURES_BY_PLAN[plan.key].map((f) => (
                  <li key={f}>
                    <span className="mv-check">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ========== DIFERENCIAIS ========== */}
      <section className="mv-section">
        <div className="mv-section-head">
          <h3>✨ Por que o cliente deve aderir?</h3>
          <span className="mv-muted">Argumentos pra usar na hora da venda</span>
        </div>

        <div className="mv-diferencial-grid">
          {DIFERENCIAIS.map((d) => (
            <div key={d.title} className="mv-dif-card">
              <div className="mv-dif-icon">{d.icon}</div>
              <div className="mv-dif-title">{d.title}</div>
              <div className="mv-dif-text">{d.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== FLUXO DE COMISSÃO ========== */}
      <section className="mv-section">
        <div className="mv-section-head">
          <h3>💰 Como funciona o pagamento da sua comissão</h3>
          <span className="mv-muted">Fluxo simples e transparente</span>
        </div>

        <div className="mv-fluxo-grid">
          {FLUXO_COMISSAO.map((f, i) => (
            <div key={f.step} className="mv-fluxo-step">
              <div className="mv-fluxo-num">{f.step}</div>
              <div className="mv-fluxo-title">{f.title}</div>
              <div className="mv-fluxo-text">{f.text}</div>
              {i < FLUXO_COMISSAO.length - 1 && <div className="mv-fluxo-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ========== CTA FINAL ========== */}
      <section className="mv-cta">
        <div>
          <h3>Pronto pra vender?</h3>
          <p>Pega seu link de afiliado no menu Perfil e compartilhe com restaurantes interessados.</p>
        </div>
      </section>
    </div>
  );
}

const MATERIAL_VENDAS_CSS = `
  .mv-page {
    display: flex;
    flex-direction: column;
    gap: 28px;
    color: #f1f5f9;
  }

  /* ========== HERO ========== */
  .mv-hero {
    position: relative;
    overflow: hidden;
    background: radial-gradient(1200px 400px at 50% -100%, rgba(255,107,26,0.18), transparent 70%),
                linear-gradient(135deg, #111827 0%, #1e293b 100%);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 56px 32px;
    text-align: center;
  }
  .mv-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(600px 300px at 85% 120%, rgba(74,222,128,0.08), transparent 60%);
    pointer-events: none;
  }
  .mv-eyebrow {
    position: relative;
    display: inline-block;
    background: rgba(255,107,26,0.15);
    color: #ffb37a;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1px solid rgba(255,107,26,0.3);
  }
  .mv-hero h1 {
    position: relative;
    margin: 18px 0 14px;
    font-size: 34px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  .mv-accent {
    background: linear-gradient(90deg, #ff6b1a, #fbbf24);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .mv-hero p {
    position: relative;
    max-width: 680px;
    margin: 0 auto;
    color: rgba(255,255,255,0.7);
    font-size: 15px;
    line-height: 1.6;
  }

  /* ========== SEÇÕES ========== */
  .mv-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .mv-section-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 6px;
  }
  .mv-section-head h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .mv-muted {
    color: rgba(255,255,255,0.55);
    font-size: 13px;
  }

  /* ========== CALCULADORA ========== */
  .mv-calc {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    padding: 26px;
  }
  .mv-calc-body {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 28px;
    margin-top: 4px;
  }
  @media (max-width: 860px) {
    .mv-calc-body { grid-template-columns: 1fr; }
  }
  .mv-calc-label {
    display: block;
    font-size: 12px;
    color: rgba(255,255,255,0.6);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 12px;
  }
  .mv-slider {
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }
  .mv-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b1a, #ff9147);
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(255,107,26,0.5);
    border: 2px solid #1e293b;
  }
  .mv-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b1a, #ff9147);
    cursor: pointer;
    border: 2px solid #1e293b;
    box-shadow: 0 4px 12px rgba(255,107,26,0.5);
  }
  .mv-slider-value {
    margin-top: 12px;
    text-align: center;
    font-size: 32px;
    font-weight: 800;
    color: #ff9147;
    line-height: 1;
  }
  .mv-slider-value small {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255,255,255,0.5);
    margin-left: 6px;
  }
  .mv-plan-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .mv-plan-btn {
    background: rgba(255,255,255,0.04);
    border: 2px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 14px 10px;
    cursor: pointer;
    text-align: center;
    transition: all 0.18s ease;
    color: #f1f5f9;
  }
  .mv-plan-btn:hover {
    border-color: rgba(255,107,26,0.4);
    transform: translateY(-2px);
  }
  .mv-plan-btn.active {
    border-color: #ff6b1a;
    background: rgba(255,107,26,0.12);
    box-shadow: 0 8px 24px rgba(255,107,26,0.18);
  }
  .mv-plan-btn-emoji { font-size: 26px; }
  .mv-plan-btn-price {
    font-size: 15px;
    font-weight: 800;
    margin-top: 4px;
  }
  .mv-plan-btn-name {
    font-size: 11px;
    color: rgba(255,255,255,0.55);
    margin-top: 2px;
  }
  .mv-calc-right {
    background: linear-gradient(160deg, rgba(255,107,26,0.1), rgba(74,222,128,0.06));
    border: 1px solid rgba(255,179,122,0.18);
    border-radius: 14px;
    padding: 24px 22px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .mv-result-label {
    font-size: 11px;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }
  .mv-result-monthly {
    font-size: 42px;
    font-weight: 900;
    line-height: 1;
    background: linear-gradient(90deg, #ff6b1a, #fbbf24);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin-top: 6px;
  }
  .mv-result-yearly {
    font-size: 24px;
    font-weight: 800;
    color: #4ade80;
    margin-top: 6px;
  }
  .mv-formula {
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px dashed rgba(255,255,255,0.1);
    font-size: 12px;
    color: rgba(255,255,255,0.5);
    font-style: italic;
  }

  /* ========== PLANOS ========== */
  .mv-plans-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
  @media (max-width: 960px) {
    .mv-plans-grid { grid-template-columns: 1fr; }
  }
  .mv-plan-card {
    position: relative;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    padding: 28px 22px 22px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  }
  .mv-plan-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255,255,255,0.14);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  }
  .mv-popular {
    border-color: rgba(255,107,26,0.4);
    background: linear-gradient(180deg, rgba(255,107,26,0.1) 0%, rgba(255,107,26,0) 60%);
  }
  .mv-complete {
    border-color: rgba(74,222,128,0.4);
    background: linear-gradient(180deg, rgba(74,222,128,0.1) 0%, rgba(74,222,128,0) 60%);
  }
  .mv-plan-badge {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(90deg, #ff6b1a, #fbbf24);
    color: #0f172a;
    padding: 5px 14px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
    letter-spacing: 0.03em;
    box-shadow: 0 8px 20px rgba(255,107,26,0.4);
  }
  .mv-complete .mv-plan-badge {
    background: linear-gradient(90deg, #4ade80, #22d3ee);
    box-shadow: 0 8px 20px rgba(74,222,128,0.4);
  }
  .mv-plan-emoji {
    font-size: 42px;
    text-align: center;
    margin-top: 4px;
  }
  .mv-plan-name {
    text-align: center;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .mv-plan-price {
    text-align: center;
    font-size: 32px;
    font-weight: 900;
    line-height: 1;
    color: #fff;
  }
  .mv-popular .mv-plan-price { color: #ff9147; }
  .mv-complete .mv-plan-price { color: #4ade80; }
  .mv-plan-price small {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255,255,255,0.5);
    margin-left: 2px;
  }
  .mv-plan-commission {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: rgba(255,255,255,0.04);
    border: 1px dashed rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 10px;
    font-size: 11px;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
  }
  .mv-plan-commission span {
    font-size: 18px;
    font-weight: 800;
    color: #4ade80;
    text-transform: none;
    letter-spacing: 0;
  }
  .mv-plan-features {
    list-style: none;
    padding: 0;
    margin: 4px 0 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .mv-plan-features li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13.5px;
    color: rgba(255,255,255,0.85);
    line-height: 1.4;
  }
  .mv-check {
    color: #4ade80;
    font-weight: 800;
    flex-shrink: 0;
  }

  /* ========== DIFERENCIAIS ========== */
  .mv-diferencial-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  @media (max-width: 900px) { .mv-diferencial-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 600px) { .mv-diferencial-grid { grid-template-columns: 1fr; } }
  .mv-dif-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 20px;
    transition: all 0.18s;
  }
  .mv-dif-card:hover {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.12);
    transform: translateY(-2px);
  }
  .mv-dif-icon {
    font-size: 30px;
    margin-bottom: 8px;
  }
  .mv-dif-title {
    font-size: 15px;
    font-weight: 800;
    margin-bottom: 4px;
  }
  .mv-dif-text {
    font-size: 13px;
    color: rgba(255,255,255,0.65);
    line-height: 1.5;
  }

  /* ========== FLUXO ========== */
  .mv-fluxo-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }
  @media (max-width: 900px) { .mv-fluxo-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 500px) { .mv-fluxo-grid { grid-template-columns: 1fr; } }
  .mv-fluxo-step {
    position: relative;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 22px 16px;
    text-align: center;
  }
  .mv-fluxo-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b1a, #ff9147);
    color: #fff;
    font-weight: 900;
    font-size: 18px;
    margin-bottom: 10px;
    box-shadow: 0 6px 18px rgba(255,107,26,0.3);
  }
  .mv-fluxo-title {
    font-size: 15px;
    font-weight: 800;
  }
  .mv-fluxo-text {
    margin-top: 6px;
    font-size: 12.5px;
    color: rgba(255,255,255,0.65);
    line-height: 1.5;
  }
  .mv-fluxo-arrow {
    display: none;
  }

  /* ========== CTA ========== */
  .mv-cta {
    background: linear-gradient(135deg, rgba(255,107,26,0.14), rgba(74,222,128,0.08));
    border: 1px solid rgba(255,179,122,0.25);
    border-radius: 18px;
    padding: 28px;
    text-align: center;
  }
  .mv-cta h3 {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
  }
  .mv-cta p {
    margin: 8px 0 0;
    color: rgba(255,255,255,0.65);
    font-size: 14px;
  }
`;
