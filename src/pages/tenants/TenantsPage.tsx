import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import Modal from "../../components/Modal";
import TenantConfigModal from "./TenantConfigModal";
import {
  IconBuilding,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconTrash,
} from "../../components/ui/Icons";

type Tenant = {
  id: number;
  slug: string;
  schemaName: string;
  subdominio: string;
  nomeEstabelecimento: string;
  nichosAtivos: string;
  gestaoAtiva: boolean;
  status: string;
  rotaPublica: string | null;
  lastSeenAt: string | null;
  createdAt: string;
};

type TenantPlanInfo = {
  type: string;
  operationMode: string;
  headline?: string;
};

const TYPE_LABELS: Record<string, string> = {
  RESTAURANT: "Restaurante",
  PIZZERIA: "Pizzaria",
  LANCHONETE: "Lanchonete",
  ACAITERIA: "Açaíteria",
  TAPIOCARIA: "Tapiocaria",
  CONFEITARIA: "Confeitaria",
  SORVETERIA: "Sorveteria",
  CAFETERIA: "Cafeteria",
  GENERIC: "Genérico",
};

const MODE_LABELS: Record<string, string> = {
  MESA: "Gestão de mesas",
  DELIVERY: "Delivery",
  BOTH: "Mesa + Delivery",
};


type FormState = {
  slug: string;
  subdominio: string;
  nomeEstabelecimento: string;
  nichosAtivos: string;
  gestaoAtiva: string;
  rotaPublica: string;
  status: string;
};

const emptyForm: FormState = {
  slug: "",
  subdominio: "",
  nomeEstabelecimento: "",
  nichosAtivos: "[]",
  gestaoAtiva: "true",
  rotaPublica: "",
  status: "ACTIVE",
};

function fmtDateTime(v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("pt-BR");
  } catch {
    return String(v);
  }
}

