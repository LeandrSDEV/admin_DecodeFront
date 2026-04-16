import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import Modal from "../../components/Modal";
import { listAffiliates } from "../../services/affiliateService";
import type { Affiliate } from "../../services/affiliateService";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconRefresh,
  IconSearch,
  IconEye,
  IconClock,
  IconChevronLeft,
  IconChevronRight,
} from "../../components/ui/Icons";

type Decode = {
  id: string;
  code: string;
  name: string;
  city: string;
  status: string;
  usersCount: number;
  monthlyRevenue: number;
  affiliateId: string | null;
  affiliateName: string | null;
  tenantId: number | null;
  updatedAt: string;
};

type Subscription = {
  id: string;
  planName: string;
  price: number;
  durationDays: number;
  features: string | null;
  status: string;
  active: boolean;
  startedAt: string;
  expiresAt: string;
};

const statusBadge: Record<string, { cls: string; label: string }> = {
  ACTIVE: { cls: "badge ok", label: "Ativo" },
  PAUSED: { cls: "badge amber", label: "Pausado" },
};

function fmtCurrency(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(v: string | null) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("pt-BR");
}

function daysLeft(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

export default function ControleDecodesPage() {
  const [items, setItems] = useState<Decode[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Decode | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", status: "ACTIVE", usersCount: "0", monthlyRevenue: "0", affiliateId: "", tenantId: "" });

  // Affiliates dropdown (carregado on demand ao abrir o modal de criação)
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [affiliatesLoading, setAffiliatesLoading] = useState(false);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Decode | null>(null);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [subHistory, setSubHistory] = useState<Subscription[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  function showSuccess(msg: string) { setSuccess(msg); setError(null); setTimeout(() => setSuccess(null), 3000); }

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: p, size: 20 };
      if (q.trim()) params.q = q.trim();
      const res = await api.get("/api/decodes", { params });
      setItems(res.data?.content ?? []);
      setTotalPages(res.data?.totalPages ?? 1);
      setTotalElements(res.data?.totalElements ?? 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(0); setPage(0); }, [q]); // eslint-disable-line

  async function loadAffiliatesIfNeeded() {
    if (affiliates.length > 0 || affiliatesLoading) return;
    setAffiliatesLoading(true);
    try {
      const res = await listAffiliates({ status: "ACTIVE", page: 0, size: 200 });
      setAffiliates(res.content || []);
    } catch {
      /* silent */
    } finally {
      setAffiliatesLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", city: "", status: "ACTIVE", usersCount: "0", monthlyRevenue: "0", affiliateId: "", tenantId: "" });
    setModalOpen(true);
    loadAffiliatesIfNeeded();
  }

  function openEdit(d: Decode) {
    setEditing(d);
    setForm({
      name: d.name,
      city: d.city,
      status: d.status,
      usersCount: String(d.usersCount ?? 0),
      monthlyRevenue: String(d.monthlyRevenue ?? 0),
      affiliateId: d.affiliateId ?? "",
      tenantId: d.tenantId != null ? String(d.tenantId) : "",
    });
    setModalOpen(true);
    loadAffiliatesIfNeeded();
  }

  async function onSave() {
    if (!form.name.trim() || !form.city.trim()) { setError("Nome e Cidade são obrigatórios."); return; }
    if (!editing && !form.affiliateId) {
      setError("Selecione o afiliado responsável pela conversão.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        city: form.city.trim(),
        status: form.status,
        usersCount: Number(form.usersCount) || 0,
        monthlyRevenue: Number(form.monthlyRevenue) || 0,
      };
      if (form.affiliateId) payload.affiliateId = form.affiliateId;
      if (form.tenantId) payload.tenantId = Number(form.tenantId);
      if (editing) {
        await api.put(`/api/decodes/${editing.id}`, payload);
        showSuccess("Decode atualizado.");
      } else {
        await api.post("/api/decodes", payload);
        showSuccess("Decode criado.");
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(d: Decode) {
    if (!window.confirm(`Deletar "${d.name}"?`)) return;
    try {
      await api.delete(`/api/decodes/${d.id}`);
      showSuccess("Decode deletado.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao deletar.");
    }
  }

  async function openDetail(d: Decode) {
    setDetailItem(d);
    setDetailOpen(true);
    setSubLoading(true);
    setActiveSub(null);
    setSubHistory([]);
    try {
      const [activeRes, histRes] = await Promise.all([
        api.get(`/api/subscriptions/decode/${d.id}/active`).catch(() => ({ data: null })),
        api.get(`/api/subscriptions/decode/${d.id}`, { params: { size: 10 } }),
      ]);
      setActiveSub(activeRes.data || null);
      setSubHistory(histRes.data?.content ?? []);
    } catch { /* ignore */ } finally {
      setSubLoading(false);
    }
  }

  function goPage(p: number) { setPage(p); load(p); }

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = Math.max(0, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Decodes</h1>
          <div className="muted">Estabelecimentos associados — {totalElements} cadastrados</div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <IconSearch size={15} style={{ position: "absolute", left: 10, color: "var(--muted)", pointerEvents: "none" }} />
            <input className="input" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 220, paddingLeft: 34 }} />
          </div>
          <button className="btn-primary" onClick={openCreate}><IconPlus size={15} /> Novo decode</button>
          <button className="btn-ghost" onClick={() => load()} disabled={loading}><IconRefresh size={15} /></button>
        </div>
      </div>

      {error && <div className="alert-danger">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="muted" style={{ padding: 20 }}>Carregando...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><IconSearch size={22} /></div>
            <div className="empty-state-title">Nenhum decode encontrado</div>
            <div className="empty-state-text">{q ? "Tente outro termo." : "Crie o primeiro decode."}</div>
          </div>
        ) : (
          <>
            <div className="table-wrap" style={{ border: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Decode</th>
                    <th>Cidade</th>
                    <th>Afiliado</th>
                    <th>Status</th>
                    <th>Usuários</th>
                    <th>Receita/mês</th>
                    <th style={{ width: 140, textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{d.name}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{d.code}</div>
                      </td>
                      <td>{d.city}</td>
                      <td>{d.affiliateName ?? <span className="muted">—</span>}</td>
                      <td><span className={statusBadge[d.status]?.cls || "badge"}>{statusBadge[d.status]?.label || d.status}</span></td>
                      <td>{d.usersCount ?? 0}</td>
                      <td style={{ fontWeight: 700 }}>{fmtCurrency(d.monthlyRevenue)}</td>
                      <td>
                        <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                          <button className="btn-ghost" onClick={() => openDetail(d)} title="Detalhes + Assinatura" style={{ padding: "6px 8px" }}><IconEye size={15} /></button>
                          <button className="btn-ghost" onClick={() => openEdit(d)} title="Editar" style={{ padding: "6px 8px" }}><IconPencil size={15} /></button>
                          <button className="btn-danger" onClick={() => onDelete(d)} title="Deletar" style={{ padding: "6px 8px" }}><IconTrash size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination" style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
                <button className="page-btn" disabled={page === 0} onClick={() => goPage(page - 1)}><IconChevronLeft size={15} /></button>
                {pageNumbers.map((n) => (<button key={n} className={`page-btn${n === page ? " active" : ""}`} onClick={() => goPage(n)}>{n + 1}</button>))}
                <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => goPage(page + 1)}><IconChevronRight size={15} /></button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal with subscription */}
      <Modal open={detailOpen} title={detailItem?.name || "Decode"} subtitle={`${detailItem?.code} • ${detailItem?.city}`} onClose={() => setDetailOpen(false)} wide>
        {detailItem && (
          <>
            <div className="form-grid cols-2">
              <div className="stat-card"><span className="stat-label">Status</span><span className={statusBadge[detailItem.status]?.cls || "badge"} style={{ marginTop: 4 }}>{statusBadge[detailItem.status]?.label}</span></div>
              <div className="stat-card"><span className="stat-label">Receita mensal</span><span className="stat-value">{fmtCurrency(detailItem.monthlyRevenue)}</span></div>
              <div className="stat-card"><span className="stat-label">Usuários</span><span className="stat-value">{detailItem.usersCount}</span></div>
              <div className="stat-card"><span className="stat-label">Última atualização</span><span className="stat-value" style={{ fontSize: 14 }}>{fmtDate(detailItem.updatedAt)}</span></div>
            </div>

            <div className="section-title">Assinatura ativa</div>
            {subLoading ? (
              <div className="muted">Carregando...</div>
            ) : activeSub ? (
              <div className="card" style={{ background: "#f0fdf4", borderColor: "rgba(5,150,105,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{activeSub.planName}</div>
                    <div className="muted" style={{ marginTop: 2 }}>{fmtCurrency(activeSub.price)} / {activeSub.durationDays} dias</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="badge ok">Ativa</span>
                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: daysLeft(activeSub.expiresAt) <= 7 ? "var(--red)" : "var(--green)" }}>
                      <IconClock size={12} style={{ verticalAlign: "middle" }} /> {daysLeft(activeSub.expiresAt)} dias restantes
                    </div>
                  </div>
                </div>
                {activeSub.features && <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Funcionalidades: {activeSub.features}</div>}
                <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>Início: {fmtDate(activeSub.startedAt)} — Expira: {fmtDate(activeSub.expiresAt)}</div>
              </div>
            ) : (
              <div className="alert-info" style={{ margin: 0 }}>Nenhuma assinatura ativa. Vá em Controle → Assinaturas para criar uma.</div>
            )}

            {subHistory.length > 0 && (
              <>
                <div className="section-title">Histórico de assinaturas ({subHistory.length})</div>
                <div className="tableWrap">
                  <table className="table">
                    <thead><tr><th>Plano</th><th>Valor</th><th>Início</th><th>Expira</th><th>Status</th></tr></thead>
                    <tbody>
                      {subHistory.map((h) => (
                        <tr key={h.id}>
                          <td style={{ fontWeight: 600 }}>{h.planName}</td>
                          <td>{fmtCurrency(h.price)}</td>
                          <td>{fmtDate(h.startedAt)}</td>
                          <td>{fmtDate(h.expiresAt)}</td>
                          <td><span className={h.status === "ACTIVE" ? "badge ok" : h.status === "CANCELLED" ? "badge bad" : "badge amber"}>{h.status === "ACTIVE" ? "Ativa" : h.status === "CANCELLED" ? "Cancelada" : "Expirada"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </Modal>

      {/* Create/Edit modal */}
      <Modal open={modalOpen} title={editing ? "Editar decode" : "Novo decode"} subtitle={editing ? `Editando ${editing.name}` : "Cadastre um novo estabelecimento"} onClose={() => { if (!saving) setModalOpen(false); }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button>
            <button className="btn-primary" onClick={onSave} disabled={saving}>{saving ? "Salvando..." : editing ? "Atualizar" : "Criar"}</button>
          </div>
        }
      >
        <div className="form-grid">
          <div className="form-grid cols-2">
            <div className="form-field">
              <span className="form-label">Nome <span style={{ color: "var(--red)" }}>*</span></span>
              <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nome do estabelecimento" />
            </div>
            <div className="form-field">
              <span className="form-label">Cidade <span style={{ color: "var(--red)" }}>*</span></span>
              <input className="input" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="Cidade" />
            </div>
          </div>
          <div className="form-grid cols-2">
            <div className="form-field">
              <span className="form-label">Status</span>
              <select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="ACTIVE">Ativo</option>
                <option value="PAUSED">Pausado</option>
              </select>
            </div>
            <div className="form-field">
              <span className="form-label">Qtd. Usuários</span>
              <input className="input" type="number" min="0" value={form.usersCount} onChange={(e) => setForm((p) => ({ ...p, usersCount: e.target.value }))} />
            </div>
          </div>
          <div className="form-field">
            <span className="form-label">Receita mensal (R$)</span>
            <input className="input" type="number" min="0" step="0.01" value={form.monthlyRevenue} onChange={(e) => setForm((p) => ({ ...p, monthlyRevenue: e.target.value }))} />
          </div>
          <div className="form-field">
            <span className="form-label">
              Afiliado responsável pela conversão {!editing && <span style={{ color: "var(--red)" }}>*</span>}
            </span>
            <select
              className="input"
              value={form.affiliateId}
              onChange={(e) => setForm((p) => ({ ...p, affiliateId: e.target.value }))}
              disabled={affiliatesLoading}
            >
              <option value="">
                {affiliatesLoading ? "Carregando afiliados..." : "Selecione o afiliado..."}
              </option>
              {affiliates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.refCode})
                </option>
              ))}
            </select>
            <span className="form-hint">
              {editing
                ? "Altere se quiser trocar o afiliado responsável por esse decode."
                : "Obrigatório — quem trouxe esse estabelecimento."}
            </span>
          </div>
          <div className="form-field">
            <span className="form-label">Tenant ID (backend operacional)</span>
            <input
              className="input"
              type="number"
              placeholder="ID do tenant no sistema operacional"
              value={form.tenantId}
              onChange={(e) => setForm((p) => ({ ...p, tenantId: e.target.value }))}
            />
            <span className="form-hint">
              Vincule ao tenant do sistema operacional para sincronizar datas de assinatura automaticamente.
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
