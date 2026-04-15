import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import Modal from "../../components/Modal";
import PlansCatalog from "./PlansCatalog";

type DecodeOption = {
  id: string;
  code: string;
  name: string;
  city: string;
  affiliateId: string | null;
  affiliateName: string | null;
};
import {
  IconPlus,
  IconRefresh,
  IconSearch,
  IconX,
  IconCheck,
  IconClock,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconTrash,
} from "../../components/ui/Icons";

type Plan = {
  id: string;
  decodeId: string | null;
  decodeName: string | null;
  decodeCode: string | null;
  establishmentName: string | null;
  clientName: string | null;
  planName: string;
  price: number;
  discountPct: number;
  durationDays: number;
  features: string | null;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  active: boolean;
  startedAt: string;
  expiresAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  notes: string | null;
  createdAt: string;
};

const PLAN_OPTIONS = [
  "Gestão de Mesas",
  "Gestão Delivery",
  "Gestão Completa",
];

const statusBadge: Record<string, { cls: string; label: string }> = {
  ACTIVE: { cls: "badge ok", label: "Ativo" },
  EXPIRED: { cls: "badge amber", label: "Expirado" },
  CANCELLED: { cls: "badge bad", label: "Cancelado" },
};

function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("pt-BR");
}

function fmtDateTime(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleString("pt-BR");
}

