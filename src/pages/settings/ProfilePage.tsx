import { useEffect, useState } from "react";
import api from "../../lib/api";
import { IconUser, IconMail, IconPhone } from "../../components/ui/Icons";

type Me = {
  id?: string | number;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  createdAt?: string;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/auth/me");
        setMe(res.data);
        setForm({
          name: res.data?.name || "",
          email: res.data?.email || "",
          phone: res.data?.phone || "",
        });
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSave() {
    if (!form.name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (!me?.id) throw new Error("ID do usuário não encontrado.");
      await api.put(`/api/users/${me.id}`, {
        name: form.name,
        email: form.email,
      });
      setSuccess("Perfil atualizado com sucesso.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  const initials = (me?.name || "U").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Perfil</h1>
          <div className="muted">Gerencie suas informações pessoais</div>
        </div>
      </div>

      {loading ? (
        <div className="card"><div className="muted">Carregando...</div></div>
      ) : (
        <>
          {/* Profile card */}
          <div className="card" style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 16 }}>
            <div className="avatar lg">{initials}</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{me?.name || "Usuário"}</div>
              <div className="muted" style={{ marginTop: 2 }}>{me?.email || "-"}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <span className={`badge ${me?.role === "ADMIN" ? "purple" : "blue"}`}>
                  {me?.role || "USER"}
                </span>
                {me?.createdAt && (
                  <span className="badge" style={{ fontSize: 11 }}>
                    Membro desde {new Date(me.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {error && <div className="alert-danger">{error}</div>}
          {success && <div className="alert-success">{success}</div>}

          {/* Edit form */}
          <div className="card">
            <div className="section-title" style={{ marginTop: 0 }}>Informações pessoais</div>
            <div className="form-grid cols-2">
              <div className="form-field">
                <span className="form-label">
                  <IconUser size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Nome completo
                </span>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Seu nome"
                />
              </div>
              <div className="form-field">
                <span className="form-label">
                  <IconMail size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Email
                </span>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@dominio.com"
                />
              </div>
              <div className="form-field">
                <span className="form-label">
                  <IconPhone size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Telefone
                </span>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="form-field">
                <span className="form-label">Permissão</span>
                <input className="input" value={me?.role || "-"} disabled style={{ background: "#f3f4f6" }} />
                <span className="form-hint">A permissão é definida por um administrador</span>
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button className="btn-primary" onClick={onSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