export default function TenantsPage() {
  const [items, setItems] = useState<Tenant[]>([]);
  const [planByTenant, setPlanByTenant] = useState<Record<number, TenantPlanInfo>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [configTenant, setConfigTenant] = useState<Tenant | null>(null);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Tenant[]>("/api/admin/tenants");
      const list = Array.isArray(res.data) ? res.data : [];
      setItems(list);
      void loadPlans(list);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (e as any)?.response?.data?.message || "Falha ao carregar tenants.";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlans(list: Tenant[]) {
    const active = list.filter((t) => t.status === "ACTIVE");
    const results = await Promise.allSettled(
      active.map((t) => api.get<TenantPlanInfo>(`/api/admin/tenants/${t.id}/config`)),
    );
    setPlanByTenant((prev) => {
      const next = { ...prev };
      results.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          const cfg = r.value.data;
          next[active[idx].id] = {
            type: cfg.type,
            operationMode: cfg.operationMode,
            headline: cfg.headline,
          };
        }
      });
      return next;
    });
  }

  function applyPlanUpdate(tenantId: number, info: TenantPlanInfo) {
    setPlanByTenant((prev) => ({ ...prev, [tenantId]: info }));
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((it) =>
      JSON.stringify(it).toLowerCase().includes(needle)
    );
  }, [items, q]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(t: Tenant) {
    setEditing(t);
    setForm({
      slug: t.slug,
      subdominio: t.subdominio,
      nomeEstabelecimento: t.nomeEstabelecimento || "",
      nichosAtivos: t.nichosAtivos || "[]",
      gestaoAtiva: String(t.gestaoAtiva),
      rotaPublica: t.rotaPublica || "",
      status: t.status || "ACTIVE",
    });
    setFieldErrors({});
    setModalOpen(true);
  }

  async function onSuspend(t: Tenant) {
    const ok = window.confirm(
      `Suspender tenant "${t.nomeEstabelecimento || t.slug}"?\n\nO tenant ficará inacessível mas os dados permanecem intactos.`
    );
    if (!ok) return;
    try {
      await api.delete(`/api/admin/tenants/${t.id}`);
      showSuccess("Tenant suspenso.");
      await load();
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (e as any)?.response?.data?.message || "Falha ao suspender tenant.";
      setError(msg);
    }
  }

  async function onSave() {
    const errors: Record<string, string> = {};
    if (!editing) {
      if (!form.slug.trim()) errors.slug = "Slug é obrigatório";
      else if (!/^[a-z][a-z0-9_]{1,39}$/.test(form.slug.trim()))
        errors.slug = "Use só letras minúsculas, números e _, começando com letra";
      if (!form.subdominio.trim()) errors.subdominio = "Subdomínio é obrigatório";
    }
    if (!form.nomeEstabelecimento.trim())
      errors.nomeEstabelecimento = "Nome do estabelecimento é obrigatório";
    try {
      JSON.parse(form.nichosAtivos || "[]");
    } catch {
      errors.nichosAtivos = "Nichos ativos precisa ser um JSON array válido";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/admin/tenants/${editing.id}`, {
          nomeEstabelecimento: form.nomeEstabelecimento.trim(),
          nichosAtivos: form.nichosAtivos.trim() || "[]",
          gestaoAtiva: form.gestaoAtiva === "true",
          rotaPublica: form.rotaPublica.trim() || null,
          status: form.status,
        });
        showSuccess("Tenant atualizado.");
      } else {
        await api.post("/api/admin/tenants", {
          slug: form.slug.trim().toLowerCase(),
          subdominio: form.subdominio.trim().toLowerCase(),
          nomeEstabelecimento: form.nomeEstabelecimento.trim(),
          nichosAtivos: form.nichosAtivos.trim() || "[]",
          gestaoAtiva: form.gestaoAtiva === "true",
          rotaPublica: form.rotaPublica.trim() || null,
        });
        showSuccess("Tenant provisionado com sucesso.");
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (e as any)?.response?.data?.message || "Falha ao salvar tenant.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tenants</h1>
          <div className="muted">
            {items.length} tenant{items.length !== 1 ? "s" : ""} registrado
            {items.length !== 1 ? "s" : ""} · gestão de schemas do backend operacional
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
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
              placeholder="Buscar tenants..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 220, paddingLeft: 34 }}
            />
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <IconPlus size={15} /> Novo tenant
          </button>
          <button className="btn-ghost" onClick={load} disabled={loading}>
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      {error && <div className="alert-danger">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="muted" style={{ padding: 20 }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><IconBuilding size={22} /></div>
            <div className="empty-state-title">Nenhum tenant encontrado</div>
            <div className="empty-state-text">
              {q ? "Tente outro termo de busca." : 'Clique em "Novo tenant" para provisionar.'}
            </div>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Estabelecimento</th>
                  <th>Slug</th>
                  <th>Subdomínio</th>
                  <th>Schema</th>
                  <th>Nicho</th>
                  <th>Plano</th>
                  <th>Gestão</th>
                  <th>Último heartbeat</th>
                  <th style={{ width: 130, textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="avatar sm">
                          {(t.nomeEstabelecimento || t.slug || "T").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            {t.nomeEstabelecimento || "—"}
                          </div>
                          <div className="muted" style={{ fontSize: 11 }}>
                            ID: {t.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><code style={{ fontSize: 12 }}>{t.slug}</code></td>
                    <td>
                      <a href={`https://${t.subdominio}`} target="_blank" rel="noreferrer">
                        {t.subdominio}
                      </a>
                    </td>
                    <td><code style={{ fontSize: 12 }}>{t.schemaName}</code></td>
                    <td>
                      {planByTenant[t.id]
                        ? TYPE_LABELS[planByTenant[t.id].type] || planByTenant[t.id].type
                        : t.status === "ACTIVE"
                        ? <span className="muted" style={{ fontSize: 12 }}>carregando…</span>
                        : "—"}
                    </td>
                    <td>
                      <span
                        className="badge blue"
                        style={{ fontWeight: 600 }}
                        title={planByTenant[t.id]?.headline || ""}
                      >
                        {planByTenant[t.id]
                          ? MODE_LABELS[planByTenant[t.id].operationMode] ||
                            planByTenant[t.id].operationMode
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.gestaoAtiva ? "ok" : "bad"}`}>
                        {t.gestaoAtiva ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{fmtDateTime(t.lastSeenAt)}</td>
                    <td>
                      <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                        <button
                          className="btn-ghost"
                          onClick={() => setConfigTenant(t)}
                          title="Configurar nicho e modo"
                          style={{ padding: "6px 8px" }}
                          disabled={t.status !== "ACTIVE"}
                        >
                          <IconSettings size={15} />
                        </button>
                        <button
                          className="btn-ghost"
                          onClick={() => openEdit(t)}
                          title="Editar metadata"
                          style={{ padding: "6px 8px" }}
                        >
                          <IconPencil size={15} />
                        </button>
                        {t.status === "ACTIVE" && (
                          <button
                            className="btn-danger"
                            onClick={() => onSuspend(t)}
                            title="Suspender"
                            style={{ padding: "6px 8px" }}
                          >
                            <IconTrash size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Editar tenant" : "Novo tenant"}
        subtitle={
          editing
            ? `Editando ${editing.nomeEstabelecimento || editing.slug}`
            : "Provisiona um novo schema no backend operacional"
        }
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button
              className="btn-ghost"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={onSave} disabled={saving}>
              {saving
                ? editing
                  ? "Salvando..."
                  : "Provisionando..."
                : editing
                ? "Atualizar"
                : "Provisionar"}
            </button>
          </div>
        }
      >
        <div className="form-grid">
          {!editing && (
            <div className="form-grid cols-2">
              <div className="form-field">
                <span className="form-label">
                  Slug <span style={{ color: "var(--red)" }}>*</span>
                </span>
                <input
                  className={`input${fieldErrors.slug ? " input-error" : ""}`}
                  value={form.slug}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, slug: e.target.value.toLowerCase() }));
                    if (fieldErrors.slug) setFieldErrors((p) => ({ ...p, slug: "" }));
                  }}
                  placeholder="carrara"
                />
                {fieldErrors.slug && <span className="form-error">{fieldErrors.slug}</span>}
                <span className="form-hint">
                  Identificador único do schema no Postgres (só minúsculas, números, _)
                </span>
              </div>
              <div className="form-field">
                <span className="form-label">
                  Subdomínio <span style={{ color: "var(--red)" }}>*</span>
                </span>
                <input
                  className={`input${fieldErrors.subdominio ? " input-error" : ""}`}
                  value={form.subdominio}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, subdominio: e.target.value.toLowerCase() }));
                    if (fieldErrors.subdominio)
                      setFieldErrors((p) => ({ ...p, subdominio: "" }));
                  }}
                  placeholder="carrara.portaledtech.com"
                />
                {fieldErrors.subdominio && (
                  <span className="form-error">{fieldErrors.subdominio}</span>
                )}
              </div>
            </div>
          )}

          <div className="form-field">
            <span className="form-label">
              Nome do estabelecimento <span style={{ color: "var(--red)" }}>*</span>
            </span>
            <input
              className={`input${fieldErrors.nomeEstabelecimento ? " input-error" : ""}`}
              value={form.nomeEstabelecimento}
              onChange={(e) => {
                setForm((p) => ({ ...p, nomeEstabelecimento: e.target.value }));
                if (fieldErrors.nomeEstabelecimento)
                  setFieldErrors((p) => ({ ...p, nomeEstabelecimento: "" }));
              }}
              placeholder="Carrara Restaurante"
            />
            {fieldErrors.nomeEstabelecimento && (
              <span className="form-error">{fieldErrors.nomeEstabelecimento}</span>
            )}
          </div>

          <div className="form-grid cols-2">
            <div className="form-field">
              <span className="form-label">Gestão ativa</span>
              <select
                className="input"
                value={form.gestaoAtiva}
                onChange={(e) => setForm((p) => ({ ...p, gestaoAtiva: e.target.value }))}
              >
                <option value="true">Ativa</option>
                <option value="false">Inativa</option>
              </select>
              <span className="form-hint">Controla se o tenant aparece como operacional</span>
            </div>
            {editing && (
              <div className="form-field">
                <span className="form-label">Status</span>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="SUSPENDED">Suspenso</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-field">
            <span className="form-label">
              Nichos ativos <span style={{ color: "var(--red)" }}>*</span>
            </span>
            <input
              className={`input${fieldErrors.nichosAtivos ? " input-error" : ""}`}
              value={form.nichosAtivos}
              onChange={(e) => {
                setForm((p) => ({ ...p, nichosAtivos: e.target.value }));
                if (fieldErrors.nichosAtivos)
                  setFieldErrors((p) => ({ ...p, nichosAtivos: "" }));
              }}
              placeholder='["FOOD","DELIVERY"]'
              style={{ fontFamily: "monospace" }}
            />
            {fieldErrors.nichosAtivos && (
              <span className="form-error">{fieldErrors.nichosAtivos}</span>
            )}
            <span className="form-hint">
              JSON array dos nichos habilitados. Deixe <code>[]</code> se nenhum.
            </span>
          </div>

          <div className="form-field">
            <span className="form-label">Rota pública (opcional)</span>
            <input
              className="input"
              value={form.rotaPublica}
              onChange={(e) => setForm((p) => ({ ...p, rotaPublica: e.target.value }))}
              placeholder="https://..."
            />
            <span className="form-hint">
              URL de apresentação pública do tenant. Pode ficar vazio.
            </span>
          </div>

          {!editing && (
            <div
              className="muted"
              style={{
                fontSize: 12,
                background: "rgba(0,0,0,0.03)",
                padding: 10,
                borderRadius: 6,
                borderLeft: "3px solid var(--blue, #3b82f6)",
              }}
            >
              <strong>O que acontece ao provisionar:</strong>
              <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                <li>Cria o schema <code>{form.slug || "slug"}</code> no Postgres</li>
                <li>Aplica todas as migrations Flyway (pode levar 10-20s)</li>
                <li>Semeia seu superadmin dentro do schema novo</li>
                <li>Registra o tenant no master para resolução por subdomínio</li>
              </ul>
            </div>
          )}
        </div>
      </Modal>

      <TenantConfigModal
        open={!!configTenant}
        tenantId={configTenant?.id ?? null}
        tenantName={configTenant?.nomeEstabelecimento || configTenant?.slug || ""}
        onClose={() => setConfigTenant(null)}
        onSaved={(tenantId, info) => {
          if (tenantId && info) applyPlanUpdate(tenantId, info);
        }}
      />
    </div>
  );
}
