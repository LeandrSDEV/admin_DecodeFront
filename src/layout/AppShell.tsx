import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { clearToken } from "../auth/authStorage";
import {
  IconActivity,
  IconBuilding,
  IconChevronDown,
  IconDashboard,
  IconLogOut,
  IconMenu,
  IconChevronLeft,
  IconChevronRight,
  IconSettings,
  IconUser,
  IconUsers,
} from "../components/ui/Icons";

type MeResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function formatNow(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function titleForPath(pathname: string) {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/clientes/decodes")) return "Clientes • Decodes";
  if (pathname.startsWith("/clientes/interacoes")) return "Clientes • Interações";
  if (pathname.startsWith("/clientes/leads")) return "Clientes • Leads";
  if (pathname.startsWith("/clientes/planos")) return "Clientes • Planos";
  if (pathname.startsWith("/parceiros/afiliados")) return "Parceiros • Afiliados";
  if (pathname.startsWith("/parceiros/solicitacoes")) return "Parceiros • Solicitações de Estabelecimento";
  if (pathname.startsWith("/parceiros/comissoes")) return "Parceiros • Comissões";
  if (pathname.startsWith("/parceiros/conhecimento")) return "Parceiros • Conhecimento";
  if (pathname.startsWith("/usuarios")) return "Usuários";
  if (pathname.startsWith("/monitoramento")) return "Monitoramento";
  if (pathname.startsWith("/tenants")) return "Tenants";
  return "Painel";
}

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const [now, setNow] = useState(() => new Date());
  const [clientesOpen, setClientesOpen] = useState(true);
  const [parceirosOpen, setParceirosOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("decode.sidebarCollapsed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("decode.sidebarCollapsed", sidebarCollapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const onChange = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setSidebarOpen(false);
    };
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const activeClientes = useMemo(() => {
    return location.pathname.startsWith("/clientes/");
  }, [location.pathname]);

  const activeParceiros = useMemo(() => {
    return location.pathname.startsWith("/parceiros/");
  }, [location.pathname]);

  const activeConfig = useMemo(() => {
    return location.pathname.startsWith("/config/");
  }, [location.pathname]);

  useEffect(() => {
    if (activeClientes) setClientesOpen(true);
  }, [activeClientes]);

  useEffect(() => {
    if (activeParceiros) setParceirosOpen(true);
  }, [activeParceiros]);

  useEffect(() => {
    if (activeConfig) setConfigOpen(true);
  }, [activeConfig]);

  useEffect(() => {
    // fecha menu ao navegar no mobile
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, location.pathname]);

  useEffect(() => {
    let alive = true;
    api
      .get("/api/auth/me")
      .then((res) => {
        if (!alive) return;
        setMe(res.data);
      })
      .catch(() => {
        // ok: interceptor de 401 já trata
      });
    return () => {
      alive = false;
    };
  }, []);

  const pageTitle = useMemo(() => titleForPath(location.pathname), [location.pathname]);

  function logout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  return (
    <div
      className={`shell ${isMobile ? "shell-mobile" : ""} ${
        !isMobile && sidebarCollapsed ? "shell-collapsed" : ""
      }`}
    >
      {/* overlay */}
      {isMobile && sidebarOpen && (
        <button className="overlay" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu" />
      )}

      <aside
        className={`sidebar ${isMobile ? "sidebar-mobile" : ""} ${sidebarOpen ? "open" : ""} ${
          !isMobile && sidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-badge">D</div>
          <div className="brand-text">
            <div className="brand-title">Decode</div>
            <div className="brand-sub">{me?.role ?? ""}</div>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <IconDashboard />
            <span>Dashboard</span>
          </NavLink>

          <button
            className={`nav-item nav-item-btn ${activeClientes ? "active" : ""}`}
            onClick={() => setClientesOpen((v) => !v)}
            type="button"
          >
            <IconUser />
            <span>Clientes</span>
            <span className={`chev ${clientesOpen ? "open" : ""}`}>
              <IconChevronDown />
            </span>
          </button>

          {clientesOpen && (
            <div className="nav-sub">
              <NavLink
                to="/clientes/decodes"
                className={({ isActive }) => `nav-sub-item ${isActive ? "active" : ""}`}
              >
                <span className="dot" />
                <span>Decodes</span>
              </NavLink>
              <NavLink
                to="/clientes/interacoes"
                className={({ isActive }) => `nav-sub-item ${isActive ? "active" : ""}`}
              >
                <span className="dot" />
                <span>Interações</span>
              </NavLink>
              <NavLink
                to="/clientes/leads"
                className={({ isActive }) => `nav-sub-item ${isActive ? "active" : ""}`}
              >
                <span className="dot" />
                <span>Leads</span>
              </NavLink>
              <NavLink
                to="/clientes/planos"
                className={({ isActive }) => `nav-sub-item ${isActive ? "active" : ""}`}
              >
                <span className="dot" />
                <span>Planos</span>
              </NavLink>
            </div>
          )}

          <button
            className={`nav-item nav-item-btn ${activeParceiros ? "active" : ""}`}
            onClick={() => setParceirosOpen((v) => !v)}
            type="button"
          >
            <IconBuilding />
            <span>Parceiros</span>
            <span className={`chev ${parceirosOpen ? "open" : ""}`}>
              <IconChevronDown />
            </span>
          </button>

          {parceirosOpen && (
            <div className="nav-sub">
              <NavLink
                to="/parceiros/afiliados"
                className={({ isActive }) => `nav-sub-item ${isActive ? "active" : ""}`}
              >
                <span className="dot" />
                <span>Afiliados</span>
              </NavLink>
              <NavLink
                to="/parceiros/solicitacoes"
                className={({ isActive }) => `nav-sub-item ${isActive ? "active" : ""}`}
              >
                <span className="dot" />
                <span>Solicitações</span>
              </NavLink>
              <NavLink
                to="/parceiros/comissoes"
                className={({ isActive }) => `nav-sub-item ${isActive ? "active" : ""}`}
              >
                <span className="dot" />
                <span>Comissões</span>
              </NavLink>
              <NavLink
                to="/parceiros/conhecimento"
                className={({ isActive }) => `nav-sub-item ${isActive ? "active" : ""}`}
              >
                <span className="dot" />
                <span>Conhecimento</span>
              </NavLink>
            </div>
          )}

          <NavLink to="/usuarios" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <IconUsers />
            <span>Usuários</span>
          </NavLink>

          <NavLink
            to="/monitoramento"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <IconActivity />
            <span>Monitoramento</span>
          </NavLink>

          <NavLink
            to="/tenants"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <IconBuilding />
            <span>Tenants</span>
          </NavLink>

          <button
            className={`nav-item nav-item-btn ${activeConfig ? "active" : ""}`}
            onClick={() => setConfigOpen((v) => !v)}
            type="button"
          >
            <IconSettings />
            <span>Configurações</span>
            <span className={`chev ${configOpen ? "open" : ""}`}>
              <IconChevronDown />
            </span>
          </button>

          {configOpen && (
            <div className="nav-sub">
              <NavLink
                to="/config/perfil"
                className={({ isActive }) => `nav-sub-item ${isActive ? "active" : ""}`}
              >
                <span className="dot" />
                <span>Perfil</span>
              </NavLink>
              <NavLink
                to="/config/seguranca"
                className={({ isActive }) => `nav-sub-item ${isActive ? "active" : ""}`}
              >
                <span className="dot" />
                <span>Senha</span>
              </NavLink>
            </div>
          )}
        </nav>
      </aside>

      <div className="main">
        <header className="topnav">
          <div className="topnav-left">
            {isMobile ? (
              <button
                className="icon-btn"
                type="button"
                title="Menu"
                onClick={() => setSidebarOpen((v) => !v)}
              >
                <IconMenu />
              </button>
            ) : (
              <button
                className="icon-btn"
                type="button"
                title={sidebarCollapsed ? "Expandir menu" : "Esconder menu"}
                aria-label={sidebarCollapsed ? "Expandir menu" : "Esconder menu"}
                onClick={() => setSidebarCollapsed((v) => !v)}
              >
                {sidebarCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
              </button>
            )}

            <div className="crumbs">
              <div className="crumb-title">{pageTitle}</div>
              <div className="crumb muted">{formatNow(now)}</div>
            </div>
          </div>

          <div className="topnav-right">
            <button
              className="icon-btn"
              type="button"
              title="Configurações"
              onClick={() => {
                navigate("/config/perfil");
              }}
            >
              <IconSettings />
            </button>

            <button className="icon-btn danger" type="button" title="Sair" onClick={logout}>
              <IconLogOut />
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
