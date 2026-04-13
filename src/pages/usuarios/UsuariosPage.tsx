import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import Modal from "../../components/Modal";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconRefresh,
  IconSearch,
  IconUser,
} from "../../components/ui/Icons";

type User = {
  id: number | string;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
  createdAt?: string;
};

async function putWithFallback(urls: string[], payload: any) {
  let lastErr: any = null;
  for (const u of urls) {
    try {
      return await api.put(u, payload);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function fmtDate(v: any) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleDateString("pt-BR");
  } catch {
    return String(v);
  }
}

export default function UsuariosPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "USER",
    active: "true",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/users", { params: q.trim() ? { q: q.trim() } : undefined });
      const data = Array.isArray(res.data) ? res.data : res.data?.content ?? res.data?.items ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao carregar usuários.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((it) => JSON.stringify(it).toLowerCase().includes(needle));
  }, [items, q]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", role: "USER", active: "true", password: "" });
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({
      name: u.name || "",
      email: u.email || "",
      role: u.role || "USER",
      active: String((u as any).active ?? true),
      password: "",
    });
    setFieldErrors({});
    setModalOpen(true);
  }

  async function onDelete(u: User) {
    const ok = window.confirm(`Deletar usuário "${u.name || u.email}"?`);
    if (!ok) return;
    try {
      await api.delete(`/api/users/${u.id}`);
      showSuccess("Usuário deletado.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao deletar usuário.");
    }
  }

  async function onSave() {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Nome é obrigatório";
    if (!form.email.trim()) errors.email = "Email é obrigatório";
    if (!editing && !form.password) errors.password = "Senha é obrigatória para novos usuários";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      const basePayload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        active: form.active === "true",
      };

      if (editing) {
        await api.put(`/api/users/${editing.id}`, basePayload);
        if (form.password) {
          await putWithFallback(
            [`/api/users/${editing.id}/password`, `/api/users/${editing.id}/reset-password`],
            { newPassword: form.password }
          );
        }
        showSuccess("Usuário atualizado.");
      } else {
        await api.post("/api/users", { ...basePayload, password: form.password });
        showSuccess("Usuário criado.");
      }

      setModalOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Usuários</h1>
          <div className="muted">
            {items.length} usuário{items.length !== 1 ? "s" : ""} cadastrado{items.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <IconSearch size={15} style={{ position: "absolute", left: 10, color: "var(--muted)", pointerEvents: "none" }} />
            <input
              className="input"
              placeholder="Buscar usuários..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 220, paddingLeft: 34 }}
            />
          </div>
          <button className="btn-primary" onClick={openCreate}>
            <IconPlus size={15} /> Novo usuário
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
            <div className="empty-state-icon"><IconUser size={22} /></div>
            <div className="empty-state-title">Nenhum usuário encontrado</div>
            <div className="empty-state-text">
              {q ? "Tente outro termo de busca." : 'Clique em "Novo usuário" para criar.'}
            </div>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Email</th>
                  <th>Permissão</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th style={{ width: 130, textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={String(u.id)}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="avatar sm">
                          {(u.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{u.name || "-"}</div>
                          <div className="muted" style={{ fontSize: 11 }}>ID: {String(u.id).slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email || "-"}</td>
                    <td>
                      <span className={`badge ${u.role === "ADMIN" ? "purple" : "blue"}`}>
                        {u.role || "USER"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${(u as any).active !== false ? "ok" : "bad"}`}>
                        {(u as any).active !== false ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td>
                      <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                        <button className="btn-ghost" onClick={() => openEdit(u)} title="Editar" style={{ padding: "6px 8px" }}>
                          <IconPencil size={15} />
                        </button>
                        <button className="btn-danger" onClick={() => onDelete(u)} title="Deletar" style={{ padding: "6px 8px" }}>
                          <IconTrash size={15} />
                        </button>
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
        title={editing ? "Editar usuário" : "Novo usuário"}
        subtitle={editing ? `Editando ${editing.name || editing.email}` : "Preencha os dados do novo usuário"}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        footer={
          <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={onSave} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Atualizar" : "Criar"}
            </button>
          </div>
        }
      >
        <div className="form-grid">
          <div className="form-grid cols-2">
            <div className="form-field">
              <span className="form-label">Nome <span style={{ color: "var(--red)" }}>*</span></span>
              <input
                className={`input${fieldErrors.name ? " input-error" : ""}`}
                value={form.name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, name: e.target.value }));
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="Nome completo"
              />
              {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
            </div>
            <div className="form-field">
              <span className="form-label">Email <span style={{ color: "var(--red)" }}>*</span></span>
              <input
                className={`input${fieldErrors.email ? " input-error" : ""}`}
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm((p) => ({ ...p, email: e.target.value }));
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
                }}
                placeholder="email@dominio.com"
              />
              {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
            </div>
          </div>

          <div className="form-grid cols-2">
            <div className="form-field">
              <span className="form-label">Permissão</span>
              <select className="input" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
              <span className="form-hint">Administradores têm acesso total ao sistema</span>
            </div>
            <div className="form-field">
              <span className="form-label">Status</span>
              <select className="input" value={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.value }))}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
              <span className="form-hint">Usuários inativos não conseguem fazer login</span>
            </div>
          </div>

          <hr className="separator" />

          <div className="form-field">
            <span className="form-label">
              {editing ? "Nova senha (opcional)" : "Senha"}{" "}
              {!editing && <span style={{ color: "var(--red)" }}>*</span>}
            </span>
            <input
              className={`input${fieldErrors.password ? " input-error" : ""}`}
              type="password"
              value={form.password}
              onChange={(e) => {
                setForm((p) => ({ ...p, password: e.target.value }));
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" }));
              }}
              placeholder={editing ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
            />
            {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
            {editing && <span className="form-hint">Preencha apenas se deseja alterar a senha deste usuário</span>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
