import { useEffect, useState } from "react";
import {
  listMySubmissions,
  submitMyEstablishment,
} from "../../services/affiliateSubmissionService";
import type {
  AffiliateDecodeSubmission,
  AffiliateDecodeSubmissionRequest,
  PlanModule,
} from "../../services/affiliateSubmissionService";

type PlanKey = "MESAS" | "DELIVERY" | "COMPLETA";

const PLAN_CATALOG: Record<PlanKey, { name: string; module: PlanModule; price: number; emoji: string }> = {
  MESAS:    { name: "Gestão de Mesas",   module: "MESA",     price: 79.90,  emoji: "🍽️" },
  DELIVERY: { name: "Gestão Delivery",   module: "DELIVERY", price: 99.90,  emoji: "🛵" },
  COMPLETA: { name: "Gestão Completa",   module: "COMPLETA", price: 149.90, emoji: "💎" },
};

type DurationKey = "MONTHLY" | "QUARTERLY" | "SEMESTRAL" | "ANNUAL";

const DURATION_CATALOG: Record<DurationKey, { label: string; days: number; discountPct: number }> = {
  MONTHLY:   { label: "Mensal",      days: 30,  discountPct: 0 },
  QUARTERLY: { label: "Trimestral",  days: 90,  discountPct: 5 },
  SEMESTRAL: { label: "Semestral",   days: 180, discountPct: 10 },
  ANNUAL:    { label: "Anual",       days: 365, discountPct: 20 },
};

const DEFAULT_PLAN: PlanKey = "COMPLETA";
const DEFAULT_DURATION: DurationKey = "MONTHLY";

const EMPTY: AffiliateDecodeSubmissionRequest = {
  establishmentName: "",
  city: "",
  state: "",
  cnpj: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  estimatedUsersCount: undefined,
  estimatedMonthlyRevenue: undefined,
  planModule: PLAN_CATALOG[DEFAULT_PLAN].module,
  planName: PLAN_CATALOG[DEFAULT_PLAN].name,
  planPrice: PLAN_CATALOG[DEFAULT_PLAN].price,
  planDiscountPct: DURATION_CATALOG[DEFAULT_DURATION].discountPct,
  planDurationDays: DURATION_CATALOG[DEFAULT_DURATION].days,
  planFeatures: "",
  notes: "",
};

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Aguardando aprovação", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  APPROVED: { label: "Aprovado e ativo", color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
  REJECTED: { label: "Rejeitado", color: "#fca5a5", bg: "rgba(239,68,68,0.15)" },
};

