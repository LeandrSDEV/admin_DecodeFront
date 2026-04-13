import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IconChevronLeft,
  IconRefresh,
  IconCheck,
  IconX,
  IconClock,
} from "../../components/ui/Icons";
import Modal from "../../components/Modal";
import {
  estimateAffiliate,
  getAffiliate,
  listAffiliateCommissions,
  markCommissionPaid,
  reactivateAffiliate,
  suspendAffiliate,
  updateAffiliate,
} from "../../services/affiliateService";
import type {
  Affiliate,
  AffiliateStatus,
  Commission,
  CommissionStatus,
} from "../../services/affiliateService";

const STATUS_BADGE: Record<AffiliateStatus, { cls: string; label: string }> = {
  PENDING: { cls: "badge amber", label: "Pendente" },
  ACTIVE: { cls: "badge ok", label: "Ativo" },
  SUSPENDED: { cls: "badge bad", label: "Suspenso" },
  BANNED: { cls: "badge bad", label: "Banido" },
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

export default function AfiliadoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Suspend modal
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  // Mark paid modal
  const [paidOpen, setPaidOpen] = useState(false);
  const [paidTarget, setPaidTarget] = useState<Commission | null>(null);
  const [paidRef, setPaidRef] = useState("");
  const [paidNotes, setPaidNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit rate
  const [rateOpen, setRateOpen] = useState(false);
  const [rateValue, setRateValue] = useState("");

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [a, c, e] = await Promise.all([
        getAffiliate(id),
        listAffiliateCommissions(id, { page: 0, size: 50 }),
        estimateAffiliate(id).catch(() => null),
      ]);
      setAffiliate(a);
      setCommissions(c.content || []);
      setEstimate(e ? e.estimateAmount : null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Falha ao carregar afiliado.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSuspend() {
    if (!id) return;
    setSaving(true);
    try {
      await suspendAffiliate(id, suspendReason || "Sem motivo informado");
      setSuspendOpen(false);
      showSuccess("Afiliado suspenso.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao suspender.");
    } finally {
      setSaving(false);
    }
  }

  async function onReactivate() {
    if (!id) return;
    try {
      await reactivateAffiliate(id);
      showSuccess("Afiliado reativado.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao reativar.");
    }
  }

  function openMarkPaid(c: Commission) {
    setPaidTarget(c);
    setPaidRef("");
    setPaidNotes("");
    setPaidOpen(true);
  }

  async function onMarkPaid() {
    if (!paidTarget) return;
    if (!paidRef.trim()) {
      setError("Informe o comprovante/EndToEndId do PIX.");
      return;
    }
    setSaving(true);
    try {
      await markCommissionPaid(paidTarget.id, paidRef.trim(), paidNotes || undefined);
      setPaidOpen(false);
      showSuccess("Comissão marcada como paga.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao marcar como paga.");
    } finally {
      setSaving(false);
    }
  }

  function openRate() {
    setRateValue(affiliate?.customCommissionRate?.toString() || "");
    setRateOpen(true);
  }

  async function onSaveRate() {
    if (!id) return;
    setSaving(true);
    try {
      await updateAffiliate(id, {
        customCommissionRate: rateValue ? Number(rateValue) : undefined,
      });
      setRateOpen(false);
      showSuccess("Taxa atualizada.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao atualizar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="muted" style={{ padding: 20 }}>
          Carregando afiliado...
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="page">
        <div className="alert-danger">{error || "Afiliado não encontrado."}</div>
        <button className="btn-ghost" onClick={() => navigate("/parceiros/afiliados")}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
          <button
            className="btn-ghost"
            onClick={() => navigate("/parceiros/afiliados")}
            style={{ padding: "6px 8px" }}
          >
            <IconChevronLeft size={15} />
          </button>
          <div>
            <h1>{affiliate.name}</h1>
            <div className="muted">
              {affiliate.email} • {affiliate.whatsapp} • Ref:{" "}
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text)" }}>
                {affiliate.refCode}
              </span>
            </div>
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <span className={STATUS_BADGE[affiliate.status].cls}>
            {STATUS_BADGE[affiliate.status].label}
          </span>
          <button className="btn-ghost" onClick={load}>
            <IconRefresh size={15} />
          </button>
          {affiliate.status === "ACTIVE" && (
            <button
              className="btn-danger"
              onClick={() => setSuspendOpen(true)}
              style={{ padding: "6px 12px" }}
            >
              <IconX size={14} /> Suspender
            </button>
          )}
          {affiliate.status === "SUSPENDED" && (
            <button
              className="btn-primary"
              onClick={onReactivate}
              style={{ padding: "6px 12px" }}
            >
              <IconCheck size={14} /> Reativar
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert-danger">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {/* KPIs */}
      <div className="info-grid" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <span className="stat-label">Clientes ativos</span>
          <span className="stat-value" style={{ color: "var(--green)" }}>
            {affiliate.activeClients}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total de indicações</span>
          <span className="stat-value">{affiliate.totalReferrals}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Já pago</span>
          <span className="stat-value" style={{ color: "var(--green)" }}>
            {fmtCurrency(affiliate.totalEarned)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">A receber</span>
          <span className="stat-value" style={{ color: "var(--amber)" }}>
            {fmtCurrency(affiliate.pendingAmount)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Estimativa mês corrente</span>
          <span className="stat-value">{fmtCurrency(estimate || 0)}</span>
        </div>
      </div>

      {/* Profile */}
      <div className="card" style={{ marginBottom: 14, padding: 18 }}>
        <div
          className="row"
          style={{ justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}
        >
          <h3 style={{ margin: 0 }}>Dados do afiliado</h3>
          <button className="btn-ghost" onClick={openRate}>
            Alterar taxa
          </button>
        </div>
        <div className="form-grid">
          <div>
            <div className="muted" style={{ fontSize: 11 }}>
              CPF
            </div>
            <div>{affiliate.cpf || "-"}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11 }}>
              Cidade / UF
            </div>
            <div>
              {affiliate.city || "-"} / {affiliate.state || "-"}
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11 }}>
              Tipo PIX
            </div>
            <div>{affiliate.pixKeyType || "-"}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11 }}>
              Chave PIX
            </div>
            <div style={{ wordBreak: "break-all" }}>{affiliate.pixKey || "-"}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11 }}>
              Taxa custom
            </div>
            <div>
              {affiliate.customCommissionRate
                ? `${affiliate.customCommissionRate}%`
                : "Padrão (15% / 18%)"}
            </div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11 }}>
              Aprovado em
            </div>
            <div>{fmtDate(affiliate.approvedAt)}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11 }}>
              Último login
            </div>
            <div>{affiliate.lastLoginAt ? new Date(affiliate.lastLoginAt).toLocaleString("pt-BR") : "Nunca"}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: 11 }}>
              Cadastro
            </div>
            <div>{fmtDate(affiliate.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Commissions */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0 }}>Histórico de comissões</h3>
          <span className="muted">{commissions.length} registros</span>
        </div>
        {commissions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IconClock size={22} />
            </div>
            <div className="empty-state-title">Nenhuma comissão gerada ainda</div>
            <div className="empty-state-text">
              Comissões são geradas automaticamente no dia 1 de cada mês para o mês anterior.
            </div>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Cliente</th>
                  <th>Plano</th>
                  <th>Valor plano</th>
                  <th>Taxa</th>
                  <th>Comissão</th>
                  <th>Status</th>
                  <th>Carência até</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{fmtMonth(c.referenceMonth)}</td>
                    <td>{c.decodeName}</td>
                    <td>{c.planName}</td>
                    <td>{fmtCurrency(c.planPrice)}</td>
                    <td>{c.commissionRate}%</td>
                    <td style={{ fontWeight: 700, color: "var(--green)" }}>
                      {fmtCurrency(c.commissionAmount)}
                    </td>
                    <td>
                      <span className={COMMISSION_BADGE[c.status].cls}>
                        {COMMISSION_BADGE[c.status].label}
                      </span>
                    </td>
                    <td>{fmtDate(c.carenciaUntil)}</td>
                    <td style={{ textAlign: "right" }}>
                      {c.status === "APPROVED" && (
                        <button
                          className="btn-primary"
                          onClick={() => openMarkPaid(c)}
                          style={{ padding: "5px 10px" }}
                        >
                          Marcar paga
                        </button>
                      )}
                      {c.status === "PAID" && c.paidReference && (
                        <span className="muted" style={{ fontSize: 11 }}>
                          {c.paidReference.slice(0, 16)}...
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspend modal */}
      <Modal
        open={suspendOpen}
        title="Suspender afiliado"
        subtitle="O afiliado perderá o acesso ao portal mas o histórico é mantido."
        onClose={() => {
          if (!saving) setSuspendOpen(false);
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setSuspendOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-danger" onClick={onSuspend} disabled={saving}>
              {saving ? "..." : "Suspender"}
            </button>
          </div>
        }
      >
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <span className="form-label">Motivo</span>
          <textarea
            className="input"
            rows={3}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* Mark paid modal */}
      <Modal
        open={paidOpen}
        title="Marcar comissão como paga"
        subtitle={
          paidTarget ? `${fmtCurrency(paidTarget.commissionAmount)} — ${paidTarget.decodeName}` : ""
        }
        onClose={() => {
          if (!saving) setPaidOpen(false);
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setPaidOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={onMarkPaid} disabled={saving}>
              {saving ? "..." : "Confirmar pagamento"}
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
            placeholder="Ex: E60746948202604121430s00f4f4f4f4f"
            value={paidRef}
            onChange={(e) => setPaidRef(e.target.value)}
          />
        </div>
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <span className="form-label">Observação</span>
          <textarea
            className="input"
            rows={2}
            value={paidNotes}
            onChange={(e) => setPaidNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* Edit rate modal */}
      <Modal
        open={rateOpen}
        title="Alterar taxa de comissão"
        subtitle="Sobrescreve a taxa padrão do sistema só para este afiliado."
        onClose={() => {
          if (!saving) setRateOpen(false);
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setRateOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={onSaveRate} disabled={saving}>
              {saving ? "..." : "Salvar"}
            </button>
          </div>
        }
      >
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <span className="form-label">Taxa custom (%)</span>
          <input
            className="input"
            type="number"
            step="0.01"
            placeholder="Em branco = volta pro padrão"
            value={rateValue}
            onChange={(e) => setRateValue(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
