import { useEffect, useMemo, useState } from "react";
import {
  IconRefresh,
  IconPlus,
  IconCheck,
  IconX,
  IconClock,
  IconChevronLeft,
  IconChevronRight,
} from "../../components/ui/Icons";
import Modal from "../../components/Modal";
import {
  cancelPayoutRun,
  createPayoutRun,
  executePayoutRun,
  generateCommissionsForMonth,
  getPayoutRunCommissions,
  listPayoutRuns,
  markCommissionPaid,
  reviewPayoutRun,
} from "../../services/affiliateService";
import type {
  PayoutRun,
  PayoutRunStatus,
  Commission,
  CommissionStatus,
} from "../../services/affiliateService";

const RUN_BADGE: Record<PayoutRunStatus, { cls: string; label: string }> = {
  DRAFT: { cls: "badge amber", label: "Rascunho" },
  REVIEWED: { cls: "badge", label: "Revisado" },
  EXECUTING: { cls: "badge amber", label: "Executando" },
  COMPLETED: { cls: "badge ok", label: "Concluído" },
  CANCELLED: { cls: "badge bad", label: "Cancelado" },
};

const COMMISSION_BADGE: Record<CommissionStatus, { cls: string; label: string }> = {
  PENDING: { cls: "badge amber", label: "Carência" },
  APPROVED: { cls: "badge ok", label: "Aprovada" },
  PAID: { cls: "badge ok", label: "Paga" },
  REVERSED: { cls: "badge bad", label: "Estornada" },
  HELD: { cls: "badge bad", label: "Retida" },
};

function fmtCurrency(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("pt-BR");
}

