import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, refreshAccessToken, setAccessToken } from "../api/client.js";

const AuthContext = createContext(null);

const routePermissions = [
  { path: "/", permission: "users.view" },
  { path: "/roles", permission: "roles.view" },
  { path: "/permissions", permission: "permissions.view" }
];

export function getDefaultRoute(user) {
  const permissions = user?.permissions || [];
  const match = routePermissions.find((route) => permissions.includes(route.permission));
  return match ? match.path : "/forbidden";
}

export function canAccessPath(user, pathname) {
  const permissions = user?.permissions || [];
  if (pathname === "/" || pathname === "/users") return permissions.includes("users.view");
  if (pathname === "/roles") return permissions.includes("roles.view");
  if (pathname === "/permissions") return permissions.includes("permissions.view");
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
    user, loading, login, logout, refreshCurrentUser: loadCurrentUser,
    hasPermission: (code) => Boolean(user?.permissions?.includes(code)),
    hasAnyRole: (...codes) => Boolean(user?.roles?.some((role) => codes.includes(role.code)))
  }), [user, loading, login, logout, loadCurrentUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
