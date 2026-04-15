import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  clearAffiliateAuth,
  getAffiliateProfile,
  setAffiliateProfile,
} from "../auth/affiliateAuthStorage";
import { fetchMe } from "../services/affiliatePortalService";
import type { MeResponse } from "../services/affiliatePortalService";

export default function AffiliateShell() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    const cached = getAffiliateProfile();
    if (cached) {
      setMe({
        id: cached.id,
        name: cached.name,
        email: cached.email,
        refCode: cached.refCode,
        whatsapp: "",
        status: cached.status,
        mustChangePassword: cached.mustChangePassword,
        pixKeyType: null,
        pixKey: null,
        commissionRate: 15,
      });
    }
    fetchMe()
      .then((data) => {
        setMe(data);
        setAffiliateProfile({
          id: data.id,
          name: data.name,
          email: data.email,
          refCode: data.refCode,
          status: data.status,
          mustChangePassword: data.mustChangePassword,
        });
      })
      .catch(() => {
        // 401 ja tratado pelo interceptor
      });
  }, []);

  function logout() {
    clearAffiliateAuth();
    navigate("/afiliado/entrar", { replace: true });
  }

  return (
    <div className="aff-shell">
      <style>{`
        .aff-shell {
          min-height: 100vh;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          color: #f1f5f9;
          font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
        }
        .aff-topbar {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 14px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .aff-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 18px;
        }
        .aff-brand .badge-orange {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #ff6b1a, #ff9147);
          display: grid;
          place-items: center;
          color: #fff;
          font-weight: 900;
        }
        .aff-nav {
          display: flex;
          gap: 6px;
        }
        .aff-nav-item {
          padding: 8px 14px;
          border-radius: 8px;
          color: #cbd5e1;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 600;
          transition: background 0.15s, color 0.15s;
        }
        .aff-nav-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .aff-nav-item.active {
          background: rgba(255, 107, 26, 0.18);
          color: #ffb37a;
        }
        .aff-user {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
        }
        .aff-user-name {
          font-weight: 700;
        }
        .aff-user-sub {
          font-size: 11px;
          color: #94a3b8;
        }
        .aff-logout {
          padding: 7px 12px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #cbd5e1;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }
        .aff-logout:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
        .aff-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 28px;
        }
        @media (max-width: 720px) {
          .aff-topbar { flex-direction: column; gap: 10px; padding: 10px 14px; }
          .aff-content { padding: 16px; }
          .aff-nav-item { padding: 6px 10px; font-size: 12px; }
        }
      `}</style>

      <header className="aff-topbar">
        <div className="aff-brand">
          <div className="badge-orange">D</div>
          <span>Portal do Afiliado</span>
        </div>

        <nav className="aff-nav">
          <NavLink to="/afiliado/painel" className={({ isActive }) => `aff-nav-item ${isActive ? "active" : ""}`}>
            Dashboard
          </NavLink>
          <NavLink to="/afiliado/leads" className={({ isActive }) => `aff-nav-item ${isActive ? "active" : ""}`}>
            Leads
          </NavLink>
          <NavLink to="/afiliado/interacoes" className={({ isActive }) => `aff-nav-item ${isActive ? "active" : ""}`}>
            Interações
          </NavLink>
          <NavLink to="/afiliado/comissoes" className={({ isActive }) => `aff-nav-item ${isActive ? "active" : ""}`}>
            Comissões
          </NavLink>
          <NavLink to="/afiliado/material-vendas" className={({ isActive }) => `aff-nav-item ${isActive ? "active" : ""}`}>
            Material de venda
          </NavLink>
          <NavLink to="/afiliado/perfil" className={({ isActive }) => `aff-nav-item ${isActive ? "active" : ""}`}>
            Configurações
          </NavLink>
        </nav>

        <div className="aff-user">
          <div style={{ textAlign: "right" }}>
            <div className="aff-user-name">{me?.name || "..."}</div>
            <div className="aff-user-sub">{me ? `Ref: ${me.refCode}` : ""}</div>
          </div>
          <button className="aff-logout" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="aff-content">
        <Outlet />
      </main>
    </div>
  );
}
