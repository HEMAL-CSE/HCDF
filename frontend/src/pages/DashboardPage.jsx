import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Clock3, ShieldCheck, Users, UserCheck, UserRoundX } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

function StatCard({ label, value, hint, icon: Icon, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20} /></div><div className="stat-label">{label}</div><div className="stat-value">{Number(value || 0).toLocaleString()}</div><div className="stat-hint">{hint}</div></div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard/summary").then((r) => setSummary(r.data.data)).catch((e) => setError(e.response?.data?.message || "Could not load dashboard data.")).finally(() => setLoading(false));
  }, []);

  const stats = summary?.users || {};
  return (
    <div className="page-stack">
      <div className="page-heading"><div><div className="eyebrow">WORKSPACE OVERVIEW</div><h1>Good to see you, {user?.fullName?.split(" ")[0] || "there"}.</h1><p>Here’s a snapshot of user accounts and access across HCDF.</p></div><div className="date-chip"><Activity size={16} /> Live database summary</div></div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? <div className="loading-card">Loading dashboard summary…</div> : (
        <>
          <div className="stats-grid">
            <StatCard label="Total users" value={stats.total_users} hint="All registered accounts" icon={Users} tone="green" />
            <StatCard label="Active accounts" value={stats.active_users} hint="Can access authorised services" icon={UserCheck} tone="blue" />
            <StatCard label="Pending approval" value={stats.pending_users} hint="Awaiting account activation" icon={Clock3} tone="amber" />
            <StatCard label="Suspended / locked" value={Number(stats.suspended_users || 0) + Number(stats.locked_users || 0)} hint="Restricted accounts" icon={UserRoundX} tone="rose" />
          </div>
          <section className="panel">
            <div className="panel-heading"><div><h2>Role distribution</h2><p>Accounts assigned to each system role</p></div><ShieldCheck size={20} className="panel-heading-icon" /></div>
            <div className="role-list">
              {(summary?.role_distribution || []).map((role) => {
                const total = Number(stats.total_users || 0);
                const count = Number(role.user_count || 0);
                return <div className="role-row" key={role.code}><div className="role-avatar">{role.code.slice(0, 2)}</div><div className="role-info"><strong>{role.name}</strong><span>{role.code}</span></div><div className="role-progress"><div><span style={{ width: `${total ? Math.min(100, count / total * 100) : 0}%` }} /></div></div><strong className="role-count">{count}</strong></div>;
              })}
              {!summary?.role_distribution?.length && <div className="empty-state">No role assignment data found.</div>}
            </div>
          </section>
          <div className="info-strip"><div className="info-icon"><ShieldCheck size={19} /></div><div><strong>Access is permission-based</strong><p>Your available tools are determined by the permissions assigned to your account. Restricted actions are also enforced by the backend.</p></div><ArrowUpRight size={18} className="info-arrow" /></div>
        </>
      )}
    </div>
  );
}
