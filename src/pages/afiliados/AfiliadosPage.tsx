import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconPlus,
  IconRefresh,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconCheck,
  IconClock,
  IconPencil,
  IconTrash,
} from "../../components/ui/Icons";
import Modal from "../../components/Modal";
import {
  approveAffiliate,
  createAffiliate,
  deleteAffiliate,
  listAffiliates,
  updateAffiliate,
} from "../../services/affiliateService";
import type { Affiliate, AffiliateStatus } from "../../services/affiliateService";

const STATUS_BADGE: Record<AffiliateStatus, { cls: string; label: string }> = {
  PENDING: { cls: "badge amber", label: "Pendente" },
  ACTIVE: { cls: "badge ok", label: "Ativo" },
  SUSPENDED: { cls: "badge bad", label: "Suspenso" },
  BANNED: { cls: "badge bad", label: "Banido" },
};

function fmtCurrency(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("pt-BR");
}

type FormState = {
  name: string;
  email: string;
  whatsapp: string;
  cpf: string;
  city: string;
  state: string;
  pixKeyType: string;
  pixKey: string;
  customCommissionRate: string;
  initialPassword: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  whatsapp: "",
  cpf: "",
  city: "",
  state: "",
  pixKeyType: "",
  pixKey: "",
  customCommissionRate: "",
  initialPassword: "",
};

type EditFormState = {
  name: string;
  whatsapp: string;
  cpf: string;
  city: string;
  state: string;
  pixKeyType: string;
  pixKey: string;
  status: AffiliateStatus;
  customCommissionRate: string;
  notes: string;
};

const EMPTY_EDIT_FORM: EditFormState = {
  name: "",
  whatsapp: "",
  cpf: "",
  city: "",
  state: "",
  pixKeyType: "",
  pixKey: "",
  status: "ACTIVE",
  customCommissionRate: "",
  notes: "",
};

