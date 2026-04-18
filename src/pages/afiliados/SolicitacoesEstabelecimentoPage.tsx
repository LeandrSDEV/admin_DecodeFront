import { useEffect, useMemo, useState } from "react";
import {
  IconCheck,
  IconEye,
  IconRefresh,
  IconSearch,
  IconTrash,
} from "../../components/ui/Icons";
import Modal from "../../components/Modal";
import {
  approveSubmission,
  listAllSubmissions,
  rejectSubmission,
} from "../../services/affiliateSubmissionService";
import type {
  AffiliateDecodeSubmission,
  AffiliateDecodeSubmissionStatus,
  PlanModule,
} from "../../services/affiliateSubmissionService";

const STATUS_LABEL: Record<
  AffiliateDecodeSubmissionStatus,
  { cls: string; label: string }
> = {
  PENDING: { cls: "badge amber", label: "Pendente" },
  APPROVED: { cls: "badge ok", label: "Aprovado" },
  REJECTED: { cls: "badge bad", label: "Rejeitado" },
};

const MODULE_LABEL: Record<PlanModule, string> = {
  MESA: "Mesa",
  DELIVERY: "Delivery",
  COMPLETA: "Completa",
};

function fmtCurrency(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleString("pt-BR");
}

export default function SolicitacoesEstabelecimentoPage() {
  const [rows, setRows] = useState<AffiliateDecodeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<AffiliateDecodeSubmissionStatus | "">("PENDING");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [detail, setDetail] = useState<AffiliateDecodeSubmission | null>(null);
  const [rejectOpen, setRejectOpen] = useState<AffiliateDecodeSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listAllSubmissions({
        q: q || undefined,
        status: statusFilter || undefined,
        page,
        size: 20,
      });
      setRows(res.content);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao carregar solicitações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function onApprove(row: AffiliateDecodeSubmission) {
    if (
      !window.confirm(
        `Aprovar a solicitação de "${row.establishmentName}"? Isso criará o Decode e ativará o plano ${row.planName} (${fmtCurrency(row.planPrice)}) vinculado ao afiliado ${row.affiliateName}.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await approveSubmission(row.id);
      showSuccess(`"${row.establishmentName}" aprovado e ativado.`);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao aprovar.");
    } finally {
      setSaving(false);
    }
  }

  async function onReject() {
    if (!rejectOpen) return;
    if (rejectReason.trim().length < 3) {
      setError("Informe um motivo de rejeição (mín. 3 caracteres).");
      return;
    }
    setSaving(true);
    try {
      await rejectSubmission(rejectOpen.id, rejectReason.trim());
      showSuccess(`Solicitação de "${rejectOpen.establishmentName}" rejeitada.`);
      setRejectOpen(null);
      setRejectReason("");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao rejeitar.");
    } finally {
      setSaving(false);
    }
  }

  const visibleRows = useMemo(() => rows, [rows]);

  return (
    <div className="page-wrap">
      <div
        className="row"
        style={{
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div>
          <div className="h2">Solicitações de estabelecimento</div>
          <div className="muted" style={{ fontSize: 13 }}>
            Propostas enviadas pelos afiliados aguardando revisão. Ao aprovar,
            o Decode e a assinatura são criados automaticamente.
          </div>
        </div>
        <button className="btn-ghost" onClick={load} disabled={loading}>
          <IconRefresh /> {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {error && (
        <div
          className="muted"
          style={{
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="muted"
          style={{
            background: "rgba(74,222,128,0.12)",
            border: "1px solid rgba(74,222,128,0.3)",
            color: "#4ade80",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {success}
        </div>
      )}

      <div className="row" style={{ gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            flex: "1 1 260px",
            minWidth: 220,
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
            placeholder="Buscar por estabelecimento, afiliado, contato..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(0);
                load();
              }
            }}
            style={{ width: "100%", paddingLeft: 34 }}
          />
        </div>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as AffiliateDecodeSubmissionStatus | "");
            setPage(0);
          }}
          style={{ minWidth: 170 }}
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendentes</option>
          <option value="APPROVED">Aprovados</option>
          <option value="REJECTED">Rejeitados</option>
        </select>
        <button
          className="btn-ghost"
          onClick={() => {
            setPage(0);
            load();
          }}
        >
          Filtrar
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Estabelecimento</th>
              <th>Afiliado</th>
              <th>Plano</th>
              <th>Valor</th>
              <th>Enviado em</th>
              <th>Status</th>
              <th style={{ width: 180 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && visibleRows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
            {!loading &&
              visibleRows.map((r) => {
                const badge = STATUS_LABEL[r.status];
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{r.establishmentName}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {r.city}
                        {r.state ? ` / ${r.state}` : ""} · {r.contactName} · {r.contactPhone}
                      </div>
                    </td>
                    <td>
                      <div>{r.affiliateName}</div>
                      <div className="muted" style={{ fontSize: 12, fontFamily: "monospace" }}>
                        {r.affiliateRefCode}
                      </div>
                    </td>
                    <td>
                      <div>{r.planName}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {MODULE_LABEL[r.planModule]} · {r.planDurationDays}d
                      </div>
                    </td>
                    <td>
                      <strong>{fmtCurrency(r.planPrice)}</strong>
                      {r.planDiscountPct > 0 && (
                        <div className="muted" style={{ fontSize: 11 }}>
                          -{r.planDiscountPct}%
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 13 }}>{fmtDate(r.submittedAt)}</td>
                    <td>
                      <span className={badge.cls}>{badge.label}</span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                        <button
                          className="btn-ghost"
                          title="Detalhes"
                          onClick={() => setDetail(r)}
                        >
                          <IconEye />
                        </button>
                        {r.status === "PENDING" && (
                          <>
                            <button
                              className="btn-primary"
                              title="Aprovar"
                              onClick={() => onApprove(r)}
                              disabled={saving}
                            >
                              <IconCheck />
                            </button>
                            <button
                              className="btn-ghost"
                              title="Rejeitar"
                              onClick={() => {
                                setRejectOpen(r);
                                setRejectReason("");
                              }}
                              disabled={saving}
                            >
                              <IconTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="row" style={{ gap: 8, justifyContent: "center", marginTop: 16 }}>
          <button
            className="btn-ghost"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </button>
          <span className="muted" style={{ alignSelf: "center", fontSize: 13 }}>
            Página {page + 1} de {totalPages}
          </span>
          <button
            className="btn-ghost"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </button>
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!detail}
        title={detail ? detail.establishmentName : ""}
        subtitle={detail ? `${detail.city}${detail.state ? " / " + detail.state : ""}` : ""}
        onClose={() => setDetail(null)}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setDetail(null)}>
              Fechar
            </button>
            {detail?.status === "PENDING" && (
              <>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (detail) {
                      const d = detail;
                      setDetail(null);
                      onApprove(d);
                    }
                  }}
                  disabled={saving}
                >
                  Aprovar
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    if (detail) {
                      setRejectOpen(detail);
                      setDetail(null);
                    }
                  }}
                  disabled={saving}
                >
                  Rejeitar
                </button>
              </>
            )}
          </div>
        }
      >
        {detail && (
          <div className="form-grid">
            <Info label="Afiliado" value={`${detail.affiliateName} (${detail.affiliateRefCode})`} />
            <Info label="Status" value={STATUS_LABEL[detail.status].label} />
            <Info label="Contato" value={detail.contactName} />
            <Info label="WhatsApp" value={detail.contactPhone} />
            <Info label="Email" value={detail.contactEmail || "-"} />
            <Info label="CNPJ" value={detail.cnpj || "-"} />
            <Info label="Módulo" value={MODULE_LABEL[detail.planModule]} />
            <Info label="Plano" value={detail.planName} />
            <Info label="Valor" value={fmtCurrency(detail.planPrice)} />
            <Info label="Desconto" value={`${detail.planDiscountPct}%`} />
            <Info label="Duração" value={`${detail.planDurationDays} dias`} />
            <Info
              label="Faturamento estimado"
              value={fmtCurrency(detail.estimatedMonthlyRevenue ?? 0)}
            />
            <Info
              label="Usuários estimados"
              value={String(detail.estimatedUsersCount ?? "-")}
            />
            <Info label="Enviado em" value={fmtDate(detail.submittedAt)} />
            {detail.reviewedAt && (
              <Info
                label="Revisado em"
                value={`${fmtDate(detail.reviewedAt)} por ${detail.reviewedByName || "-"}`}
              />
            )}
            {detail.decodeCode && (
              <Info label="Código do Decode criado" value={detail.decodeCode} />
            )}
            {detail.rejectionReason && (
              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <span className="form-label">Motivo da rejeição</span>
                <div
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#fca5a5",
                    padding: 10,
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  {detail.rejectionReason}
                </div>
              </div>
            )}
            {detail.planFeatures && (
              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <span className="form-label">Features do plano</span>
                <div className="muted" style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                  {detail.planFeatures}
                </div>
              </div>
            )}
            {detail.notes && (
              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <span className="form-label">Observações do afiliado</span>
                <div className="muted" style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                  {detail.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal
        open={!!rejectOpen}
        title="Rejeitar solicitação"
        subtitle={rejectOpen ? rejectOpen.establishmentName : ""}
        onClose={() => {
          if (!saving) {
            setRejectOpen(null);
            setRejectReason("");
          }
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button
              className="btn-ghost"
              onClick={() => {
                setRejectOpen(null);
                setRejectReason("");
              }}
              disabled={saving}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={onReject} disabled={saving}>
              {saving ? "Rejeitando..." : "Rejeitar"}
            </button>
          </div>
        }
      >
        <div className="form-grid">
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
            <span className="form-label">
              Motivo da rejeição <span style={{ color: "var(--red)" }}>*</span>
            </span>
            <textarea
              className="input"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: dados de contato inválidos, valor fora da tabela comercial, etc."
            />
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              O motivo ficará visível para o afiliado no portal.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="form-field">
      <span className="form-label">{label}</span>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  );
}

