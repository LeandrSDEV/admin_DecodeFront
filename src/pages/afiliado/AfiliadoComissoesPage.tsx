import { useEffect, useState } from "react";
import type { Commission, CommissionStatus } from "../../services/affiliateService";
import { fetchMyCommissions } from "../../services/affiliatePortalService";

const STATUS_LABELS: Record<CommissionStatus, { label: string; color: string }> = {
  PENDING: { label: "Em carência", color: "#fbbf24" },
  APPROVED: { label: "Aprovada", color: "#93c5fd" },
  PAID: { label: "Paga", color: "#4ade80" },
  REVERSED: { label: "Estornada", color: "#fca5a5" },
  HELD: { label: "Retida", color: "#fca5a5" },
};

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

export default function AfiliadoComissoesPage() {
  const [items, setItems] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  async function load(p = 0) {
    setLoading(true);
    try {
      const data = await fetchMyCommissions({ page: p, size: 30 });
      setItems(data.content || []);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0);
  }, []);

  const totalsByStatus: Record<string, number> = {};
  items.forEach((c) => {
    totalsByStatus[c.status] = (totalsByStatus[c.status] || 0) + c.commissionAmount;
  });

  return (
    <div>
      <style>{`
        .aff-page-title { font-size: 24px; font-weight: 800; margin: 0 0 6px; }
        .aff-page-sub { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
        .aff-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 22px;
        }
        .aff-summary-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 14px 18px;
        }
        .aff-summary-card .label {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .aff-summary-card .value {
          font-size: 18px;
          font-weight: 800;
          margin-top: 4px;
        }
        .aff-section {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
        }
        .aff-table { width: 100%; border-collapse: collapse; }
        .aff-table th, .aff-table td {
          padding: 12px 14px;
          font-size: 13px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .aff-table th {
          color: #94a3b8;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: rgba(0, 0, 0, 0.2);
        }
        .aff-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }
        .aff-pager {
          display: flex;
          gap: 8px;
          padding: 14px;
          justify-content: center;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .aff-pager button {
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }
        .aff-pager button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .aff-pager .current {
          background: rgba(255, 107, 26, 0.2);
          color: #ffb37a;
          border-color: rgba(255, 107, 26, 0.4);
        }
      `}</style>

      <h1 className="aff-page-title">Minhas comissões</h1>
      <div className="aff-page-sub">
        Histórico completo de todas as comissões geradas pelos seus clientes ativos.
      </div>

      <div className="aff-summary">
        <div className="aff-summary-card">
          <div className="label">Em carência</div>
          <div className="value" style={{ color: "#fbbf24" }}>
            {fmtCurrency(totalsByStatus.PENDING)}
          </div>
        </div>
        <div className="aff-summary-card">
          <div className="label">Aprovado (a receber)</div>
          <div className="value" style={{ color: "#93c5fd" }}>
            {fmtCurrency(totalsByStatus.APPROVED)}
          </div>
        </div>
        <div className="aff-summary-card">
          <div className="label">Pago</div>
          <div className="value" style={{ color: "#4ade80" }}>
            {fmtCurrency(totalsByStatus.PAID)}
          </div>
        </div>
        <div className="aff-summary-card">
          <div className="label">Estornado</div>
          <div className="value" style={{ color: "#fca5a5" }}>
            {fmtCurrency(totalsByStatus.REVERSED)}
          </div>
        </div>
      </div>

      <div className="aff-section">
        {loading ? (
          <div style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>Carregando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💸</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#cbd5e1" }}>
              Nenhuma comissão ainda
            </div>
            <div style={{ marginTop: 6, fontSize: 13 }}>
              Quando seus clientes pagarem a primeira mensalidade, sua comissão começa a contar aqui.
            </div>
          </div>
        ) : (
          <>
            <table className="aff-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Cliente</th>
                  <th>Plano</th>
                  <th>Valor plano</th>
                  <th>Taxa</th>
                  <th>Sua comissão</th>
                  <th>Status</th>
                  <th>Liberação</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const st = STATUS_LABELS[c.status];
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{fmtMonth(c.referenceMonth)}</td>
                      <td>{c.decodeName}</td>
                      <td>{c.planName}</td>
                      <td>{fmtCurrency(c.planPrice)}</td>
                      <td>{c.commissionRate}%</td>
                      <td style={{ fontWeight: 700, color: "#4ade80" }}>
                        {fmtCurrency(c.commissionAmount)}
                      </td>
                      <td>
                        <span
                          className="aff-pill"
                          style={{
                            backgroundColor: `${st.color}25`,
                            color: st.color,
                          }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td>{c.status === "PENDING" ? fmtDate(c.carenciaUntil) : c.paidAt ? fmtDate(c.paidAt) : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="aff-pager">
                <button disabled={page === 0} onClick={() => load(page - 1)}>
                  ‹ Anterior
                </button>
                <button className="current">
                  Página {page + 1} / {totalPages}
                </button>
                <button disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>
                  Próxima ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
