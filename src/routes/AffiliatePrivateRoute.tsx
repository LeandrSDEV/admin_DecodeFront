import { Navigate, Outlet } from "react-router-dom";
import { isAffiliateAuthenticated } from "../auth/affiliateAuthStorage";

export default function AffiliatePrivateRoute() {
  return isAffiliateAuthenticated() ? <Outlet /> : <Navigate to="/afiliado/entrar" replace />;
}