function fmtMonth(v: string) {
  const [y, m] = v.split("-");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[parseInt(m, 10) - 1]}/${y}`;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ComissoesPage() {
  const [runs, setRuns] = useState<PayoutRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generate
  const [genOpen, setGenOpen] = useState(false);
  const [genMonth, setGenMonth] = useState(previousMonth());
  const [generating, setGenerating] = useState(false);

  // Create payout
  const [createOpen, setCreateOpen] = useState(false);
  const [payoutMonth, setPayoutMonth] = useState(currentMonth());

  // Detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRun, setDetailRun] = useState<PayoutRun | null>(null);
  const [detailCommissions, setDetailCommissions] = useState<Commission[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Mark paid (inside detail)
  const [paidOpen, setPaidOpen] = useState(false);
  const [paidTarget, setPaidTarget] = useState<Commission | null>(null);
  const [paidRef, setPaidRef] = useState("");
  const [saving, setSaving] = useState(false);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const data = await listPayoutRuns({ page: p, size: 20 });
      setRuns(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao carregar payout runs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onGenerate() {
    setGenerating(true);
    try {
      const r = await generateCommissionsForMonth(genMonth);
      setGenOpen(false);
      showSuccess(`${r.created} comissões criadas para ${fmtMonth(genMonth)}.`);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao gerar comissões.");
    } finally {
      setGenerating(false);
    }
  }

  async function onCreatePayout() {
    setSaving(true);
    try {
      await createPayoutRun(payoutMonth);
      setCreateOpen(false);
      showSuccess("Payout run criado.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao criar payout run.");
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(run: PayoutRun) {
    setDetailRun(run);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const c = await getPayoutRunCommissions(run.id);
      setDetailCommissions(c);
    } catch {
      setDetailCommissions([]);
    } finally {
      setDetailLoading(false);
    }
  }

  async function onReview() {
    if (!detailRun) return;
    try {
      const updated = await reviewPayoutRun(detailRun.id);
      setDetailRun(updated);
      showSuccess("Run marcado como revisado.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha.");
    }
  }

  async function onExecute() {
    if (!detailRun) return;
    try {
      const updated = await executePayoutRun(detailRun.id);
      setDetailRun(updated);
      showSuccess("Run em execução.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha.");
    }
  }

  async function onCancelRun() {
    if (!detailRun) return;
    if (!confirm("Cancelar este run? As comissões voltam para fila.")) return;
    try {
      await cancelPayoutRun(detailRun.id, "Cancelado pelo admin");
      setDetailOpen(false);
      showSuccess("Run cancelado.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha.");
    }
  }

  function openMarkPaid(c: Commission) {
    setPaidTarget(c);
    setPaidRef("");
    setPaidOpen(true);
  }

  async function onMarkPaid() {
    if (!paidTarget || !paidRef.trim()) return;
    setSaving(true);
    try {
      await markCommissionPaid(paidTarget.id, paidRef.trim());
      setPaidOpen(false);
      showSuccess("Comissão paga.");
      if (detailRun) {
        const c = await getPayoutRunCommissions(detailRun.id);
        setDetailCommissions(c);
      }
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha.");
    } finally {
      setSaving(false);
    }
  }

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(0, page - 2);
    const end = Math.min(totalPages - 1, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  function goPage(p: number) {
    setPage(p);
    load(p);
  }

  const totalPayable = detailCommissions.reduce(
    (acc, c) => (c.status === "APPROVED" ? acc + c.commissionAmount : acc),
    0
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Comissões & Payouts</h1>
          <div className="muted">
            Gere comissões mensais e pague afiliados via PIX
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button className="btn-ghost" onClick={() => setGenOpen(true)}>
            Gerar mês manualmente
          </button>
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <IconPlus size={15} /> Novo payout run
          </button>
          <button className="btn-ghost" onClick={() => load()} disabled={loading}>
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      {error && <div className="alert-danger">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="card" style={{ padding: 18, marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>Como funciona</h3>
        <ul className="muted" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
          <li>
            <strong>Dia 1 às 03:00</strong> — o sistema gera automaticamente as comissões do mês anterior pra cada afiliado com clientes ativos.
          </li>
          <li>
            <strong>Carência</strong> — comissão fica em <em>PENDING</em> por 2 meses. Se o cliente cancelar nesse período, é estornada.
          </li>
          <li>
            <strong>Aprovação automática</strong> — todo dia às 04:00, comissões que passaram da carência viram <em>APPROVED</em> e ficam prontas pra payout.
          </li>
          <li>
            <strong>Payout run</strong> — você cria um lote do mês, revisa, executa e marca cada PIX como pago. Quando todos pagos, o run vira <em>COMPLETED</em>.
          </li>
        </ul>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="muted" style={{ padding: 20 }}>Carregando...</div>
        ) : runs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconClock size={22} />
            </div>
            <div className="empty-state-title">Nenhum payout run criado</div>
            <div className="empty-state-text">
              Crie o primeiro payout run para o mês corrente. Ele vai agrupar todas as comissões aprovadas pendentes de pagamento.
            </div>
          </div>
        ) : (
          <>
            <div className="table-wrap" style={{ border: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Afiliados</th>
                    <th>Comissões</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Gerado em</th>
                    <th>Concluído</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}>{fmtMonth(r.referenceMonth)}</td>
                      <td>{r.totalAffiliates}</td>
                      <td>{r.totalCommissions}</td>
                      <td style={{ fontWeight: 700 }}>{fmtCurrency(r.totalAmount)}</td>
                      <td>
                        <span className={RUN_BADGE[r.status].cls}>{RUN_BADGE[r.status].label}</span>
                      </td>
                      <td>{fmtDate(r.generatedAt)}</td>
                      <td>{fmtDate(r.completedAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn-ghost" onClick={() => openDetail(r)}>
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div
                className="pagination"
                style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}
              >
                <button
                  className="page-btn"
                  disabled={page === 0}
                  onClick={() => goPage(page - 1)}
                >
                  <IconChevronLeft size={15} />
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    className={`page-btn${n === page ? " active" : ""}`}
                    onClick={() => goPage(n)}
                  >
                    {n + 1}
                  </button>
                ))}
                <button
                  className="page-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => goPage(page + 1)}
                >
                  <IconChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Generate modal */}
      <Modal
        open={genOpen}
        title="Gerar comissões manualmente"
        subtitle="Use isto para forçar o cálculo de um mês específico (idempotente)."
        onClose={() => {
          if (!generating) setGenOpen(false);
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setGenOpen(false)} disabled={generating}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={onGenerate} disabled={generating}>
              {generating ? "Gerando..." : "Gerar"}
            </button>
          </div>
        }
      >
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <span className="form-label">Mês de referência (YYYY-MM)</span>
          <input
            className="input"
            placeholder="2026-03"
            value={genMonth}
            onChange={(e) => setGenMonth(e.target.value)}
          />
        </div>
      </Modal>

      {/* Create payout modal */}
      <Modal
        open={createOpen}
        title="Novo payout run"
        subtitle="Agrupa todas as comissões aprovadas pendentes até o mês informado."
        onClose={() => {
          if (!saving) setCreateOpen(false);
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={onCreatePayout} disabled={saving}>
              {saving ? "Criando..." : "Criar"}
            </button>
          </div>
        }
      >
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <span className="form-label">Mês de referência (YYYY-MM)</span>
          <input
            className="input"
            value={payoutMonth}
            onChange={(e) => setPayoutMonth(e.target.value)}
          />
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={detailOpen}
        title={detailRun ? `Payout ${fmtMonth(detailRun.referenceMonth)}` : ""}
        subtitle={
          detailRun
            ? `${detailRun.totalCommissions} comissões • ${fmtCurrency(detailRun.totalAmount)} total`
            : ""
        }
        onClose={() => setDetailOpen(false)}
        footer={
          detailRun && (
            <div className="row" style={{ gap: 8, justifyContent: "space-between", width: "100%" }}>
              <button className="btn-danger" onClick={onCancelRun}>
                <IconX size={14} /> Cancelar run
              </button>
              <div className="row" style={{ gap: 8 }}>
                {detailRun.status === "DRAFT" && (
                  <button className="btn-primary" onClick={onReview}>
                    <IconCheck size={14} /> Marcar revisado
                  </button>
                )}
                {detailRun.status === "REVIEWED" && (
                  <button className="btn-primary" onClick={onExecute}>
                    Executar
                  </button>
                )}
              </div>
            </div>
          )
        }
      >
        {detailRun && (
          <>
            <div
              className="row"
              style={{
                gap: 14,
                marginBottom: 12,
                fontSize: 13,
                flexWrap: "wrap",
              }}
            >
              <span className={RUN_BADGE[detailRun.status].cls}>{RUN_BADGE[detailRun.status].label}</span>
              <span className="muted">A pagar: {fmtCurrency(totalPayable)}</span>
            </div>
            {detailLoading ? (
              <div className="muted">Carregando...</div>
            ) : (
              <div className="table-wrap" style={{ border: "1px solid var(--border)", borderRadius: 4 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Afiliado</th>
                      <th>Cliente</th>
                      <th>Mês</th>
                      <th>Comissão</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailCommissions.map((c) => (
                      <tr key={c.id}>
                        <td>{c.affiliateName}</td>
                        <td>{c.decodeName}</td>
                        <td>{fmtMonth(c.referenceMonth)}</td>
                        <td style={{ fontWeight: 700 }}>{fmtCurrency(c.commissionAmount)}</td>
                        <td>
                          <span className={COMMISSION_BADGE[c.status].cls}>
                            {COMMISSION_BADGE[c.status].label}
                          </span>
                        </td>
                        <td>
                          {(detailRun.status === "EXECUTING" || detailRun.status === "REVIEWED") &&
                            c.status === "APPROVED" && (
                              <button
                                className="btn-primary"
                                onClick={() => openMarkPaid(c)}
                                style={{ padding: "4px 10px", fontSize: 12 }}
                              >
                                Marcar paga
                              </button>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Mark paid modal */}
      <Modal
        open={paidOpen}
        title="Marcar comissão como paga"
        subtitle={paidTarget ? `${paidTarget.affiliateName} — ${fmtCurrency(paidTarget.commissionAmount)}` : ""}
        onClose={() => {
          if (!saving) setPaidOpen(false);
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setPaidOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={onMarkPaid} disabled={saving || !paidRef.trim()}>
              {saving ? "..." : "Confirmar"}
            </button>
          </div>
        }
      >
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <span className="form-label">
            Comprovante / EndToEndId <span style={{ color: "var(--red)" }}>*</span>
          </span>
          <input
            className="input"
            value={paidRef}
            onChange={(e) => setPaidRef(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
