import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, permission, roles }) {
  const { user, loading, hasPermission, hasAnyRole } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loading">Checking your secure session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (permission && !hasPermission(permission)) return <Navigate to="/forbidden" replace />;
  if (roles && !hasAnyRole(...roles)) return <Navigate to="/forbidden" replace />;
  return children;
}
