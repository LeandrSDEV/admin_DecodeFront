import { useEffect, useState } from "react";
import { fetchDashboard, fetchAffiliateStats } from "../../services/affiliatePortalService";
import type { DashboardResponse, AffiliateStats } from "../../services/affiliatePortalService";

function fmtCurrency(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtMonth(v: string) {
  const [y, m] = v.split("-");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[parseInt(m, 10) - 1]}/${y}`;
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
      <style>{`
        .aff-page-title { font-size: 24px; font-weight: 800; margin: 0 0 6px; }
        .aff-page-sub { color: #94a3b8; font-size: 14px; margin-bottom: 28px; }
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
          margin-bottom: 24px;
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
        .aff-info {
          display: flex;
          gap: 18px;
          font-size: 13px;
          color: #cbd5e1;
        }
        .aff-info strong { color: #fff; }
      `}</style>

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

      {stats && (
        <>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#cbd5e1", margin: "8px 0 12px", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Meu CRM pessoal
          </h3>
          <div className="aff-stats" style={{ marginBottom: 22 }}>
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
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#cbd5e1", margin: "8px 0 12px", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Comissões
          </h3>
        </>
      )}

      <div className="aff-stats">
        <div className="aff-stat green">
          <div className="aff-stat-label">Clientes ativos agora</div>
          <div className="aff-stat-value">{data.activeClients}</div>
        </div>
        <div className="aff-stat orange">
          <div className="aff-stat-label">Estimativa este mês</div>
          <div className="aff-stat-value">{fmtCurrency(data.currentMonthEstimate)}</div>
        </div>
        <div className="aff-stat">
          <div className="aff-stat-label">Mês anterior (oficial)</div>
          <div className="aff-stat-value">{fmtCurrency(data.lastMonthEarned)}</div>
        </div>
        <div className="aff-stat amber">
          <div className="aff-stat-label">Em carência</div>
          <div className="aff-stat-value">{fmtCurrency(data.pendingCarencia)}</div>
        </div>
        <div className="aff-stat green">
          <div className="aff-stat-label">A receber</div>
          <div className="aff-stat-value">{fmtCurrency(data.readyForPayout)}</div>
        </div>
        <div className="aff-stat">
          <div className="aff-stat-label">Total já recebido</div>
          <div className="aff-stat-value">{fmtCurrency(data.alreadyPaid)}</div>
        </div>
      </div>

      <div className="aff-section">
        <h3>📅 Próximos pagamentos</h3>
        <div className="aff-info">
          <div>
            Próxima data estimada: <strong>{fmtDate(data.nextPayoutDate)}</strong>
          </div>
          <div>
            Total acumulado vitalício: <strong>{fmtCurrency(data.lifetimeEarned)}</strong>
          </div>
        </div>
      </div>

      <div className="aff-section">
        <h3>📊 Últimos 6 meses</h3>
        {data.lastSixMonths.length === 0 ? (
          <div style={{ color: "#94a3b8" }}>Sem histórico ainda. Comece a indicar!</div>
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

      <div className="aff-section">
        <h3>💡 Dicas pra vender mais</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: "#cbd5e1", lineHeight: 1.8, fontSize: 13.5 }}>
          <li>Compartilhe seu link em grupos de WhatsApp de comerciantes da sua região.</li>
          <li>Faça uma demonstração de 5 minutos pelo celular pro dono do restaurante — mostra mesa + delivery + robô.</li>
          <li>Foque em pizzarias e lanchonetes que ainda anotam pedido em papel — a dor é maior.</li>
          <li>Lembre o cliente: <strong>1 mês grátis</strong> usando seu código promocional na primeira compra.</li>
          <li>Cada cliente que assinar o plano <strong>Completo (R$ 149,90)</strong> rende {data.commissionRate}% pra você todo mês, enquanto ele continuar usando.</li>
        </ul>
      </div>
    </div>
  );
}
