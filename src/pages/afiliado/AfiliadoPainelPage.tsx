import { useEffect, useState } from "react";
import { fetchDashboard, fetchAffiliateStats } from "../../services/affiliatePortalService";
import type { DashboardResponse, AffiliateStats, DailyProduction } from "../../services/affiliatePortalService";

function fmtCurrency(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtMonth(v: string) {
  const [y, m] = v.split("-");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[parseInt(m, 10) - 1]}/${y}`;
}

function fmtShortDate(v: string) {
  const [, m, d] = v.split("-");
  return `${d}/${m}`;
}

function fmtDate(v: string | null) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("pt-BR");
}

export default function AfiliadoPainelPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchDashboard().then(setData).catch(() => undefined),
      fetchAffiliateStats().then(setStats).catch(() => undefined),
    ]).finally(() => setLoading(false));
  }, []);

  function copyShareLink() {
    if (!data) return;
    navigator.clipboard.writeText(data.shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div style={{ color: "#94a3b8" }}>Carregando seu painel...</div>;
  }

  if (!data) {
    return <div style={{ color: "#fca5a5" }}>Erro ao carregar dados.</div>;
  }

  return (
    <div>
      <style>{styles}</style>

      <h1 className="aff-page-title">Olá! 👋</h1>
      <div className="aff-page-sub">
        Sua taxa atual: <strong style={{ color: "#ffb37a" }}>{data.commissionRate}%</strong> sobre o valor do plano de cada cliente ativo.
      </div>

      <div className="aff-share">
        <div className="aff-share-label">🔗 Seu link de indicação</div>
        <div className="aff-share-row">
          <div className="aff-share-link">{data.shareLink}</div>
          <button className="aff-share-btn" onClick={copyShareLink}>
            {copied ? "✓ Copiado!" : "Copiar link"}
          </button>
        </div>
      </div>

      {/* ============== ESTABELECIMENTOS ============== */}
      <h3 className="aff-section-title">Estabelecimentos cadastrados</h3>
      <div className="aff-stats">
        <div className="aff-stat green">
          <div className="aff-stat-label">Hoje</div>
          <div className="aff-stat-value">{data.decodesToday}</div>
          <div className="aff-stat-hint">cadastros no dia</div>
        </div>
        <div className="aff-stat amber">
          <div className="aff-stat-label">Este mês</div>
          <div className="aff-stat-value">{data.decodesThisMonth}</div>
          <div className="aff-stat-hint">cadastros no mês corrente</div>
        </div>
        <div className="aff-stat">
          <div className="aff-stat-label">Total</div>
          <div className="aff-stat-value">{data.decodesTotal}</div>
          <div className="aff-stat-hint">lifetime</div>
        </div>
        <div className="aff-stat orange">
          <div className="aff-stat-label">Ativos agora</div>
          <div className="aff-stat-value">{data.activeClients}</div>
          <div className="aff-stat-hint">de {data.totalConversions} conversões</div>
        </div>
      </div>

      {/* ============== GRAFICO ALTA/BAIXA ============== */}
      <div className="aff-section">
        <div className="aff-section-header">
          <h3>📈 Produção — últimos 30 dias</h3>
          <span className="aff-muted">Altas (cadastros) e baixas (dias sem produção)</span>
        </div>
        <ProductionChart points={data.productionTrend} />
      </div>

      {/* ============== VALOR DE COMISSAO ============== */}
      <h3 className="aff-section-title">Comissão</h3>
      <div className="aff-stats">
        <div className="aff-stat green">
          <div className="aff-stat-label">Gerada hoje</div>
          <div className="aff-stat-value">{fmtCurrency(data.dailyEarned)}</div>
        </div>
        <div className="aff-stat orange">
          <div className="aff-stat-label">Estimativa do mês</div>
          <div className="aff-stat-value">{fmtCurrency(data.currentMonthEstimate)}</div>
        </div>
        <div className="aff-stat">
          <div className="aff-stat-label">Mês anterior</div>
          <div className="aff-stat-value">{fmtCurrency(data.lastMonthEarned)}</div>
        </div>
        <div className="aff-stat amber">
          <div className="aff-stat-label">Total acumulado</div>
          <div className="aff-stat-value">{fmtCurrency(data.lifetimeEarned)}</div>
          <div className="aff-stat-hint">pago + aprovado + pendente</div>
        </div>
      </div>

      {/* ============== REPASSES ============== */}
      <h3 className="aff-section-title">Repasses</h3>
      <div className="aff-stats">
        <div className="aff-stat green">
          <div className="aff-stat-label">Já recebido</div>
          <div className="aff-stat-value">{fmtCurrency(data.alreadyPaid)}</div>
          <div className="aff-stat-hint">repasses concluídos</div>
        </div>
        <div className="aff-stat orange">
          <div className="aff-stat-label">A receber</div>
          <div className="aff-stat-value">{fmtCurrency(data.readyForPayout)}</div>
          <div className="aff-stat-hint">aprovado, aguardando payout</div>
        </div>
        <div className="aff-stat amber">
          <div className="aff-stat-label">Em carência</div>
          <div className="aff-stat-value">{fmtCurrency(data.pendingCarencia)}</div>
          <div className="aff-stat-hint">aguardando 2 meses</div>
        </div>
        <div className="aff-stat">
          <div className="aff-stat-label">Próximo pagamento</div>
          <div className="aff-stat-value" style={{ fontSize: 18 }}>{fmtDate(data.nextPayoutDate)}</div>
        </div>
      </div>

      {/* ============== CRM PESSOAL ============== */}
      {stats && (
        <>
          <h3 className="aff-section-title">Meu CRM pessoal</h3>
          <div className="aff-stats">
            <div className="aff-stat orange">
              <div className="aff-stat-label">Total de leads</div>
              <div className="aff-stat-value">{stats.totalLeads}</div>
            </div>
            <div className="aff-stat amber">
              <div className="aff-stat-label">Leads aguardando</div>
              <div className="aff-stat-value">{stats.leadsWaiting}</div>
            </div>
            <div className="aff-stat">
              <div className="aff-stat-label">Em reunião</div>
              <div className="aff-stat-value">{stats.leadsMeeting}</div>
            </div>
            <div className="aff-stat green">
              <div className="aff-stat-label">Em proposta</div>
              <div className="aff-stat-value">{stats.leadsProposal}</div>
            </div>
            <div className="aff-stat">
              <div className="aff-stat-label">Interações</div>
              <div className="aff-stat-value">{stats.totalInteractions}</div>
            </div>
            <div className="aff-stat amber">
              <div className="aff-stat-label">Sem retorno</div>
              <div className="aff-stat-value">{stats.interactionsNoResponse}</div>
            </div>
          </div>
        </>
      )}

      {/* ============== HISTORICO MENSAL ============== */}
      <div className="aff-section">
        <h3>📊 Últimos 6 meses</h3>
        {data.lastSixMonths.length === 0 ? (
          <div className="aff-muted">Sem histórico ainda. Comece a indicar!</div>
        ) : (
          <table className="aff-table">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Clientes</th>
                <th>Comissão</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.lastSixMonths.map((m) => (
                <tr key={m.month}>
                  <td style={{ fontWeight: 700 }}>{fmtMonth(m.month)}</td>
                  <td>{m.clientCount}</td>
                  <td style={{ fontWeight: 700, color: m.commissionAmount > 0 ? "#4ade80" : "#94a3b8" }}>
                    {fmtCurrency(m.commissionAmount)}
                  </td>
                  <td>
                    <span className={`aff-pill ${m.status}`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// Gráfico de produção (alta/baixa) — SVG inline, sem dependências extras
// =====================================================================
function ProductionChart({ points }: { points: DailyProduction[] }) {
  if (!points || points.length === 0) {
    return <div className="aff-muted" style={{ padding: 20 }}>Sem dados ainda.</div>;
  }
  const width = 800;
  const height = 220;
  const padTop = 20;
  const padBottom = 34;
  const padLeft = 44;
  const padRight = 14;

  const maxDecodes = Math.max(1, ...points.map((p) => p.decodes));
  const maxCommission = Math.max(1, ...points.map((p) => p.commissionAmount));

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const stepX = innerW / Math.max(points.length - 1, 1);

  const linePts = points.map((p, i) => {
    const x = padLeft + i * stepX;
    const y = padTop + innerH - (p.commissionAmount / maxCommission) * innerH;
    return { x, y, p };
  });

  const linePath = linePts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
  const areaPath = linePath +
    ` L ${(padLeft + innerW).toFixed(1)} ${padTop + innerH}` +
    ` L ${padLeft} ${padTop + innerH} Z`;

  const barW = Math.max(2, stepX * 0.55);

  const totalDecodes = points.reduce((s, p) => s + p.decodes, 0);
  const totalCommission = points.reduce((s, p) => s + p.commissionAmount, 0);
  const avgDecodes = totalDecodes / points.length;
  const peak = points.reduce((best, p) => (p.decodes > best.decodes ? p : best), points[0]);

  return (
    <div>
      <div className="aff-chart-legend">
        <span><i className="dot orange" /> Cadastros (barras)</span>
        <span><i className="dot green" /> Comissão projetada (linha)</span>
        <span className="aff-muted">
          Total: {totalDecodes} cadastros · {fmtCurrency(totalCommission)} · pico {peak.decodes} em {fmtShortDate(peak.date)} · média {avgDecodes.toFixed(1)}/dia
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block", marginTop: 8 }}>
        <defs>
          <linearGradient id="grad-comm" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid */}
        {[0.25, 0.5, 0.75, 1].map((f) => {
          const y = padTop + innerH - f * innerH;
          return (
            <g key={f}>
              <line x1={padLeft} x2={padLeft + innerW} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <text x={padLeft - 8} y={y + 3} textAnchor="end" fontSize="10" fill="rgba(203,213,225,0.55)">
                {Math.round(maxDecodes * f)}
              </text>
            </g>
          );
        })}

        {/* barras (cadastros) */}
        {linePts.map((pt, i) => {
          const d = pt.p.decodes;
          if (d === 0) {
            // baixa — linha tracejada no eixo pra sinalizar dia sem produção
            return (
              <line
                key={i}
                x1={pt.x}
                x2={pt.x}
                y1={padTop + innerH - 2}
                y2={padTop + innerH}
                stroke="rgba(239, 68, 68, 0.55)"
                strokeWidth="2"
              />
            );
          }
          const h = (d / maxDecodes) * innerH;
          const y = padTop + innerH - h;
          const isPeak = d === peak.decodes;
          return (
            <g key={i}>
              <rect
                x={pt.x - barW / 2}
                y={y}
                width={barW}
                height={h}
                fill={isPeak ? "#ff9147" : "#ff6b1a"}
                opacity={isPeak ? 1 : 0.78}
                rx="2"
              />
              {isPeak && (
                <text x={pt.x} y={y - 6} textAnchor="middle" fontSize="11" fill="#ff9147" fontWeight="700">
                  {d}
                </text>
              )}
            </g>
          );
        })}

        {/* linha de comissão projetada */}
        <path d={areaPath} fill="url(#grad-comm)" />
        <path d={linePath} fill="none" stroke="#4ade80" strokeWidth="2" />

        {/* eixo X labels (a cada ~5 dias) */}
        {linePts.map((pt, i) => {
          const isLabel = i === 0 || i === linePts.length - 1 || i % 5 === 0;
          if (!isLabel) return null;
          return (
            <text
              key={i}
              x={pt.x}
              y={height - 12}
              textAnchor="middle"
              fontSize="10"
              fill="rgba(203,213,225,0.65)"
            >
              {fmtShortDate(pt.p.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

const styles = `
  .aff-page-title { font-size: 24px; font-weight: 800; margin: 0 0 6px; }
  .aff-page-sub { color: #94a3b8; font-size: 14px; margin-bottom: 28px; }
  .aff-muted { color: #94a3b8; font-size: 12px; }
  .aff-section-title {
    font-size: 13px;
    font-weight: 800;
    color: #cbd5e1;
    margin: 18px 0 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .aff-share {
    background: linear-gradient(135deg, rgba(255,107,26,0.18), rgba(255,145,71,0.12));
    border: 1px solid rgba(255,107,26,0.3);
    border-radius: 14px;
    padding: 22px 24px;
    margin-bottom: 24px;
  }
  .aff-share-label {
    font-size: 11px;
    color: #ffb37a;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .aff-share-row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .aff-share-link {
    flex: 1;
    min-width: 240px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px 16px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 13px;
    color: #fff;
    word-break: break-all;
  }
  .aff-share-btn {
    padding: 12px 22px;
    background: #fff;
    color: #ff6b1a;
    font-weight: 800;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
  }
  .aff-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }
  .aff-stat {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 18px 20px;
  }
  .aff-stat-label {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .aff-stat-value {
    font-size: 24px;
    font-weight: 800;
    margin-top: 6px;
  }
  .aff-stat-hint {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 6px;
  }
  .aff-stat.green .aff-stat-value { color: #4ade80; }
  .aff-stat.amber .aff-stat-value { color: #fbbf24; }
  .aff-stat.orange .aff-stat-value { color: #ff9147; }
  .aff-section {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 22px;
    margin-bottom: 22px;
  }
  .aff-section h3 {
    margin: 0 0 14px;
    font-size: 15px;
    font-weight: 800;
  }
  .aff-section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 14px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }
  .aff-section-header h3 { margin: 0; }
  .aff-chart-legend {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
    font-size: 12px;
    color: #cbd5e1;
  }
  .aff-chart-legend .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 3px;
    margin-right: 6px;
    vertical-align: middle;
  }
  .aff-chart-legend .dot.orange { background: #ff6b1a; }
  .aff-chart-legend .dot.green { background: #4ade80; }
  .aff-table {
    width: 100%;
    border-collapse: collapse;
  }
  .aff-table th, .aff-table td {
    padding: 10px 12px;
    text-align: left;
    font-size: 13px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .aff-table th {
    color: #94a3b8;
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .aff-pill {
    display: inline-block;
    padding: 3px 9px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
  }
  .aff-pill.PAGO { background: rgba(74, 222, 128, 0.18); color: #4ade80; }
  .aff-pill.APROVADO { background: rgba(96, 165, 250, 0.18); color: #93c5fd; }
  .aff-pill.PENDENTE { background: rgba(251, 191, 36, 0.18); color: #fbbf24; }
  .aff-pill.NENHUMA { background: rgba(255, 255, 255, 0.08); color: #94a3b8; }
`;
