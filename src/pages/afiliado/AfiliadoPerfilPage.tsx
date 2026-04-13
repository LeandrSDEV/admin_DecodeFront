import { useEffect, useState } from "react";
import { changePassword, fetchMe } from "../../services/affiliatePortalService";
import type { MeResponse } from "../../services/affiliatePortalService";

export default function AfiliadoPerfilPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchMe()
      .then(setMe)
      .finally(() => setLoading(false));
  }, []);

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPw.length < 8) {
      setError("Nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("A confirmação não confere.");
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPw, newPw);
      setSuccess("Senha alterada com sucesso!");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      // recarrega me pra atualizar o flag mustChangePassword
      const data = await fetchMe();
      setMe(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Falha ao alterar senha.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !me) {
    return <div style={{ color: "#94a3b8" }}>Carregando...</div>;
  }

  return (
    <div>
      <style>{`
        .aff-page-title { font-size: 24px; font-weight: 800; margin: 0 0 6px; }
        .aff-page-sub { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
        .aff-section {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .aff-section h3 {
          margin: 0 0 18px;
          font-size: 15px;
          font-weight: 800;
        }
        .aff-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .aff-info-cell .lab {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .aff-info-cell .val {
          font-size: 14px;
          color: #fff;
          margin-top: 4px;
          word-break: break-word;
        }
        .aff-form { display: grid; gap: 14px; max-width: 420px; }
        .aff-field { display: grid; gap: 6px; }
        .aff-field label {
          font-size: 12px;
          color: #cbd5e1;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .aff-field input {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
          padding: 11px 14px;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }
        .aff-field input:focus {
          border-color: #ff6b1a;
        }
        .aff-btn {
          padding: 12px 22px;
          background: linear-gradient(135deg, #ff6b1a, #ff9147);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          width: fit-content;
        }
        .aff-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .aff-error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
        }
        .aff-success {
          background: rgba(74, 222, 128, 0.12);
          border: 1px solid rgba(74, 222, 128, 0.3);
          color: #4ade80;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
        }
        .aff-warn {
          background: rgba(251, 191, 36, 0.12);
          border: 1px solid rgba(251, 191, 36, 0.3);
          color: #fbbf24;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 16px;
        }
      `}</style>

      <h1 className="aff-page-title">Meu perfil</h1>
      <div className="aff-page-sub">
        Suas informações cadastrais e dados de pagamento.
      </div>

      {me.mustChangePassword && (
        <div className="aff-warn">
          ⚠️ Você está usando uma senha temporária definida pelo admin. Troque agora abaixo para garantir sua segurança.
        </div>
      )}

      <div className="aff-section">
        <h3>Dados da conta</h3>
        <div className="aff-info-grid">
          <div className="aff-info-cell">
            <div className="lab">Nome</div>
            <div className="val">{me.name}</div>
          </div>
          <div className="aff-info-cell">
            <div className="lab">Email</div>
            <div className="val">{me.email}</div>
          </div>
          <div className="aff-info-cell">
            <div className="lab">WhatsApp</div>
            <div className="val">{me.whatsapp}</div>
          </div>
          <div className="aff-info-cell">
            <div className="lab">Código de indicação</div>
            <div className="val" style={{ fontFamily: "monospace", fontWeight: 700, color: "#ffb37a" }}>
              {me.refCode}
            </div>
          </div>
          <div className="aff-info-cell">
            <div className="lab">Status</div>
            <div className="val">{me.status}</div>
          </div>
          <div className="aff-info-cell">
            <div className="lab">Sua taxa de comissão</div>
            <div className="val" style={{ color: "#ffb37a", fontWeight: 700 }}>
              {me.commissionRate}%
            </div>
          </div>
        </div>
      </div>

      <div className="aff-section">
        <h3>Dados para recebimento (PIX)</h3>
        <div className="aff-info-grid">
          <div className="aff-info-cell">
            <div className="lab">Tipo de chave</div>
            <div className="val">{me.pixKeyType || "-"}</div>
          </div>
          <div className="aff-info-cell">
            <div className="lab">Chave PIX</div>
            <div className="val">{me.pixKey || "-"}</div>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: "#94a3b8" }}>
          Para alterar seus dados de PIX ou cadastro, fale com o suporte.
        </div>
      </div>

      <div className="aff-section">
        <h3>Trocar senha</h3>
        <form className="aff-form" onSubmit={onChangePassword}>
          {!me.mustChangePassword && (
            <div className="aff-field">
              <label>Senha atual</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          )}
          <div className="aff-field">
            <label>Nova senha (mín. 8 caracteres)</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="aff-field">
            <label>Confirme a nova senha</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && <div className="aff-error">{error}</div>}
          {success && <div className="aff-success">{success}</div>}

          <button className="aff-btn" type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Trocar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
