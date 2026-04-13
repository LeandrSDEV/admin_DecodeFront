import { useEffect, useState } from "react";
import {
  fetchAffiliateInteractions,
  fetchAffiliateLeads,
  createAffiliateInteraction,
  updateAffiliateInteraction,
  deleteAffiliateInteraction,
} from "../../services/affiliatePortalService";
import type {
  AffiliateInteraction,
  AffiliateLead,
} from "../../services/affiliatePortalService";

const CHANNELS = ["WHATSAPP", "INSTAGRAM", "PHONE", "EMAIL", "OUTRO"];
const STATUSES = ["WAITING", "ANSWERED", "NO_RESPONSE", "CLOSED"];

const STATUS_LABEL: Record<string, string> = {
  WAITING: "Aguardando",
  ANSWERED: "Respondido",
  NO_RESPONSE: "Sem retorno",
  CLOSED: "Encerrado",
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

const EMPTY_FORM: Partial<AffiliateInteraction> = {
  contactName: "",
  channel: "WHATSAPP",
  city: "",
  status: "WAITING",
  leadId: null,
};

export default function AfiliadoInteracoesPage() {
  const [items, setItems] = useState<AffiliateInteraction[]>([]);
  const [leads, setLeads] = useState<AffiliateLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AffiliateInteraction>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAffiliateInteractions({ q: q.trim() || undefined, size: 50 });
      setItems(data.content || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao carregar interações.");
    } finally {
      setLoading(false);
    }
  }

  async function loadLeads() {
    try {
      const data = await fetchAffiliateLeads({ size: 200 });
      setLeads(data.content || []);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    loadLeads();
    setOpen(true);
  }

  function openEdit(i: AffiliateInteraction) {
    setEditId(i.id);
    setForm({
      contactName: i.contactName,
      channel: i.channel,
      city: i.city,
      status: i.status,
      leadId: i.leadId,
    });
    loadLeads();
    setOpen(true);
  }

  async function onSave() {
    if (!form.contactName || form.contactName.trim().length < 2) {
      setError("Informe o nome do contato.");
      return;
    }
    if (!form.city || form.city.trim().length < 2) {
      setError("Informe a cidade.");
      return;
    }
    if (!form.leadId) {
      setError("Selecione o lead vinculado.");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<AffiliateInteraction> = {
        contactName: form.contactName?.trim(),
        channel: form.channel,
        city: form.city?.trim(),
        status: form.status,
        leadId: form.leadId,
      };
      if (editId) {
        await updateAffiliateInteraction(editId, payload);
        showSuccess("Interação atualizada.");
      } else {
        await createAffiliateInteraction(payload);
        showSuccess("Interação criada.");
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(i: AffiliateInteraction) {
    if (!confirm(`Excluir interação com "${i.contactName}"?`)) return;
    try {
      await deleteAffiliateInteraction(i.id);
      showSuccess("Interação excluída.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao excluir.");
    }
  }

  return (
    <div className="crm-page">
      <style>{styles}</style>

      <div className="crm-header">
        <div>
          <h1 className="crm-title">Minhas Interações</h1>
          <div className="crm-sub">{items.length} tratativa(s) — sempre vinculadas a um lead seu</div>
        </div>
        <div className="crm-row">
          <input
            className="crm-input"
            placeholder="Buscar contato, código ou cidade..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ minWidth: 260 }}
          />
          <button className="crm-btn" onClick={openCreate}>+ Nova interação</button>
        </div>
      </div>

      {error && <div className="crm-alert crm-alert-error">{error}</div>}
      {success && <div className="crm-alert crm-alert-success">{success}</div>}

      <div className="crm-card">
        {loading ? (
          <div className="crm-empty">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="crm-empty">Nenhuma interação registrada.</div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Contato</th>
                <th>Canal</th>
                <th>Cidade</th>
                <th>Lead</th>
                <th>Status</th>
                <th>Atualizado</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{i.code}</td>
                  <td style={{ fontWeight: 700 }}>{i.contactName}</td>
                  <td>{i.channel}</td>
                  <td>{i.city}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{i.leadCode || "-"}</td>
                  <td><span className="crm-badge">{STATUS_LABEL[i.status] || i.status}</span></td>
                  <td>{fmtDate(i.updatedAt)}</td>
                  <td>
                    <div className="crm-row" style={{ justifyContent: "flex-end" }}>
                      <button className="crm-btn-ghost" onClick={() => openEdit(i)}>Editar</button>
                      <button className="crm-btn-danger" onClick={() => onDelete(i)}>Excluir</button>
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
              <div style={{ fontWeight: 800, fontSize: 16 }}>{editId ? "Editar interação" : "Nova interação"}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Vincule sempre a um lead seu</div>
            </div>
            <div className="crm-modal-body">
              <div className="crm-field">
                <span className="crm-label">Lead vinculado *</span>
                <select className="crm-input" value={form.leadId || ""} onChange={(e) => setForm((p) => ({ ...p, leadId: e.target.value || null }))}>
                  <option value="">Selecione um lead...</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.code} — {l.name}</option>
                  ))}
                </select>
              </div>
              <div className="crm-field">
                <span className="crm-label">Nome do contato *</span>
                <input className="crm-input" value={form.contactName || ""} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} />
              </div>
              <div className="crm-grid-2">
                <div className="crm-field">
                  <span className="crm-label">Canal</span>
                  <select className="crm-input" value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))}>
                    {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="crm-field">
                  <span className="crm-label">Cidade *</span>
                  <input className="crm-input" value={form.city || ""} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
                </div>
              </div>
              <div className="crm-field">
                <span className="crm-label">Status</span>
                <select className="crm-input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
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
