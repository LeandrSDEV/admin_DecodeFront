import { useEffect, useState, useMemo } from "react";
import api from "../../lib/api";
import { IconShield, IconKey } from "../../components/ui/Icons";

function getStrength(pw: string): { level: "weak" | "medium" | "strong"; bars: number; text: string } {
  if (!pw) return { level: "weak", bars: 0, text: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { level: "weak", bars: 1, text: "Fraca" };
  if (score <= 3) return { level: "medium", bars: 2, text: "Média" };
  return { level: "strong", bars: 3, text: "Forte" };
}

export default function SecurityPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => getStrength(newPassword), [newPassword]);
  const mismatch = confirmPassword && newPassword !== confirmPassword;

  useEffect(() => {
    api.get("/api/auth/me").then((res) => setUserId(res.data?.id ?? null)).catch(() => {});
  }, []);

  async function onChangePassword() {
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.current = "Informe a senha atual";
    if (!newPassword) errors.new = "Informe a nova senha";
    else if (newPassword.length < 6) errors.new = "Mínimo 6 caracteres";
    if (!confirmPassword) errors.confirm = "Confirme a nova senha";
    else if (newPassword !== confirmPassword) errors.confirm = "As senhas não coincidem";

    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    if (!userId) {
      setError("ID do usuário não encontrado. Recarregue a página.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/api/users/${userId}`, {
        password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFieldErrors({});
      setSuccess("Senha alterada com sucesso.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao alterar senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Segurança</h1>
          <div className="muted">Gerencie sua senha e configurações de segurança</div>
        </div>
      </div>

      {error && <div className="alert-danger">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="card">
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
          <IconShield size={20} />
          <div>
            <div style={{ fontWeight: 900 }}>Alterar senha</div>
            <div className="muted" style={{ fontSize: 12 }}>Escolha uma senha forte com letras, números e símbolos</div>
          </div>
        </div>

        <div className="form-grid" style={{ maxWidth: 420 }}>
          <div className="form-field">
            <span className="form-label">
              <IconKey size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Senha atual
            </span>
            <input
              className={`input${fieldErrors.current ? " input-error" : ""}`}
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (fieldErrors.current) setFieldErrors((p) => ({ ...p, current: "" }));
              }}
              placeholder="Digite sua senha atual"
            />
            {fieldErrors.current && <span className="form-error">{fieldErrors.current}</span>}
          </div>

          <hr className="separator" />

          <div className="form-field">
            <span className="form-label">Nova senha</span>
            <input
              className={`input${fieldErrors.new ? " input-error" : ""}`}
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (fieldErrors.new) setFieldErrors((p) => ({ ...p, new: "" }));
              }}
              placeholder="Mínimo 6 caracteres"
            />
            {fieldErrors.new && <span className="form-error">{fieldErrors.new}</span>}
            {newPassword && (
              <>
                <div className="pw-strength">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`pw-bar${i <= strength.bars ? ` active ${strength.level}` : ""}`} />
                  ))}
                </div>
                <div className={`pw-text ${strength.level}`}>{strength.text}</div>
              </>
            )}
          </div>

          <div className="form-field">
            <span className="form-label">Confirmar nova senha</span>
            <input
              className={`input${fieldErrors.confirm || mismatch ? " input-error" : ""}`}
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirm) setFieldErrors((p) => ({ ...p, confirm: "" }));
              }}
              placeholder="Repita a nova senha"
            />
            {fieldErrors.confirm && <span className="form-error">{fieldErrors.confirm}</span>}
            {mismatch && !fieldErrors.confirm && <span className="form-error">As senhas não coincidem</span>}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn-primary" onClick={onChangePassword} disabled={saving || !userId}>
            {saving ? "Alterando..." : "Alterar senha"}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Dicas de segurança</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", fontSize: 13, lineHeight: 2 }}>
          <li>Use pelo menos 8 caracteres na senha</li>
          <li>Combine letras maiúsculas, minúsculas, números e símbolos</li>
          <li>Não reutilize senhas de outros serviços</li>
          <li>Altere sua senha periodicamente (a cada 3 meses)</li>
        </ul>
      </div>
    </div>
  );
}
