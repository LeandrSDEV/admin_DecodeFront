import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/login/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import PrivateRoute from "./routes/PrivateRoute";
import AffiliatePrivateRoute from "./routes/AffiliatePrivateRoute";
import AppShell from "./layout/AppShell";
import AffiliateShell from "./layout/AffiliateShell";
import ControleDecodesPage from "./pages/controle/ControleDecodesPage";
import ControleInteracoesPage from "./pages/controle/ControleInteracoesPage";
import ControleLeadsPage from "./pages/controle/ControleLeadsPage";
import PlanosPage from "./pages/controle/PlanosPage";
import AfiliadosPage from "./pages/afiliados/AfiliadosPage";
import AfiliadoDetalhePage from "./pages/afiliados/AfiliadoDetalhePage";
import ComissoesPage from "./pages/afiliados/ComissoesPage";
import AfiliadoLoginPage from "./pages/afiliado/AfiliadoLoginPage";
import AfiliadoPainelPage from "./pages/afiliado/AfiliadoPainelPage";
import AfiliadoComissoesPage from "./pages/afiliado/AfiliadoComissoesPage";
import AfiliadoPerfilPage from "./pages/afiliado/AfiliadoPerfilPage";
import AfiliadoLeadsPage from "./pages/afiliado/AfiliadoLeadsPage";
import AfiliadoInteracoesPage from "./pages/afiliado/AfiliadoInteracoesPage";
import UsuariosPage from "./pages/usuarios/UsuariosPage";
import MonitoramentoPage from "./pages/monitoramento/MonitoramentoPage";
import TenantsPage from "./pages/tenants/TenantsPage";
import ProfilePage from "./pages/settings/ProfilePage";
import SecurityPage from "./pages/settings/SecurityPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Portal do afiliado (auth isolada) */}
      <Route path="/afiliado/entrar" element={<AfiliadoLoginPage />} />
      <Route element={<AffiliatePrivateRoute />}>
        <Route element={<AffiliateShell />}>
          <Route path="/afiliado/painel" element={<AfiliadoPainelPage />} />
          <Route path="/afiliado/leads" element={<AfiliadoLeadsPage />} />
          <Route path="/afiliado/interacoes" element={<AfiliadoInteracoesPage />} />
          <Route path="/afiliado/comissoes" element={<AfiliadoComissoesPage />} />
          <Route path="/afiliado/perfil" element={<AfiliadoPerfilPage />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clientes/decodes" element={<ControleDecodesPage />} />
          <Route
            path="/clientes/interacoes"
            element={<ControleInteracoesPage />}
          />
          <Route path="/clientes/leads" element={<ControleLeadsPage />} />
          <Route path="/clientes/planos" element={<PlanosPage />} />
          <Route path="/parceiros/afiliados" element={<AfiliadosPage />} />
          <Route path="/parceiros/afiliados/:id" element={<AfiliadoDetalhePage />} />
          <Route path="/parceiros/comissoes" element={<ComissoesPage />} />

          {/* Compatibilidade: redireciona URLs antigas */}
          <Route path="/controle/decodes" element={<Navigate to="/clientes/decodes" replace />} />
          <Route path="/controle/interacoes" element={<Navigate to="/clientes/interacoes" replace />} />
          <Route path="/controle/leads" element={<Navigate to="/clientes/leads" replace />} />
          <Route path="/controle/assinaturas" element={<Navigate to="/clientes/planos" replace />} />
          <Route path="/controle/afiliados" element={<Navigate to="/parceiros/afiliados" replace />} />
          <Route path="/controle/comissoes" element={<Navigate to="/parceiros/comissoes" replace />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/monitoramento" element={<MonitoramentoPage />} />
          <Route path="/tenants" element={<TenantsPage />} />

          <Route path="/config/perfil" element={<ProfilePage />} />
          <Route path="/config/seguranca" element={<SecurityPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
