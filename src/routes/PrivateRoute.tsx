import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../auth/authStorage";

export default function PrivateRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}