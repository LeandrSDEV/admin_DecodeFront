import { useEffect, useMemo, useState } from "react";
import {
  fetchAffiliateLeads,
  createAffiliateLead,
  updateAffiliateLead,
  deleteAffiliateLead,
} from "../../services/affiliatePortalService";
import type { AffiliateLead } from "../../services/affiliatePortalService";

const SOURCES = ["WHATSAPP", "INSTAGRAM", "FACEBOOK", "INDICACAO", "OUTRO"];
const STAGES = ["WAITING", "MEETING", "PROPOSAL", "WON", "LOST"];

const STAGE_LABEL: Record<string, string> = {
  WAITING: "Aguardando",
  MEETING: "Reunião",
  PROPOSAL: "Proposta",
  WON: "Ganho",
  LOST: "Perdido",
};

function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("pt-BR");
}

const styles = `
  .crm-page { color: #f1f5f9; }
  .crm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
  .crm-title { font-size: 24px; font-weight: 800; margin: 0; }
  .crm-sub { color: #94a3b8; font-size: 13px; margin-top: 4px; }
  .crm-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #f1f5f9; padding: 9px 12px; border-radius: 8px; font-size: 13px; outline: none; }
  .crm-input:focus { border-color: rgba(255,107,26,0.5); }
  .crm-btn { background: linear-gradient(135deg, #ff6b1a, #ff9147); border: 0; color: #fff; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; }
  .crm-btn-ghost { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; padding: 9px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; }
  .crm-btn-danger { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; padding: 7px 11px; border-radius: 6px; cursor: pointer; font-size: 12px; }
  .crm-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; }
  .crm-table { width: 100%; border-collapse: collapse; }
  .crm-table th { background: rgba(255,255,255,0.04); text-align: left; padding: 12px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 700; }
  .crm-table td { padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
  .crm-empty { padding: 50px; text-align: center; color: #64748b; }
  .crm-badge { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; background: rgba(255,107,26,0.15); color: #ffb37a; }
  .crm-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .crm-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: grid; place-items: center; z-index: 50; padding: 20px; }
  .crm-modal { background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; max-width: 540px; width: 100%; max-height: 90vh; overflow-y: auto; }
  .crm-modal-head { padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .crm-modal-body { padding: 18px 22px; display: flex; flex-direction: column; gap: 12px; }
  .crm-modal-foot { padding: 14px 22px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 8px; justify-content: flex-end; }
  .crm-field { display: flex; flex-direction: column; gap: 6px; }
  .crm-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
  .crm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .crm-alert { padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
  .crm-alert-error { background: rgba(239,68,68,0.15); color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
  .crm-alert-success { background: rgba(34,197,94,0.15); color: #86efac; border: 1px solid rgba(34,197,94,0.3); }
`;

const EMPTY_FORM: Partial<AffiliateLead> = {
  name: "",
  phone: "",
  email: "",
  status: "",
  score: 0,
  source: "WHATSAPP",
  stage: "WAITING",
};

