import { Navigate, Route, Routes } from "react-router-dom";
import { getDefaultRoute, useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MemberLoginPage from "./pages/MemberLoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MemberApprovalPage from "./pages/MemberApprovalPage.jsx";
import MemberPortalPage from "./pages/MemberPortalPage.jsx";
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
    <Route path="/home" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/member/login" element={<MemberLoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forbidden" element={<ProtectedRoute><ForbiddenPage /></ProtectedRoute>} />
    <Route element={<SecureLayout />}>
      <Route index element={<ProtectedRoute permission="users.view"><DashboardPage /></ProtectedRoute>} />
      <Route path="member" element={<ProtectedRoute permission="profile.view_own"><MemberPortalPage /></ProtectedRoute>} />
      <Route path="members/approval" element={<ProtectedRoute permission="membership.view"><MemberApprovalPage /></ProtectedRoute>} />
      <Route path="users" element={<ProtectedRoute permission="users.view"><UsersPage /></ProtectedRoute>} />
      <Route path="roles" element={<ProtectedRoute permission="roles.view"><RolesPage /></ProtectedRoute>} />
      <Route path="permissions" element={<ProtectedRoute permission="permissions.view"><PermissionsPage /></ProtectedRoute>} />
    </Route>
    <Route path="*" element={<Navigate to={user ? getDefaultRoute(user) : "/home"} replace />} />
  </Routes>;
}