export default function AfiliadosPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<AffiliateStatus | "">("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // KPIs
  const [pendingCount, setPendingCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Affiliate | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(EMPTY_EDIT_FORM);

  // Approve modal
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Affiliate | null>(null);
  const [approveForm, setApproveForm] = useState({ initialPassword: "", notes: "" });

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function load(p = page) {
    setLoading(true);
    setError(null);
    try {
      const params: { q?: string; status?: AffiliateStatus; page: number; size: number } = {
        page: p,
        size: 20,
      };
      if (q.trim()) params.q = q.trim();
      if (statusFilter) params.status = statusFilter;

      const data = await listAffiliates(params);
      setItems(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);

      const all = data.content || [];
      setPendingCount(all.filter((a) => a.status === "PENDING").length);
      setActiveCount(all.filter((a) => a.status === "ACTIVE").length);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao carregar afiliados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, statusFilter]);

  function openCreate() {
    setCreateForm(EMPTY_FORM);
    setCreateOpen(true);
  }

  async function onCreate() {
    if (!createForm.name || !createForm.email || !createForm.whatsapp) {
      setError("Preencha nome, email e whatsapp.");
      return;
    }
    setSaving(true);
    try {
      await createAffiliate({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        whatsapp: createForm.whatsapp.trim(),
        cpf: createForm.cpf.trim() || undefined,
        city: createForm.city.trim() || undefined,
        state: createForm.state.trim() || undefined,
        pixKeyType: createForm.pixKeyType || undefined,
        pixKey: createForm.pixKey.trim() || undefined,
        customCommissionRate: createForm.customCommissionRate
          ? Number(createForm.customCommissionRate)
          : undefined,
        initialPassword: createForm.initialPassword.trim() || undefined,
      });
      setCreateOpen(false);
      showSuccess("Afiliado criado e ativado.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao criar afiliado.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(a: Affiliate) {
    setEditTarget(a);
    setEditForm({
      name: a.name ?? "",
      whatsapp: a.whatsapp ?? "",
      cpf: a.cpf ?? "",
      city: a.city ?? "",
      state: a.state ?? "",
      pixKeyType: a.pixKeyType ?? "",
      pixKey: a.pixKey ?? "",
      status: a.status,
      customCommissionRate:
        a.customCommissionRate != null ? String(a.customCommissionRate) : "",
      notes: "",
    });
    setEditOpen(true);
  }

  async function onEdit() {
    if (!editTarget) return;
    if (!editForm.name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      await updateAffiliate(editTarget.id, {
        name: editForm.name.trim(),
        whatsapp: editForm.whatsapp.trim() || undefined,
        cpf: editForm.cpf.trim() || undefined,
        city: editForm.city.trim() || undefined,
        state: editForm.state.trim() || undefined,
        pixKeyType: editForm.pixKeyType || undefined,
        pixKey: editForm.pixKey.trim() || undefined,
        status: editForm.status,
        customCommissionRate: editForm.customCommissionRate
          ? Number(editForm.customCommissionRate)
          : undefined,
        notes: editForm.notes.trim() || undefined,
      });
      setEditOpen(false);
      showSuccess(`Afiliado ${editTarget.name} atualizado.`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao atualizar afiliado.");
    } finally {
      setSaving(false);
    }
  }

  function openApprove(a: Affiliate) {
    setApproveTarget(a);
    setApproveForm({ initialPassword: "", notes: "" });
    setApproveOpen(true);
  }

  async function onDelete(a: Affiliate) {
    const msg =
      `Excluir o afiliado "${a.name}"?\n\n` +
      `Decodes vinculados serão desvinculados e referrals/comissões pendentes serão removidas. ` +
      `Afiliados com comissões PAGAS não podem ser excluídos.`;
    if (!window.confirm(msg)) return;
    try {
      await deleteAffiliate(a.id);
      showSuccess(`Afiliado ${a.name} excluído.`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao excluir afiliado.");
    }
  }

  async function onApprove() {
    if (!approveTarget) return;
    if (!approveForm.initialPassword || approveForm.initialPassword.length < 8) {
      setError("Senha inicial precisa ter pelo menos 8 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await approveAffiliate(approveTarget.id, {
        initialPassword: approveForm.initialPassword,
        notes: approveForm.notes || undefined,
      });
      setApproveOpen(false);
      const msg = approveTarget.whatsapp
        ? `Afiliado ${approveTarget.name} aprovado. Credenciais enviadas via WhatsApp para ${approveTarget.whatsapp}.`
        : `Afiliado ${approveTarget.name} aprovado. Sem WhatsApp cadastrado — envie as credenciais manualmente.`;
      showSuccess(msg);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao aprovar.");
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

  return (
    <div className="page">
      {/* HEADER: só título + ação primária à direita */}
      <div className="page-header">
        <div>
          <h1>Afiliados</h1>
          <div className="muted">
            Programa de indicação — {totalElements} afiliados cadastrados
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexShrink: 0 }}>
          <button className="btn-primary" onClick={openCreate}>
            <IconPlus size={15} /> Novo afiliado
          </button>
          <button
            className="btn-ghost"
            onClick={() => load()}
            disabled={loading}
            title="Atualizar"
          >
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      {error && <div className="alert-danger">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {/* KPIs */}
      <div className="info-grid" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <span className="stat-label">Pendentes (página)</span>
          <span className="stat-value" style={{ color: "var(--amber)" }}>
            {pendingCount}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ativos (página)</span>
          <span className="stat-value" style={{ color: "var(--green)" }}>
            {activeCount}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Decodes ativos somados</span>
          <span className="stat-value">
            {items.reduce((acc, a) => acc + a.activeClients, 0)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Montante (página)</span>
          <span className="stat-value">
            {fmtCurrency(items.reduce((acc, a) => acc + a.totalEarned, 0))}
          </span>
        </div>
      </div>

      {/* TOOLBAR: filtros acima da tabela */}
      <div
        className="card"
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          padding: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            flex: "1 1 260px",
          }}
        >
          <IconSearch
            size={15}
            style={{
              position: "absolute",
              left: 10,
              color: "var(--muted)",
              pointerEvents: "none",
            }}
          />
          <input
            className="input"
            placeholder="Buscar por nome, email ou ref code..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: "100%", paddingLeft: 34 }}
          />
        </div>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AffiliateStatus | "")}
          style={{ minWidth: 170 }}
        >
          <option value="">Todos status</option>
          <option value="PENDING">Pendentes</option>
          <option value="ACTIVE">Ativos</option>
          <option value="SUSPENDED">Suspensos</option>
          <option value="BANNED">Banidos</option>
        </select>
      </div>

      {/* TABELA */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="muted" style={{ padding: 20 }}>
            Carregando...
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconClock size={22} />
            </div>
            <div className="empty-state-title">Nenhum afiliado encontrado</div>
            <div className="empty-state-text">
              Cadastre o primeiro afiliado ou divulgue a página pública de inscrição.
            </div>
          </div>
        ) : (
          <>
            <div className="table-wrap" style={{ border: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Afiliado</th>
                    <th>Ref Code</th>
                    <th>WhatsApp</th>
                    <th>Status</th>
                    <th>Ativos</th>
                    <th>Pendente</th>
                    <th>Montante</th>
                    <th>Cadastro</th>
                    <th style={{ width: 170, textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{a.name}</div>
                        <div className="muted" style={{ fontSize: 11 }}>
                          {a.email}
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                        {a.refCode}
                      </td>
                      <td>{a.whatsapp}</td>
                      <td>
                        <span className={STATUS_BADGE[a.status].cls}>
                          {STATUS_BADGE[a.status].label}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, textAlign: "center" }}>
                        {a.activeClients}
                      </td>
                      <td>{fmtCurrency(a.pendingAmount)}</td>
                      <td style={{ fontWeight: 700, color: "var(--green)" }}>
                        {fmtCurrency(a.totalEarned)}
                      </td>
                      <td>{fmtDate(a.createdAt)}</td>
                      <td>
                        <div
                          className="row"
                          style={{ gap: 6, justifyContent: "flex-end" }}
                        >
                          <button
                            className="btn-ghost"
                            onClick={() => navigate(`/parceiros/afiliados/${a.id}`)}
                            title="Detalhes"
                            style={{ padding: "6px 8px" }}
                          >
                            <IconEye size={15} />
                          </button>
                          <button
                            className="btn-ghost"
                            onClick={() => openEdit(a)}
                            title="Editar"
                            style={{ padding: "6px 8px" }}
                          >
                            <IconPencil size={15} />
                          </button>
                          {a.status === "PENDING" && (
                            <button
                              className="btn-primary"
                              onClick={() => openApprove(a)}
                              title="Aprovar"
                              style={{ padding: "6px 10px" }}
                            >
                              <IconCheck size={14} /> Aprovar
                            </button>
                          )}
                          <button
                            className="btn-danger"
                            onClick={() => onDelete(a)}
                            title="Excluir"
                            style={{ padding: "6px 8px" }}
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
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

      {/* Create modal */}
      <Modal
        open={createOpen}
        title="Novo afiliado"
        subtitle="Cadastro manual já ativo (pula a fila de aprovação)"
        onClose={() => {
          if (!saving) setCreateOpen(false);
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button
              className="btn-ghost"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={onCreate} disabled={saving}>
              {saving ? "Salvando..." : "Criar afiliado"}
            </button>
          </div>
        }
      >
        <div className="form-grid">
          <div className="form-field">
            <span className="form-label">
              Nome <span style={{ color: "var(--red)" }}>*</span>
            </span>
            <input
              className="input"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">
              Email <span style={{ color: "var(--red)" }}>*</span>
            </span>
            <input
              className="input"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">
              WhatsApp <span style={{ color: "var(--red)" }}>*</span>
            </span>
            <input
              className="input"
              placeholder="+55 79 9 9999-9999"
              value={createForm.whatsapp}
              onChange={(e) => setCreateForm((p) => ({ ...p, whatsapp: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">CPF</span>
            <input
              className="input"
              value={createForm.cpf}
              onChange={(e) => setCreateForm((p) => ({ ...p, cpf: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">Cidade</span>
            <input
              className="input"
              value={createForm.city}
              onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">UF</span>
            <input
              className="input"
              maxLength={2}
              value={createForm.state}
              onChange={(e) => setCreateForm((p) => ({ ...p, state: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">Tipo chave PIX</span>
            <select
              className="input"
              value={createForm.pixKeyType}
              onChange={(e) => setCreateForm((p) => ({ ...p, pixKeyType: e.target.value }))}
            >
              <option value="">Selecione...</option>
              <option value="CPF">CPF</option>
              <option value="EMAIL">Email</option>
              <option value="PHONE">Celular</option>
              <option value="RANDOM">Aleatória</option>
            </select>
          </div>
          <div className="form-field">
            <span className="form-label">Chave PIX</span>
            <input
              className="input"
              value={createForm.pixKey}
              onChange={(e) => setCreateForm((p) => ({ ...p, pixKey: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">Taxa custom (%)</span>
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Padrão: 15%"
              value={createForm.customCommissionRate}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, customCommissionRate: e.target.value }))
              }
            />
          </div>
          <div className="form-field">
            <span className="form-label">Senha inicial</span>
            <input
              className="input"
              type="password"
              placeholder="Mín. 8 caracteres (em branco = afiliado define depois)"
              value={createForm.initialPassword}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, initialPassword: e.target.value }))
              }
            />
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        title="Editar afiliado"
        subtitle={editTarget ? `${editTarget.name} (${editTarget.email})` : ""}
        onClose={() => {
          if (!saving) setEditOpen(false);
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button
              className="btn-ghost"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={onEdit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        }
      >
        <div className="form-grid">
          <div className="form-field">
            <span className="form-label">
              Nome <span style={{ color: "var(--red)" }}>*</span>
            </span>
            <input
              className="input"
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">Status</span>
            <select
              className="input"
              value={editForm.status}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, status: e.target.value as AffiliateStatus }))
              }
            >
              <option value="PENDING">Pendente</option>
              <option value="ACTIVE">Ativo</option>
              <option value="SUSPENDED">Suspenso</option>
              <option value="BANNED">Banido</option>
            </select>
          </div>
          <div className="form-field">
            <span className="form-label">WhatsApp</span>
            <input
              className="input"
              value={editForm.whatsapp}
              onChange={(e) => setEditForm((p) => ({ ...p, whatsapp: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">CPF</span>
            <input
              className="input"
              value={editForm.cpf}
              onChange={(e) => setEditForm((p) => ({ ...p, cpf: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">Cidade</span>
            <input
              className="input"
              value={editForm.city}
              onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">UF</span>
            <input
              className="input"
              maxLength={2}
              value={editForm.state}
              onChange={(e) => setEditForm((p) => ({ ...p, state: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">Tipo chave PIX</span>
            <select
              className="input"
              value={editForm.pixKeyType}
              onChange={(e) => setEditForm((p) => ({ ...p, pixKeyType: e.target.value }))}
            >
              <option value="">Selecione...</option>
              <option value="CPF">CPF</option>
              <option value="EMAIL">Email</option>
              <option value="PHONE">Celular</option>
              <option value="RANDOM">Aleatória</option>
            </select>
          </div>
          <div className="form-field">
            <span className="form-label">Chave PIX</span>
            <input
              className="input"
              value={editForm.pixKey}
              onChange={(e) => setEditForm((p) => ({ ...p, pixKey: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <span className="form-label">Taxa custom (%)</span>
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Em branco = usa taxa padrão"
              value={editForm.customCommissionRate}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, customCommissionRate: e.target.value }))
              }
            />
          </div>
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <span className="form-label">Observação interna</span>
            <textarea
              className="input"
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* Approve modal */}
      <Modal
        open={approveOpen}
        title="Aprovar afiliado"
        subtitle={approveTarget ? `${approveTarget.name} (${approveTarget.email})` : ""}
        onClose={() => {
          if (!saving) setApproveOpen(false);
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button
              className="btn-ghost"
              onClick={() => setApproveOpen(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={onApprove} disabled={saving}>
              {saving ? "Aprovando..." : "Aprovar e ativar"}
            </button>
          </div>
        }
      >
        <div className="form-grid">
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <span className="form-label">
              Senha inicial <span style={{ color: "var(--red)" }}>*</span>
            </span>
            <input
              className="input"
              type="password"
              placeholder="Mín. 8 caracteres — afiliado vai trocar no primeiro login"
              value={approveForm.initialPassword}
              onChange={(e) =>
                setApproveForm((p) => ({ ...p, initialPassword: e.target.value }))
              }
            />
          </div>
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <span className="form-label">Observação interna</span>
            <textarea
              className="input"
              rows={3}
              value={approveForm.notes}
              onChange={(e) => setApproveForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
          {approveTarget?.whatsapp ? (
            <div
              className="form-field"
              style={{
                gridColumn: "1 / -1",
                background: "var(--panel-2, rgba(16,185,129,0.08))",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
              }}
            >
              <strong style={{ color: "#10b981" }}>📱 WhatsApp automático</strong>
              <div className="muted" style={{ marginTop: 4 }}>
                Ao aprovar, uma mensagem com o link do portal, login (email) e
                senha inicial será enviada para{" "}
                <strong>{approveTarget.whatsapp}</strong> via whatsapp-bridge.
              </div>
            </div>
          ) : (
            <div
              className="form-field"
              style={{
                gridColumn: "1 / -1",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
              }}
            >
              <strong style={{ color: "#f59e0b" }}>⚠️ Sem WhatsApp</strong>
              <div className="muted" style={{ marginTop: 4 }}>
                Este afiliado não tem WhatsApp cadastrado — as credenciais
                precisarão ser comunicadas manualmente.
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