export default function AfiliadoLeadsPage() {
  const [items, setItems] = useState<AffiliateLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AffiliateLead>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAffiliateLeads({ q: q.trim() || undefined, size: 50 });
      setItems(data.content || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao carregar leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(l: AffiliateLead) {
    setEditId(l.id);
    setForm({
      name: l.name,
      phone: l.phone || "",
      email: l.email || "",
      status: l.status || "",
      score: l.score,
      source: l.source,
      stage: l.stage,
    });
    setOpen(true);
  }

  async function onSave() {
    if (!form.name || form.name.trim().length < 2) {
      setError("Informe o nome do lead (mínimo 2 caracteres).");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<AffiliateLead> = {
        name: form.name?.trim(),
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        status: form.status?.trim() || null,
        score: Number(form.score || 0),
        source: form.source,
        stage: form.stage,
      };
      if (editId) {
        await updateAffiliateLead(editId, payload);
        showSuccess("Lead atualizado.");
      } else {
        await createAffiliateLead(payload);
        showSuccess("Lead criado.");
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(l: AffiliateLead) {
    if (!confirm(`Excluir lead "${l.name}"?`)) return;
    try {
      await deleteAffiliateLead(l.id);
      showSuccess("Lead excluído.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao excluir.");
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach((l) => { c[l.stage] = (c[l.stage] || 0) + 1; });
    return c;
  }, [items]);

  return (
    <div className="crm-page">
      <style>{styles}</style>

      <div className="crm-header">
        <div>
          <h1 className="crm-title">Meus Leads</h1>
          <div className="crm-sub">{items.length} lead(s) — controle pessoal de prospects</div>
        </div>
        <div className="crm-row">
          <input
            className="crm-input"
            placeholder="Buscar por nome ou código..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ minWidth: 240 }}
          />
          <button className="crm-btn" onClick={openCreate}>+ Novo lead</button>
        </div>
      </div>

      {error && <div className="crm-alert crm-alert-error">{error}</div>}
      {success && <div className="crm-alert crm-alert-success">{success}</div>}

      <div className="crm-row" style={{ marginBottom: 16, gap: 12 }}>
        {STAGES.map((s) => (
          <div key={s} className="crm-card" style={{ padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{STAGE_LABEL[s]}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{counts[s] || 0}</div>
          </div>
        ))}
      </div>

      <div className="crm-card">
        {loading ? (
          <div className="crm-empty">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="crm-empty">Nenhum lead cadastrado. Crie o primeiro acima.</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Contato</th>
                <th>Estágio</th>
                <th>Score</th>
                <th>Atualizado</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{l.code}</td>
                  <td style={{ fontWeight: 700 }}>{l.name}</td>
                  <td>
                    <div>{l.phone || "-"}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{l.email || ""}</div>
                  </td>
                  <td><span className="crm-badge">{STAGE_LABEL[l.stage] || l.stage}</span></td>
                  <td style={{ fontWeight: 700 }}>{l.score}</td>
                  <td>{fmtDate(l.updatedAt)}</td>
                  <td>
                    <div className="crm-row" style={{ justifyContent: "flex-end" }}>
                      <button className="crm-btn-ghost" onClick={() => openEdit(l)}>Editar</button>
                      <button className="crm-btn-danger" onClick={() => onDelete(l)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="crm-modal-bg" onClick={() => !saving && setOpen(false)}>
          <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-head">
              <div style={{ fontWeight: 800, fontSize: 16 }}>{editId ? "Editar lead" : "Novo lead"}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Controle pessoal — só você vê este lead</div>
            </div>
            <div className="crm-modal-body">
              <div className="crm-field">
                <span className="crm-label">Nome *</span>
                <input className="crm-input" value={form.name || ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="crm-grid-2">
                <div className="crm-field">
                  <span className="crm-label">Telefone</span>
                  <input className="crm-input" value={form.phone || ""} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="crm-field">
                  <span className="crm-label">Email</span>
                  <input className="crm-input" type="email" value={form.email || ""} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="crm-grid-2">
                <div className="crm-field">
                  <span className="crm-label">Origem</span>
                  <select className="crm-input" value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}>
                    {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="crm-field">
                  <span className="crm-label">Estágio</span>
                  <select className="crm-input" value={form.stage} onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value }))}>
                    {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="crm-grid-2">
                <div className="crm-field">
                  <span className="crm-label">Score (0-100)</span>
                  <input className="crm-input" type="number" min={0} max={100} value={form.score ?? 0} onChange={(e) => setForm((p) => ({ ...p, score: Number(e.target.value) }))} />
                </div>
                <div className="crm-field">
                  <span className="crm-label">Status livre</span>
                  <input className="crm-input" value={form.status || ""} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="crm-modal-foot">
              <button className="crm-btn-ghost" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="crm-btn" onClick={onSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
