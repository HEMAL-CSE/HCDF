import { Navigate, useLocation } from "react-router-dom";
import { isStaffUser, useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, permission, anyPermission, roles, staffOnly = false }) {
  const { user, loading, hasPermission, hasAnyPermission, hasAnyRole } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loading">Checking your secure session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (staffOnly && !isStaffUser(user)) return <Navigate to="/member" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/forbidden" replace />;
  if (anyPermission && !hasAnyPermission(...anyPermission)) return <Navigate to="/forbidden" replace />;
  if (roles && !hasAnyRole(...roles)) return <Navigate to="/forbidden" replace />;
  return children;
}
