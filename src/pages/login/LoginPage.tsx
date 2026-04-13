import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { setRefreshToken, setToken } from "../../auth/authStorage";
import { IconEye, IconEyeOff } from "../../components/ui/Icons";

import "./LoginPage.css";

// Ajuste o caminho do logo conforme seu projeto:
import logo from "../../assets/decode-logo.png";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0;
  }, [email, password]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email: email.trim(),
        password,
      });

      setToken(response.data.token);
      if (response.data.refreshToken) setRefreshToken(response.data.refreshToken);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Falha ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />

      <div className="login-card">
        <div className="login-header">
          <div className="brand">
            <img className="brand-logo" src={logo} alt="Decode" />
            <div className="brand-text">
              <h1>DECODE</h1>
              <p>Entre para acessar o painel (admin, monitoramento e controle).</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span className="label">E-mail</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder="seuemail@dominio.com"
              autoComplete="email"
              inputMode="email"
            />
          </label>

          <label className="field">
            <span className="label">Senha</span>
            <div className="input-row">
              <input
                className="input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                placeholder="Sua senha"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="input-icon"
                aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                title={showPass ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </label>

          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}

          <button className="submit" type="submit" disabled={loading || !canSubmit}>
            <span className="submit-glow" aria-hidden="true" />
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {import.meta.env.DEV && (
            <div className="hint">
              Dica (dev): usuário padrão <span className="mono">admin@decode.com</span> • senha{" "}
              <span className="mono">admin123</span>
            </div>
          )}
        </form>
      </div>

      <div className="login-footer">
        <span className="dot" /> Secure Access • Decode
      </div>
    </div>
  );
}