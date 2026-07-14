import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types";

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { user, accessToken } = useAuthStore();

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