function fmtCurrency(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function daysRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function calcFinalPrice(price: number, discountPct: number) {
  return price * (1 - (discountPct || 0) / 100);
}

function toLocalInput(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function addDaysISO(startedAt: string, durationDays: number) {
  if (!startedAt) return "";
  const d = new Date(startedAt);
  d.setDate(d.getDate() + (durationDays || 0));
  return toLocalInput(d);
}

export default function PlanosPage() {
  const [items, setItems] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    decodeId: "",
    establishmentName: "",
    clientName: "",
    planName: PLAN_OPTIONS[0],
    price: "",
    discountPct: "0",
    durationDays: "30",
    startedAt: toLocalInput(new Date()),
    expiresAt: addDaysISO(toLocalInput(new Date()), 30),
    features: "",
    notes: "",
  });

  // Decodes dropdown
  const [decodeOptions, setDecodeOptions] = useState<DecodeOption[]>([]);
  const [decodesLoading, setDecodesLoading] = useState(false);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Plan | null>(null);

  // Renew tracking
  const [renewingId, setRenewingId] = useState<string | null>(null);

  // Cancel modal
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Plan | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: p, size: 20 };
      if (q.trim()) params.q = q.trim();
      const res = await api.get("/api/subscriptions", { params });
      setItems(res.data?.content ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
      setTotalElements(res.data?.totalElements ?? 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao carregar planos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function loadDecodeOptionsIfNeeded() {
    if (decodeOptions.length > 0 || decodesLoading) return;
    setDecodesLoading(true);
    try {
      const res = await api.get("/api/decodes", { params: { size: 500 } });
      setDecodeOptions((res.data?.content ?? []) as DecodeOption[]);
    } catch {
      /* silent */
    } finally {
      setDecodesLoading(false);
    }
  }

  function openCreate() {
    setRenewingId(null);
    const start = toLocalInput(new Date());
    setForm({
      decodeId: "",
      establishmentName: "",
      clientName: "",
      planName: PLAN_OPTIONS[0],
      price: "",
      discountPct: "0",
      durationDays: "30",
      startedAt: start,
      expiresAt: addDaysISO(start, 30),
      features: "",
      notes: "",
    });
    setCreateOpen(true);
    loadDecodeOptionsIfNeeded();
  }

  function updateForm(patch: Partial<typeof form>) {
    setForm((p) => {
      const next = { ...p, ...patch };
      // Auto-recalcula data final se o usuário mudou início ou duração
      if ("startedAt" in patch || "durationDays" in patch) {
        const dur = Number(next.durationDays || 0);
        if (next.startedAt && dur > 0) {
          next.expiresAt = addDaysISO(next.startedAt, dur);
        }
      }
      return next;
    });
  }

  async function onCreate() {
    if (!form.decodeId || !form.clientName || !form.planName || !form.price || !form.durationDays) {
      setError("Selecione o decode e preencha cliente, plano, valor e duração.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        decodeId: form.decodeId,
        establishmentName: form.establishmentName.trim(),
        clientName: form.clientName.trim(),
        planName: form.planName,
        price: Number(form.price),
        discountPct: Number(form.discountPct || 0),
        durationDays: Number(form.durationDays),
        features: form.features.trim() || null,
        startedAt: form.startedAt ? form.startedAt + ":00" : null,
        expiresAt: form.expiresAt ? form.expiresAt + ":00" : null,
        notes: form.notes.trim() || null,
      };

      if (renewingId) {
        await api.post(`/api/subscriptions/${renewingId}/renew`, payload);
        showSuccess("Plano renovado. O anterior foi expirado.");
      } else {
        await api.post("/api/subscriptions", payload);
        showSuccess("Plano cadastrado com sucesso.");
      }
      setCreateOpen(false);
      setRenewingId(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao salvar plano.");
    } finally {
      setSaving(false);
    }
  }

  function openDetail(p: Plan) {
    setDetail(p);
    setDetailOpen(true);
  }

  function openCancel(p: Plan) {
    setCancelTarget(p);
    setCancelReason("");
    setCancelOpen(true);
  }

  async function onDelete(p: Plan) {
    const label = `${p.establishmentName || p.decodeName || ""} — ${p.planName}`;
    if (!window.confirm(`Excluir definitivamente o plano "${label}"?\n\nEsta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/api/subscriptions/${p.id}`);
      showSuccess("Plano excluído.");
      await load();
      if (detail?.id === p.id) setDetailOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao excluir plano.");
    }
  }

  async function onCancel() {
    if (!cancelTarget) return;
    try {
      await api.patch(`/api/subscriptions/${cancelTarget.id}/cancel`, {
        reason: cancelReason.trim() || null,
      });
      setCancelOpen(false);
      showSuccess("Plano cancelado.");
      await load();
      if (detail?.id === cancelTarget.id) setDetailOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao cancelar.");
    }
  }

  function onRenew(p: Plan) {
    setRenewingId(p.status === "ACTIVE" ? p.id : null);
    const start = toLocalInput(new Date());
    setForm({
      decodeId: p.decodeId ?? "",
      establishmentName: p.establishmentName || p.decodeName || "",
      clientName: p.clientName || "",
      planName: PLAN_OPTIONS.includes(p.planName) ? p.planName : PLAN_OPTIONS[0],
      price: String(p.price),
      discountPct: String(p.discountPct ?? 0),
      durationDays: String(p.durationDays),
      startedAt: start,
      expiresAt: addDaysISO(start, p.durationDays),
      features: p.features || "",
      notes: "",
    });
    setCreateOpen(true);
    loadDecodeOptionsIfNeeded();
  }

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(0, page - 2);
    const end = Math.min(totalPages - 1, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  function goPage(p: number) { setPage(p); load(p); }

  const activeCount = items.filter((s) => s.status === "ACTIVE" && s.active).length;
  const totalRevenue = items
    .filter((s) => s.status === "ACTIVE")
    .reduce((acc, s) => acc + calcFinalPrice(s.price || 0, s.discountPct || 0), 0);

  return (
    <div className="page">
      <PlansCatalog />

      <div className="page-header" style={{ marginTop: 24 }}>
        <div>
          <h1>Assinaturas</h1>
          <div className="muted">Contratos ativos dos clientes — {totalElements} registros</div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <IconSearch size={15} style={{ position: "absolute", left: 10, color: "var(--muted)", pointerEvents: "none" }} />
            <input
              className="input"
              placeholder="Buscar por estabelecimento, cliente ou plano..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 280, paddingLeft: 34 }}
            />
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <IconPlus size={15} /> Novo plano
          </button>
          <button className="btn-ghost" onClick={() => load()} disabled={loading}>
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      {error && <div className="alert-danger">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="info-grid" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <span className="stat-label">Ativos agora</span>
          <span className="stat-value" style={{ color: "var(--green)" }}>{activeCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Receita ativa (com desconto)</span>
          <span className="stat-value">{fmtCurrency(totalRevenue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total registros</span>
          <span className="stat-value">{totalElements}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="muted" style={{ padding: 20 }}>Carregando...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><IconClock size={22} /></div>
            <div className="empty-state-title">Nenhum plano cadastrado</div>
            <div className="empty-state-text">Cadastre o primeiro plano de cliente.</div>
          </div>
        ) : (
          <>
            <div className="table-wrap" style={{ border: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Estabelecimento</th>
                    <th>Cliente</th>
                    <th>Plano</th>
                    <th>Valor</th>
                    <th>Desc.</th>
                    <th>Início</th>
                    <th>Final</th>
                    <th>Status</th>
                    <th style={{ width: 160, textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => {
                    const days = daysRemaining(s.expiresAt);
                    const expiring = s.status === "ACTIVE" && days <= 7 && days > 0;
                    const finalPrice = calcFinalPrice(s.price || 0, s.discountPct || 0);
                    return (
                      <tr key={s.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{s.establishmentName || s.decodeName || "-"}</div>
                          {s.decodeCode && (
                            <div className="muted" style={{ fontSize: 11 }}>{s.decodeCode}</div>
                          )}
                        </td>
                        <td>{s.clientName || "-"}</td>
                        <td style={{ fontWeight: 600 }}>{s.planName}</td>
                        <td style={{ fontWeight: 700 }}>
                          {fmtCurrency(finalPrice)}
                          {(s.discountPct || 0) > 0 && (
                            <div className="muted" style={{ fontSize: 11, textDecoration: "line-through" }}>
                              {fmtCurrency(s.price)}
                            </div>
                          )}
                        </td>
                        <td>{s.discountPct ? `${s.discountPct}%` : "-"}</td>
                        <td>{fmtDate(s.startedAt)}</td>
                        <td>
                          <span style={{ color: expiring ? "var(--amber)" : undefined, fontWeight: expiring ? 700 : undefined }}>
                            {fmtDate(s.expiresAt)}
                          </span>
                          {expiring && <div style={{ fontSize: 11, color: "var(--amber)", fontWeight: 700 }}>{days}d restantes</div>}
                          {s.status === "ACTIVE" && days <= 0 && <div style={{ fontSize: 11, color: "var(--red)", fontWeight: 700 }}>Expirado</div>}
                        </td>
                        <td>
                          <span className={statusBadge[s.status]?.cls || "badge"}>
                            {statusBadge[s.status]?.label || s.status}
                          </span>
                        </td>
                        <td>
                          <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                            <button className="btn-ghost" onClick={() => openDetail(s)} title="Detalhes" style={{ padding: "6px 8px" }}>
                              <IconEye size={15} />
                            </button>
                            {s.status === "ACTIVE" && (
                              <>
                                <button className="btn-ghost" onClick={() => onRenew(s)} title="Renovar" style={{ padding: "6px 8px" }}>
                                  <IconRefresh size={15} />
                                </button>
                                <button className="btn-danger" onClick={() => openCancel(s)} title="Cancelar" style={{ padding: "6px 8px" }}>
                                  <IconX size={15} />
                                </button>
                              </>
                            )}
                            {s.status !== "ACTIVE" && (
                              <button className="btn-ghost" onClick={() => onRenew(s)} title="Reativar / Novo" style={{ padding: "6px 8px" }}>
                                <IconCheck size={15} />
                              </button>
                            )}
                            <button className="btn-danger" onClick={() => onDelete(s)} title="Excluir" style={{ padding: "6px 8px" }}>
                              <IconTrash size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination" style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
                <button className="page-btn" disabled={page === 0} onClick={() => goPage(page - 1)}>
                  <IconChevronLeft size={15} />
                </button>
                {pageNumbers.map((n) => (
                  <button key={n} className={`page-btn${n === page ? " active" : ""}`} onClick={() => goPage(n)}>
                    {n + 1}
                  </button>
                ))}
                <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => goPage(page + 1)}>
                  <IconChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={createOpen}
        title={renewingId ? "Renovar plano" : "Novo plano"}
        subtitle={renewingId ? "O plano anterior será expirado automaticamente" : "Cadastre um plano para um cliente"}
        onClose={() => { if (!saving) setCreateOpen(false); }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setCreateOpen(false)} disabled={saving}>Cancelar</button>
            <button className="btn-primary" onClick={onCreate} disabled={saving}>{saving ? "Salvando..." : renewingId ? "Renovar" : "Cadastrar plano"}</button>
          </div>
        }
      >
        <div className="form-grid">
          <div className="form-field">
            <span className="form-label">
              Decode (estabelecimento) <span style={{ color: "var(--red)" }}>*</span>
            </span>
            <select
              className="input"
              value={form.decodeId}
              onChange={(e) => {
                const d = decodeOptions.find((x) => x.id === e.target.value);
                updateForm({
                  decodeId: e.target.value,
                  establishmentName: d?.name ?? "",
                });
              }}
              disabled={decodesLoading}
            >
              <option value="">
                {decodesLoading ? "Carregando decodes..." : "Selecione o decode..."}
              </option>
              {decodeOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.city}
                  {d.affiliateName ? ` • Afiliado: ${d.affiliateName}` : ""}
                </option>
              ))}
            </select>
            <span className="form-hint">
              A comissão/montante do plano é atribuída ao afiliado vinculado ao decode.
            </span>
          </div>

          <div className="form-field">
            <span className="form-label">Nome do cliente <span style={{ color: "var(--red)" }}>*</span></span>
            <input className="input" value={form.clientName} onChange={(e) => updateForm({ clientName: e.target.value })} placeholder="Ex: João Silva" />
          </div>

          <div className="form-grid cols-2">
            <div className="form-field">
              <span className="form-label">Plano <span style={{ color: "var(--red)" }}>*</span></span>
              <select className="input" value={form.planName} onChange={(e) => updateForm({ planName: e.target.value })}>
                {PLAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <span className="form-label">Valor (R$) <span style={{ color: "var(--red)" }}>*</span></span>
              <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateForm({ price: e.target.value })} placeholder="0.00" />
            </div>
          </div>

          <div className="form-grid cols-2">
            <div className="form-field">
              <span className="form-label">% de desconto</span>
              <input className="input" type="number" min="0" max="100" step="0.01" value={form.discountPct} onChange={(e) => updateForm({ discountPct: e.target.value })} />
              {Number(form.price) > 0 && Number(form.discountPct) > 0 && (
                <span className="form-hint">
                  Valor final: {fmtCurrency(calcFinalPrice(Number(form.price), Number(form.discountPct)))}
                </span>
              )}
            </div>
            <div className="form-field">
              <span className="form-label">Duração (dias) <span style={{ color: "var(--red)" }}>*</span></span>
              <input className="input" type="number" min="1" value={form.durationDays} onChange={(e) => updateForm({ durationDays: e.target.value })} />
              <span className="form-hint">30 = mensal, 90 = trimestral, 365 = anual</span>
            </div>
          </div>

          <div className="form-grid cols-2">
            <div className="form-field">
              <span className="form-label">Data inicial</span>
              <input className="input" type="datetime-local" value={form.startedAt} onChange={(e) => updateForm({ startedAt: e.target.value })} />
            </div>
            <div className="form-field">
              <span className="form-label">Data final</span>
              <input className="input" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} />
            </div>
          </div>

          <div className="form-field">
            <span className="form-label">Funcionalidades incluídas</span>
            <textarea className="input" rows={3} value={form.features} onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))} placeholder="Ex: Dashboard, CRM, Relatórios..." />
          </div>
          <div className="form-field">
            <span className="form-label">Observações</span>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={detailOpen}
        title={detail ? `${detail.establishmentName || detail.decodeName || "Plano"} — ${detail.planName}` : "Detalhes"}
        subtitle={detail?.clientName || ""}
        onClose={() => setDetailOpen(false)}
        wide
        footer={
          detail?.status === "ACTIVE" ? (
            <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => { setDetailOpen(false); onRenew(detail!); }}>Renovar</button>
              <button className="btn-danger" onClick={() => { setDetailOpen(false); openCancel(detail!); }}>Cancelar plano</button>
            </div>
          ) : undefined
        }
      >
        {detail && (
          <>
            <div className="form-grid cols-2">
              <div className="stat-card">
                <span className="stat-label">Status</span>
                <span className={statusBadge[detail.status]?.cls || "badge"} style={{ marginTop: 4 }}>
                  {statusBadge[detail.status]?.label || detail.status}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Valor final</span>
                <span className="stat-value">
                  {fmtCurrency(calcFinalPrice(detail.price || 0, detail.discountPct || 0))}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Duração</span>
                <span className="stat-value">{detail.durationDays} dias</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Dias restantes</span>
                <span className="stat-value" style={{ color: daysRemaining(detail.expiresAt) <= 7 ? "var(--red)" : "var(--green)" }}>
                  {Math.max(0, daysRemaining(detail.expiresAt))}
                </span>
              </div>
            </div>

            <div className="kv" style={{ marginTop: 14 }}>
              <div><span>Estabelecimento</span><b>{detail.establishmentName || detail.decodeName || "-"}</b></div>
              <div><span>Cliente</span><b>{detail.clientName || "-"}</b></div>
              <div><span>Plano</span><b>{detail.planName}</b></div>
              <div><span>Valor base</span><b>{fmtCurrency(detail.price)}</b></div>
              <div><span>Desconto</span><b>{detail.discountPct || 0}%</b></div>
              <div><span>Início</span><b>{fmtDateTime(detail.startedAt)}</b></div>
              <div><span>Final</span><b>{fmtDateTime(detail.expiresAt)}</b></div>
              <div><span>Funcionalidades</span><b>{detail.features || "-"}</b></div>
              <div><span>Observações</span><b>{detail.notes || "-"}</b></div>
              {detail.cancelledAt && <div><span>Cancelado em</span><b>{fmtDateTime(detail.cancelledAt)}</b></div>}
              {detail.cancelReason && <div><span>Motivo</span><b>{detail.cancelReason}</b></div>}
              <div><span>Criado em</span><b>{fmtDateTime(detail.createdAt)}</b></div>
            </div>
          </>
        )}
      </Modal>

      {/* Cancel modal */}
      <Modal
        open={cancelOpen}
        title="Cancelar plano"
        subtitle={cancelTarget ? `${cancelTarget.establishmentName || cancelTarget.decodeName || ""} — ${cancelTarget.planName}` : ""}
        onClose={() => setCancelOpen(false)}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setCancelOpen(false)}>Voltar</button>
            <button className="btn-danger" onClick={onCancel}>Confirmar cancelamento</button>
          </div>
        }
      >
        <div className="alert-info" style={{ margin: 0 }}>
          Esta ação irá cancelar o plano. O cliente perderá acesso ao final do período.
        </div>
        <div className="form-field" style={{ marginTop: 12 }}>
          <span className="form-label">Motivo do cancelamento (opcional)</span>
          <textarea
            className="input"
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
