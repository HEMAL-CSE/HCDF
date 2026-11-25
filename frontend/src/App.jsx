import { Navigate, Route, Routes } from "react-router-dom";
import { getDefaultRoute, useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import RolesPage from "./pages/RolesPage.jsx";
import PermissionsPage from "./pages/PermissionsPage.jsx";
import ForbiddenPage from "./pages/ForbiddenPage.jsx";

function SecureLayout() {
  return <ProtectedRoute><AppLayout /></ProtectedRoute>;
}

export default function App() {
  const { user } = useAuth();
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forbidden" element={<ProtectedRoute><ForbiddenPage /></ProtectedRoute>} />
    <Route element={<SecureLayout />}>
      <Route index element={<ProtectedRoute permission="users.view"><DashboardPage /></ProtectedRoute>} />
      <Route path="users" element={<ProtectedRoute permission="users.view"><UsersPage /></ProtectedRoute>} />
      <Route path="roles" element={<ProtectedRoute permission="roles.view"><RolesPage /></ProtectedRoute>} />
      <Route path="permissions" element={<ProtectedRoute permission="permissions.view"><PermissionsPage /></ProtectedRoute>} />
    </Route>
    <Route path="*" element={<Navigate to={user ? getDefaultRoute(user) : "/login"} replace />} />
  </Routes>;
}
