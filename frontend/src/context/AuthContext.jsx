import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, refreshAccessToken, setAccessToken } from "../api/client.js";

const AuthContext = createContext(null);

const MEMBER_ONLY_PERMISSIONS = new Set([
  "profile.view_own",
  "profile.update_own",
  "donations.view_own",
  "receipts.view_own"
]);

export function isStaffUser(user) {
  if (!user) return false;
  const roles = (user?.roles || []).map((role) => role.code);
  const permissions = user?.permissions || [];
  if (roles.some((code) => code !== "MB")) return true;
  return permissions.some((code) => !MEMBER_ONLY_PERMISSIONS.has(code));
}

export function getDefaultRoute(user) {
  if (!user) return "/login";
  const roles = (user?.roles || []).map((role) => role.code);
  const permissions = user?.permissions || [];
  if (isStaffUser(user)) return "/";
  if (permissions.includes("profile.view_own")) return "/member";
  if (roles.length === 0 && permissions.length === 0) return "/forbidden";
  return "/forbidden";
}

export function canAccessPath(user, pathname) {
  if (!user) return false;
  const permissions = user?.permissions || [];
  const roles = (user?.roles || []).map((role) => role.code);
  if (pathname === "/") return isStaffUser(user);
  if (pathname === "/users") return permissions.includes("users.view");
  if (pathname === "/members/approval") return permissions.includes("membership.view");
  if (pathname === "/finance") return permissions.includes("finance.view") || permissions.includes("donations.view");
  if (pathname === "/audit") return permissions.includes("audit.view") || permissions.includes("reports.view");
  if (pathname === "/cms") return roles.includes("SA") || roles.includes("AD");
  if (pathname === "/roles") return permissions.includes("roles.view");
  if (pathname === "/permissions") return permissions.includes("permissions.view");
  if (pathname === "/member") return permissions.includes("profile.view_own");
  return false;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    const response = await api.get("/auth/me");
    setUser(response.data?.data || null);
    return response.data?.data || null;
  }, []);

  const refreshSession = useCallback(async () => {
    const token = await refreshAccessToken();
    if (!token) throw new Error("No access token returned by refresh endpoint.");
    return loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    let active = true;
    refreshSession().catch(() => {
      setAccessToken(null);
      if (active) setUser(null);
    }).finally(() => { if (active) setLoading(false); });

    const onExpired = () => {
      setAccessToken(null);
      setUser(null);
    };
    window.addEventListener("hcdf:session-expired", onExpired);
    return () => {
      active = false;
      window.removeEventListener("hcdf:session-expired", onExpired);
    };
  }, [refreshSession]);

  const login = useCallback(async (identifier, password) => {
    const response = await api.post("/auth/login", { identifier, password });
    setAccessToken(response.data?.data?.access_token);
    setUser(response.data?.data?.user || null);
    return response.data?.data?.user || null;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refreshCurrentUser: loadCurrentUser,
    hasPermission: (code) => Boolean(user?.permissions?.includes(code)),
    hasAnyPermission: (...codes) => Boolean(codes.some((code) => user?.permissions?.includes(code))),
    hasAnyRole: (...codes) => Boolean(user?.roles?.some((role) => codes.includes(role.code)))
  }), [user, loading, login, logout, loadCurrentUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
