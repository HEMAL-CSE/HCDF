import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCw, ChevronLeft, ChevronRight, UserRound, Shield, X, Check, Save } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const statusClass = { ACTIVE: "status-active", PENDING: "status-pending", SUSPENDED: "status-suspended", LOCKED: "status-locked" };

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission("users.update");
  const canManageRoles = hasPermission("users.manage_roles");
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1, limit: 20 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [draftStatus, setDraftStatus] = useState("PENDING");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setQ(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = useCallback(async (signal) => {
    setLoading(true); setError("");
    try {
      const response = await api.get("/admin/users", {
        params: { page, limit: 20, q: q || undefined, status: status || undefined },
        signal
      });
      setItems(response.data.data.items);
      setPagination(response.data.data.pagination);
    } catch (e) {
      if (e.code === "ERR_CANCELED" || e.name === "CanceledError") return;
      setError(e.response?.data?.message || "Could not load users.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, q, status]);

  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

  useEffect(() => {
    if (!canManageRoles) return;
    api.get("/admin/roles").then((r) => setRoles(r.data.data)).catch(() => {});
  }, [canManageRoles]);

  async function openUser(user) {
    setNotice(""); setError("");
    try {
      const response = await api.get(`/admin/users/${user.id}`);
      setSelected(response.data.data);
      setDraftStatus(response.data.data.status);
      setSelectedRoles(response.data.data.roles.map((role) => String(role.id)));
    } catch (e) { setError(e.response?.data?.message || "Could not load user details."); }
  }

  async function changeStatus(nextStatus) {
    if (!selected) return;
    if (!window.confirm(`Change this account status to ${nextStatus}?`)) return;
    setSaving(true); setNotice(""); setError("");
    try {
      await api.patch(`/admin/users/${selected.id}/status`, { status: nextStatus });
      setNotice("Account status updated.");
      await loadUsers();
      const response = await api.get(`/admin/users/${selected.id}`);
      setSelected(response.data.data);
      setDraftStatus(response.data.data.status);
      setSelectedRoles(response.data.data.roles.map((role) => String(role.id)));
    } catch (e) { setError(e.response?.data?.message || "Status update failed."); }
    finally { setSaving(false); }
  }

  async function saveRoles() {
    if (!selected) return;
    if (!window.confirm("Replace this user's role assignments with the selected roles?")) return;
    setSaving(true); setNotice(""); setError("");
    try {
      await api.put(`/admin/users/${selected.id}/roles`, { role_ids: selectedRoles });
      setNotice("Role assignments updated.");
      await loadUsers();
      const response = await api.get(`/admin/users/${selected.id}`);
      setSelected(response.data.data);
      setDraftStatus(response.data.data.status);
      setSelectedRoles(response.data.data.roles.map((role) => String(role.id)));
    } catch (e) { setError(e.response?.data?.message || "Role update failed."); }
    finally { setSaving(false); }
  }

  return (
    <div className="page-stack">
      <div className="page-heading"><div><div className="eyebrow">ACCESS & PEOPLE</div><h1>User management</h1><p>Review accounts, check assigned roles and manage account access.</p></div><button className="secondary-button" onClick={() => loadUsers()}><RefreshCw size={16} /> Refresh</button></div>
      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}
      <section className="panel">
        <div className="toolbar">
          <div className="search-box"><Search size={17} /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, email or phone" /></div>
          <select className="select-control" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="LOCKED">Locked</option></select>
          <span className="result-count">{pagination.total.toLocaleString()} accounts</span>
        </div>
        {loading ? <div className="loading-card">Loading user accounts…</div> : (
          <div className="table-wrap"><table className="data-table"><thead><tr><th>USER</th><th>CONTACT</th><th>ROLES</th><th>STATUS</th><th>CREATED</th><th /></tr></thead><tbody>
            {items.map((user) => <tr key={user.id}>
              <td><div className="table-person"><div className="person-avatar"><UserRound size={17} /></div><div><strong>{user.full_name}</strong><span>UID #{user.id}</span></div></div></td>
              <td><div className="contact-cell">{user.email || "—"}<span>{user.phone || "No phone"}</span></div></td>
              <td><div className="role-pills">{user.role_codes.length ? user.role_codes.map((role) => <span key={role} className="role-pill">{role}</span>) : <span className="muted">Unassigned</span>}</div></td>
              <td><span className={`status-pill ${statusClass[user.status] || ""}`}>{user.status}</span></td>
              <td className="date-cell">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</td>
              <td><button className="table-action" onClick={() => openUser(user)}>View details <ChevronRight size={15} /></button></td>
            </tr>)}
            {!items.length && <tr><td colSpan="6"><div className="empty-state">No user accounts match your search.</div></td></tr>}
          </tbody></table></div>
        )}
        <div className="table-pagination"><span>Page {pagination.page} of {Math.max(1, pagination.total_pages)}</span><div><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={17} /> Previous</button><button disabled={page >= pagination.total_pages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight size={17} /></button></div></div>
      </section>

      {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-heading"><div><div className="eyebrow">ACCOUNT DETAILS</div><h2>{selected.full_name}</h2><p>User ID #{selected.id}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button></div>
        <div className="detail-grid"><div><span>Email</span><strong>{selected.email || "Not provided"}</strong></div><div><span>Phone</span><strong>{selected.phone || "Not provided"}</strong></div><div><span>Current status</span><strong><span className={`status-pill ${statusClass[selected.status]}`}>{selected.status}</span></strong></div><div><span>Last login</span><strong>{selected.last_login_at ? new Date(selected.last_login_at).toLocaleString() : "Never"}</strong></div></div>
        {canUpdate && <div className="modal-section"><h3>Account status</h3><div className="inline-controls"><select className="select-control" value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}><option value="PENDING">PENDING</option><option value="ACTIVE">ACTIVE</option><option value="SUSPENDED">SUSPENDED</option><option value="LOCKED">LOCKED</option></select><button className="primary-button compact-button" disabled={saving} onClick={() => changeStatus(draftStatus)}><Check size={15} /> Apply status</button></div></div>}
        {canManageRoles && <div className="modal-section"><h3><Shield size={17} /> Assigned roles</h3><div className="role-checkbox-list">{roles.map((role) => <label key={role.id} className="role-checkbox"><input type="checkbox" checked={selectedRoles.includes(String(role.id))} onChange={(e) => setSelectedRoles((current) => e.target.checked ? [...current, String(role.id)] : current.filter((id) => id !== String(role.id)))} /><span><strong>{role.name}</strong><small>{role.code}</small></span></label>)}</div><button className="primary-button compact-button" disabled={saving} onClick={saveRoles}><Save size={15} /> Save role assignments</button></div>}
        {!canUpdate && !canManageRoles && <div className="info-strip compact-info"><Shield size={18} /><div><strong>Read-only access</strong><p>Your assigned permissions allow viewing account information only.</p></div></div>}
      </section></div>}
    </div>
  );
}
