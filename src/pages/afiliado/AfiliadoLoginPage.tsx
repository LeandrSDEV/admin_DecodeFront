import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  setAffiliateProfile,
  setAffiliateToken,
} from "../../auth/affiliateAuthStorage";
import { login } from "../../services/affiliatePortalService";

export default function AfiliadoLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !email.trim() || !password) return;

    setError("");
    setLoading(true);
    try {
      const res = await login({ email: email.trim(), password });
      setAffiliateToken(res.token);
      setAffiliateProfile({
        id: res.affiliateId,
        name: res.name,
        email: res.email,
        refCode: res.refCode,
        status: res.status,
        mustChangePassword: res.mustChangePassword,
      });
      navigate(res.mustChangePassword ? "/afiliado/perfil" : "/afiliado/painel", {
        replace: true,
      });
    } catch (err: any) {
      const msg = err?.response?.status === 401
        ? "Email ou senha incorretos."
        : err?.response?.data?.message || "Falha ao entrar.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="afl-login">
      <style>{`
        .afl-login {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
          color: #f1f5f9;
          padding: 20px;
        }
        .afl-login::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 600px 400px at 20% 30%, rgba(255,107,26,0.18), transparent 60%),
            radial-gradient(ellipse 500px 600px at 80% 70%, rgba(255,145,71,0.12), transparent 60%);
          pointer-events: none;
        }
        .afl-card {
          position: relative;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 40px 36px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
        }
        .afl-brand {
          text-align: center;
          margin-bottom: 28px;
        }
        .afl-brand-logo {
          width: 56px;
          height: 56px;
          margin: 0 auto 14px;
          border-radius: 14px;
          background: linear-gradient(135deg, #ff6b1a, #ff9147);
          display: grid;
          place-items: center;
          font-size: 28px;
          font-weight: 900;
          color: #fff;
          box-shadow: 0 12px 30px rgba(255, 107, 26, 0.35);
        }
        .afl-brand h1 {
          margin: 0 0 4px;
          font-size: 22px;
          font-weight: 800;
        }
        .afl-brand p {
          margin: 0;
          color: #94a3b8;
          font-size: 13px;
        }
        .afl-form { display: grid; gap: 14px; }
        .afl-field { display: grid; gap: 6px; }
        .afl-label {
          font-size: 12px;
          font-weight: 700;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .afl-input {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .afl-input:focus {
          border-color: #ff6b1a;
          background: rgba(255, 255, 255, 0.1);
        }
        .afl-pass-row {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .afl-pass-row .afl-input { flex: 1; }
        .afl-eye {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          padding: 12px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
        }
        .afl-submit {
          margin-top: 6px;
          padding: 14px;
          background: linear-gradient(135deg, #ff6b1a, #ff9147);
          border: none;
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border-radius: 10px;
          cursor: pointer;
          transition: filter 0.15s, transform 0.15s;
          box-shadow: 0 14px 30px rgba(255, 107, 26, 0.3);
        }
        .afl-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .afl-submit:not(:disabled):hover {
          filter: brightness(1.07);
          transform: translateY(-1px);
        }
        .afl-error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
        }
        .afl-help {
          margin-top: 22px;
          padding-top: 22px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }
        .afl-help a {
          color: #ffb37a;
          text-decoration: none;
        }
      `}</style>

      <div className="afl-card">
        <div className="afl-brand">
          <div className="afl-brand-logo">D</div>
          <h1>Portal do Afiliado</h1>
          <p>Acesse sua conta para acompanhar suas comissões</p>
        </div>

        <form onSubmit={onSubmit} className="afl-form">
          <div className="afl-field">
            <span className="afl-label">Email</span>
            <input
              className="afl-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>

          <div className="afl-field">
            <span className="afl-label">Senha</span>
            <div className="afl-pass-row">
              <input
                className="afl-input"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="afl-eye"
                onClick={() => setShowPass((s) => !s)}
              >
                {showPass ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          {error && <div className="afl-error">{error}</div>}

          <button className="afl-submit" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="afl-help">
          Não é afiliado ainda?{" "}
          <a
            href="https://gestao-decode.lovable.app/#afiliados"
            target="_blank"
            rel="noreferrer"
          >
            Cadastre-se aqui
          </a>
        </div>
      </div>
    </div>
  );
}
