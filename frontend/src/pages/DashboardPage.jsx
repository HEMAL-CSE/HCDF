import { useEffect, useState } from "react";
import {
  Activity, ArrowUpRight, Clock3, FileText, LayoutTemplate,
  ShieldCheck, Users, UserCheck, UserRoundX, Wallet
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

function StatCard({ label, value, hint, icon: Icon, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{Number(value || 0).toLocaleString()}</div>
      <div className="stat-hint">{hint}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, hasPermission, hasAnyPermission, hasAnyRole } = useAuth();
  const canViewUsers = hasPermission("users.view");
  const canViewMembers = hasPermission("membership.view");

  const [summary, setSummary] = useState(null);
  const [pendingCount, setPendingCount] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(canViewUsers || canViewMembers);

  useEffect(() => {
    let active = true;
    const tasks = [];
    if (canViewUsers) {
      tasks.push(
        api.get("/admin/dashboard/summary")
          .then((r) => { if (active) setSummary(r.data.data); })
          .catch((e) => { if (active) setError(e.response?.data?.message || "Could not load dashboard data."); })
      );
    }
    if (canViewMembers) {
      tasks.push(
        api.get("/admin/members/pending", { params: { page: 1, limit: 1 } })
          .then((r) => { if (active) setPendingCount(r.data?.data?.pagination?.total ?? 0); })
          .catch(() => {})
      );
    }
    if (tasks.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(tasks).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canViewUsers, canViewMembers]);

  const stats = summary?.users || {};
  const roles = user?.roles || [];
  const permissions = user?.permissions || [];

  const quickModules = [
    canViewMembers && {
      to: "/members/approval",
      title: "Member Approval Queue",
      desc: pendingCount !== null ? `${pendingCount} pending membership application(s)` : "Review & approve member applications",
      icon: UserCheck
    },
    hasAnyPermission("finance.view", "donations.view") && {
      to: "/finance",
      title: "Finance & Donations",
      desc: "Donations verification, refunds & financial reconciliation",
      icon: Wallet
    },
    hasAnyPermission("audit.view", "reports.view") && {
      to: "/audit",
      title: "Audit & Reports",
      desc: "Read-only audit logs and authorised reports",
      icon: FileText
    },
    hasAnyRole("SA", "AD") && {
      to: "/cms",
      title: "Home Content & Banners",
      desc: "Manage public hero slider, programmes & impact counters",
      icon: LayoutTemplate
    },
    canViewUsers && {
      to: "/users",
      title: "User Management",
      desc: "Manage staff/admin accounts, roles & status",
      icon: Users
    },
    hasPermission("roles.view") && {
      to: "/roles",
      title: "Roles & Permissions",
      desc: "Configure custom roles and RBAC permissions",
      icon: ShieldCheck
    }
  ].filter(Boolean);

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE OVERVIEW</div>
          <h1>Good to see you, {user?.fullName?.split(" ")[0] || "there"}.</h1>
          <p>
            Signed in as{" "}
            <strong>{roles.map((r) => `${r.name} (${r.code})`).join(", ") || "HCDF Staff"}</strong>
            . Your workspace shows only modules authorised for your role.
          </p>
        </div>
        <div className="date-chip"><Activity size={16} /> Role-scoped workspace</div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-card">Loading workspace…</div>
      ) : (
        <>
          {canViewUsers && (
            <div className="stats-grid">
              <StatCard label="Total users" value={stats.total_users} hint="All registered accounts" icon={Users} tone="green" />
              <StatCard label="Active accounts" value={stats.active_users} hint="Can access authorised services" icon={UserCheck} tone="blue" />
              <StatCard label="Pending approval" value={stats.pending_users} hint="Awaiting account activation" icon={Clock3} tone="amber" />
              <StatCard label="Suspended / locked" value={Number(stats.suspended_users || 0) + Number(stats.locked_users || 0)} hint="Restricted accounts" icon={UserRoundX} tone="rose" />
            </div>
          )}

          {quickModules.length > 0 && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Permitted modules</h2>
                  <p>Tools and workspaces available to your current role</p>
                </div>
                <ShieldCheck size={20} className="panel-heading-icon" />
              </div>
              <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                {quickModules.map(({ to, title, desc, icon: Icon }) => (
                  <Link key={to} to={to} className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="stat-icon green"><Icon size={20} /></div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <strong style={{ fontSize: 15, color: "#173b30" }}>{title}</strong>
                      <ArrowUpRight size={16} style={{ color: "#176b4c", flexShrink: 0 }} />
                    </div>
                    <div className="stat-hint" style={{ marginTop: 6 }}>{desc}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {canViewUsers && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Role distribution</h2>
                  <p>Accounts assigned to each system role</p>
                </div>
                <ShieldCheck size={20} className="panel-heading-icon" />
              </div>
              <div className="role-list">
                {(summary?.role_distribution || []).map((role) => {
                  const total = Number(stats.total_users || 0);
                  const count = Number(role.user_count || 0);
                  return (
                    <div className="role-row" key={role.code}>
                      <div className="role-avatar">{role.code.slice(0, 2)}</div>
                      <div className="role-info"><strong>{role.name}</strong><span>{role.code}</span></div>
                      <div className="role-progress"><div><span style={{ width: `${total ? Math.min(100, count / total * 100) : 0}%` }} /></div></div>
                      <strong className="role-count">{count}</strong>
                    </div>
                  );
                })}
                {!summary?.role_distribution?.length && <div className="empty-state">No role assignment data found.</div>}
              </div>
            </section>
          )}

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Active permissions ({permissions.length})</h2>
                <p>Permission codes currently granted to your account</p>
              </div>
              <ShieldCheck size={20} className="panel-heading-icon" />
            </div>
            {permissions.length ? (
              <div className="role-pills" style={{ flexWrap: "wrap", gap: 8 }}>
                {permissions.map((code) => (
                  <span key={code} className="role-pill" style={{ padding: "5px 9px", fontSize: 11 }}>{code}</span>
                ))}
              </div>
            ) : (
              <div className="empty-state">No specific permissions assigned to your role yet.</div>
            )}
          </section>

          <div className="info-strip">
            <div className="info-icon"><ShieldCheck size={19} /></div>
            <div>
              <strong>Access is permission-based</strong>
              <p>Your available tools are determined by the permissions assigned to your account. Restricted actions are also enforced by the backend.</p>
            </div>
            <ArrowUpRight size={18} className="info-arrow" />
          </div>
        </>
      )}
    </div>
  );
}
