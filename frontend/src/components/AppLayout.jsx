import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck, ChevronRight, LayoutDashboard, LogOut, Menu, ShieldCheck, UserCheck, UserRound, Users, X
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Overview", icon: LayoutDashboard, permission: "users.view", end: true },
  { to: "/member", label: "Member portal", icon: UserRound, permission: "profile.view_own" },
  { to: "/members/approval", label: "Member approval", icon: UserCheck, permission: "membership.view" },
  { to: "/users", label: "User management", icon: Users, permission: "users.view" },
  { to: "/roles", label: "Roles", icon: ShieldCheck, permission: "roles.view" },
  { to: "/permissions", label: "Permissions", icon: BadgeCheck, permission: "permissions.view" }
];

export default function AppLayout() {
  const { user, logout, hasPermission } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const sectionTitle = location.pathname.startsWith("/member") && !location.pathname.startsWith("/members")
    ? "Member Portal"
    : "Administration";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const initials = (user?.fullName || user?.email || "HC").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">H</div>
          <div><div className="brand-title">HCDF</div><div className="brand-subtitle">Management portal</div></div>
          <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="side-nav">
          {links.filter((link) => hasPermission(link.permission)).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span><ChevronRight className="nav-chevron" size={15} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><div className="note-icon"><ShieldCheck size={17} /></div><div><strong>Secure workspace</strong><span>Access controlled by role permissions</span></div></div>
          <button className="logout-link" onClick={handleLogout}><LogOut size={17} /> Sign out</button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="breadcrumb"><span>HCDF</span><ChevronRight size={14} /><strong>{sectionTitle}</strong></div>
          <div className="topbar-user">
            <div className="avatar">{initials}</div>
            <div className="topbar-user-copy"><strong>{user?.fullName || "HCDF User"}</strong><span>{(user?.roles || []).map((role) => role.code).join(" · ")}</span></div>
          </div>
        </header>
        <main className="content-area"><Outlet /></main>
        <footer className="app-footer"><span>Human Charity Dignity Foundation</span><span>Administration portal</span></footer>
      </div>
    </div>
  );
}
