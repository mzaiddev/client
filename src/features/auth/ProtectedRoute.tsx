import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Role } from "../../types";

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, token, isLoading } = useAuth();
  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading session...</div>;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