const MODULE_LABEL: Record<PlanModule, string> = {
  MESA: "Mesa",
  DELIVERY: "Delivery",
  COMPLETA: "Completa (Mesa + Delivery)",
};

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function AfiliadoNovoEstabelecimentoPage() {
  const [form, setForm] = useState<AffiliateDecodeSubmissionRequest>(EMPTY);
  const [planKey, setPlanKey] = useState<PlanKey>(DEFAULT_PLAN);
  const [durationKey, setDurationKey] = useState<DurationKey>(DEFAULT_DURATION);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [submissions, setSubmissions] = useState<AffiliateDecodeSubmission[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const plan = PLAN_CATALOG[planKey];
  const duration = DURATION_CATALOG[durationKey];
  const netTotal = plan.price * (duration.days / 30) * (1 - duration.discountPct / 100);

  function selectPlan(key: PlanKey) {
    const p = PLAN_CATALOG[key];
    setPlanKey(key);
    setForm((prev) => ({
      ...prev,
      planModule: p.module,
      planName: p.name,
      planPrice: p.price,
    }));
  }

  function selectDuration(key: DurationKey) {
    const d = DURATION_CATALOG[key];
    setDurationKey(key);
    setForm((prev) => ({
      ...prev,
      planDurationDays: d.days,
      planDiscountPct: d.discountPct,
    }));
  }

  async function loadList() {
    setLoadingList(true);
    try {
      const page = await listMySubmissions({ page: 0, size: 50 });
      setSubmissions(page.content);
    } catch (e) {
      // ignora
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  function update<K extends keyof AffiliateDecodeSubmissionRequest>(
    k: K,
    v: AffiliateDecodeSubmissionRequest[K]
  ) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.establishmentName.trim() || !form.city.trim() || !form.contactName.trim()
        || !form.contactPhone.trim()) {
      setError("Preencha os campos obrigatórios (*).");
      return;
    }

    setSaving(true);
    try {
      const payload: AffiliateDecodeSubmissionRequest = {
        ...form,
        state: form.state?.trim() || undefined,
        cnpj: form.cnpj?.trim() || undefined,
        contactEmail: form.contactEmail?.trim() || undefined,
        planFeatures: form.planFeatures?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        estimatedUsersCount: form.estimatedUsersCount || undefined,
        estimatedMonthlyRevenue: form.estimatedMonthlyRevenue || undefined,
        planDiscountPct: form.planDiscountPct || 0,
      };
      await submitMyEstablishment(payload);
      setSuccess(
        `Solicitação enviada! "${form.establishmentName}" foi adicionado à fila de aprovação. Você será notificado assim que o administrador revisar.`
      );
      setForm(EMPTY);
      await loadList();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao enviar a solicitação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <style>{`
        .aff-page-title { font-size: 24px; font-weight: 800; margin: 0 0 6px; }
        .aff-page-sub { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
        .aff-section {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .aff-section h3 { margin: 0 0 18px; font-size: 15px; font-weight: 800; }
        .aff-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }
        .aff-field { display: grid; gap: 6px; }
        .aff-field label {
          font-size: 11px;
          color: #cbd5e1;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .aff-field input, .aff-field select, .aff-field textarea {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          font-family: inherit;
        }
        .aff-field input:focus, .aff-field select:focus, .aff-field textarea:focus {
          border-color: #ff6b1a;
        }
        .aff-field textarea { resize: vertical; min-height: 72px; }
        .aff-required { color: #fca5a5; margin-left: 3px; }
        .aff-btn {
          padding: 12px 22px;
          background: linear-gradient(135deg,#ff6b1a,#ff9147);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .aff-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .aff-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 14px;
        }
        .aff-success {
          background: rgba(74,222,128,0.12);
          border: 1px solid rgba(74,222,128,0.3);
          color: #4ade80;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 14px;
        }
        .aff-sub-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 10px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
        }
        .aff-chip {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .aff-meta { color: #94a3b8; font-size: 12px; margin-top: 4px; }
        .aff-value {
          color: #ffb37a;
          font-weight: 700;
          font-size: 13px;
        }
        .aff-summary {
          margin-top: 18px;
          background: rgba(255,179,122,0.06);
          border: 1px dashed rgba(255,179,122,0.3);
          border-radius: 10px;
          padding: 14px 16px;
          display: grid;
          gap: 6px;
        }
        .aff-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #cbd5e1;
        }
        .aff-summary-row strong { color: #fff; font-weight: 700; }
        .aff-summary-total {
          border-top: 1px solid rgba(255,255,255,0.08);
          margin-top: 6px;
          padding-top: 8px;
          font-size: 14px;
        }
        .aff-summary-total strong { color: #ffb37a; font-size: 16px; }
      `}</style>

      <h1 className="aff-page-title">Cadastrar novo estabelecimento</h1>
      <div className="aff-page-sub">
        Fechou com um cliente? Preencha os dados abaixo para que ele seja
        vinculado ao seu perfil. Após a aprovação do administrador, o plano é
        ativado e começa a contar sua comissão.
      </div>

      {error && <div className="aff-error">{error}</div>}
      {success && <div className="aff-success">{success}</div>}

      <form onSubmit={onSubmit}>
        <div className="aff-section">
          <h3>Dados do estabelecimento</h3>
          <div className="aff-grid">
            <div className="aff-field">
              <label>Nome do estabelecimento<span className="aff-required">*</span></label>
              <input
                value={form.establishmentName}
                onChange={(e) => update("establishmentName", e.target.value)}
                placeholder="Ex: Hamburgueria Central"
              />
            </div>
            <div className="aff-field">
              <label>Cidade<span className="aff-required">*</span></label>
              <input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="Ex: São Paulo"
              />
            </div>
            <div className="aff-field">
              <label>UF</label>
              <input
                value={form.state ?? ""}
                onChange={(e) => update("state", e.target.value.toUpperCase())}
                maxLength={2}
                placeholder="SP"
              />
            </div>
            <div className="aff-field">
              <label>CNPJ</label>
              <input
                value={form.cnpj ?? ""}
                onChange={(e) => update("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>
        </div>

        <div className="aff-section">
          <h3>Responsável / contato</h3>
          <div className="aff-grid">
            <div className="aff-field">
              <label>Nome do responsável<span className="aff-required">*</span></label>
              <input
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="aff-field">
              <label>Email de contato</label>
              <input
                type="email"
                value={form.contactEmail ?? ""}
                onChange={(e) => update("contactEmail", e.target.value)}
                placeholder="dono@restaurante.com"
              />
            </div>
            <div className="aff-field">
              <label>WhatsApp do responsável<span className="aff-required">*</span></label>
              <input
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="aff-field">
              <label>Nº estimado de usuários</label>
              <input
                type="number"
                min={0}
                value={form.estimatedUsersCount ?? ""}
                onChange={(e) =>
                  update("estimatedUsersCount", e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
            <div className="aff-field">
              <label>Faturamento mensal estimado (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.estimatedMonthlyRevenue ?? ""}
                onChange={(e) =>
                  update(
                    "estimatedMonthlyRevenue",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              />
            </div>
          </div>
        </div>

        <div className="aff-section">
          <h3>Plano contratado</h3>
          <div className="aff-grid">
            <div className="aff-field">
              <label>Plano<span className="aff-required">*</span></label>
              <select value={planKey} onChange={(e) => selectPlan(e.target.value as PlanKey)}>
                {(Object.keys(PLAN_CATALOG) as PlanKey[]).map((k) => (
                  <option key={k} value={k}>
                    {PLAN_CATALOG[k].emoji} {PLAN_CATALOG[k].name} · {fmtBRL(PLAN_CATALOG[k].price)}/mês
                  </option>
                ))}
              </select>
            </div>
            <div className="aff-field">
              <label>Duração<span className="aff-required">*</span></label>
              <select
                value={durationKey}
                onChange={(e) => selectDuration(e.target.value as DurationKey)}
              >
                {(Object.keys(DURATION_CATALOG) as DurationKey[]).map((k) => {
                  const d = DURATION_CATALOG[k];
                  return (
                    <option key={k} value={k}>
                      {d.label} ({d.days} dias){d.discountPct > 0 ? ` · -${d.discountPct}%` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="aff-summary">
            <div className="aff-summary-row">
              <span>Plano</span>
              <strong>{plan.name}</strong>
            </div>
            <div className="aff-summary-row">
              <span>Valor mensal</span>
              <strong>{fmtBRL(plan.price)}</strong>
            </div>
            <div className="aff-summary-row">
              <span>Duração</span>
              <strong>{duration.label} ({duration.days} dias)</strong>
            </div>
            <div className="aff-summary-row">
              <span>Desconto aplicado</span>
              <strong style={{ color: duration.discountPct > 0 ? "#4ade80" : undefined }}>
                {duration.discountPct > 0 ? `-${duration.discountPct}%` : "—"}
              </strong>
            </div>
            <div className="aff-summary-row aff-summary-total">
              <span>Total do período</span>
              <strong>{fmtBRL(netTotal)}</strong>
            </div>
          </div>

          <div className="aff-field" style={{ marginTop: 14 }}>
            <label>Recursos / features do plano</label>
            <textarea
              value={form.planFeatures ?? ""}
              onChange={(e) => update("planFeatures", e.target.value)}
              placeholder="Ex: Atendimento prioritário, exportação de relatórios, etc."
            />
          </div>
          <div className="aff-field" style={{ marginTop: 14 }}>
            <label>Observações internas</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Alguma informação extra para o admin (opcional)"
            />
          </div>
        </div>

        <button className="aff-btn" type="submit" disabled={saving}>
          {saving ? "Enviando..." : "Enviar para aprovação"}
        </button>
      </form>

      <div className="aff-section" style={{ marginTop: 28 }}>
        <h3>Minhas solicitações</h3>
        {loadingList ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Carregando...</div>
        ) : submissions.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>
            Você ainda não enviou nenhuma solicitação de cadastro.
          </div>
        ) : (
          submissions.map((s) => {
            const st = STATUS_LABEL[s.status];
            return (
              <div key={s.id} className="aff-sub-card">
                <div>
                  <div style={{ fontWeight: 700 }}>{s.establishmentName}</div>
                  <div className="aff-meta">
                    {s.city}
                    {s.state ? ` / ${s.state}` : ""} · {MODULE_LABEL[s.planModule]} ·{" "}
                    <span className="aff-value">
                      R$ {s.planPrice.toFixed(2)}
                    </span>{" "}
                    · Enviado em {new Date(s.submittedAt).toLocaleString("pt-BR")}
                  </div>
                  {s.status === "REJECTED" && s.rejectionReason && (
                    <div
                      className="aff-meta"
                      style={{ color: "#fca5a5", marginTop: 6 }}
                    >
                      Motivo: {s.rejectionReason}
                    </div>
                  )}
                  {s.status === "APPROVED" && s.decodeCode && (
                    <div className="aff-meta" style={{ color: "#4ade80", marginTop: 6 }}>
                      Código do decode: <strong>{s.decodeCode}</strong>
                    </div>
                  )}
                </div>
                <div
                  className="aff-chip"
                  style={{ color: st.color, background: st.bg }}
                >
                  {st.label}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
