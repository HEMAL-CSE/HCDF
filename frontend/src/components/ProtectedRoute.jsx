import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, permission }) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loading">Checking your secure session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (permission && !hasPermission(permission)) return <Navigate to="/forbidden" replace />;
  return children;
}
