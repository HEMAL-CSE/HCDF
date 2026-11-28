import { useCallback, useEffect, useState } from "react";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, UserRound,
  Shield, X, Check, Save, UserPlus, KeyRound, Copy
} from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const statusClass = {
  ACTIVE: "status-active",
  PENDING: "status-pending",
  SUSPENDED: "status-suspended",
  LOCKED: "status-locked"
};

const EMPTY_CREATE_FORM = {
  full_name: "",
  email: "",
  phone: "",
  status: "ACTIVE",
  generate_password: true,
  password: "",
  role_ids: []
};

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("users.create");
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

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const [resetGen, setResetGen] = useState(true);
  const [resetPasswordInput, setResetPasswordInput] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setQ(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = useCallback(async (signal) => {
    setLoading(true);
    setError("");
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
    if (!canManageRoles && !canCreate) return;
    api.get("/admin/roles").then((r) => setRoles(r.data.data || [])).catch(() => {});
  }, [canManageRoles, canCreate]);

  async function openUser(user) {
    setNotice("");
    setError("");
    setResetGen(true);
    setResetPasswordInput("");
    try {
      const response = await api.get(`/admin/users/${user.id}`);
      setSelected(response.data.data);
      setDraftStatus(response.data.data.status);
      setSelectedRoles(response.data.data.roles.map((role) => String(role.id)));
    } catch (e) {
      setError(e.response?.data?.message || "Could not load user details.");
    }
  }

  async function changeStatus(nextStatus) {
    if (!selected) return;
    if (!window.confirm(`Change this account status to ${nextStatus}?`)) return;
    setSaving(true);
    setNotice("");
    setError("");
    try {
      await api.patch(`/admin/users/${selected.id}/status`, { status: nextStatus });
      setNotice("Account status updated.");
      await loadUsers();
      const response = await api.get(`/admin/users/${selected.id}`);
      setSelected(response.data.data);
      setDraftStatus(response.data.data.status);
      setSelectedRoles(response.data.data.roles.map((role) => String(role.id)));
    } catch (e) {
      setError(e.response?.data?.message || "Status update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveRoles() {
    if (!selected) return;
    if (!window.confirm("Replace this user's role assignments with the selected roles?")) return;
    setSaving(true);
    setNotice("");
    setError("");
    try {
      await api.put(`/admin/users/${selected.id}/roles`, { role_ids: selectedRoles });
      setNotice("Role assignments updated.");
      await loadUsers();
      const response = await api.get(`/admin/users/${selected.id}`);
      setSelected(response.data.data);
      setDraftStatus(response.data.data.status);
      setSelectedRoles(response.data.data.roles.map((role) => String(role.id)));
    } catch (e) {
      setError(e.response?.data?.message || "Role update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/admin/users", createForm);
      const creds = response.data?.data?.credentials;
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      setNotice("Staff/Admin account created successfully.");
      if (creds) {
        setCopiedCreds(false);
        setGeneratedCreds({
          title: "New Account Credentials",
          email: creds.email,
          password: creds.password
        });
      }
      await loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || "Could not create user account.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!selected) return;
    if (!window.confirm(`Reset password for ${selected.full_name}? Active sessions will be signed out.`)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.patch(`/admin/users/${selected.id}/password`, {
        generate_password: resetGen,
        password: resetGen ? undefined : resetPasswordInput
      });
      const data = response.data?.data;
      setNotice("Password reset successfully.");
      setResetPasswordInput("");
      if (data?.temporary_password) {
        setCopiedCreds(false);
        setGeneratedCreds({
          title: "Password Reset Credentials",
          email: data.email || selected.email,
          password: data.temporary_password
        });
      }
    } catch (e) {
      setError(e.response?.data?.message || "Password reset failed.");
    } finally {
      setSaving(false);
    }
  }

  async function copyCredentials() {
    if (!generatedCreds) return;
    const text = `Email: ${generatedCreds.email}\nPassword: ${generatedCreds.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCreds(true);
    } catch {
      setCopiedCreds(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ACCESS &amp; PEOPLE</div>
          <h1>User management</h1>
          <p>Create staff/admin accounts, assign roles, reset passwords, and manage account status.</p>
        </div>
        <div className="inline-controls">
          <button className="secondary-button" onClick={() => loadUsers()}>
            <RefreshCw size={16} /> Refresh
          </button>
          {canCreate && (
            <button
              type="button"
              className="primary-button"
              onClick={() => { setError(""); setCreateForm(EMPTY_CREATE_FORM); setCreateOpen(true); }}
            >
              <UserPlus size={16} /> Create Staff / Admin
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, email or phone" />
          </div>
          <select className="select-control" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="LOCKED">Locked</option>
          </select>
          <span className="result-count">{pagination.total.toLocaleString()} accounts</span>
        </div>

        {loading ? (
          <div className="loading-card">Loading user accounts…</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>CONTACT</th>
                  <th>ROLES</th>
                  <th>STATUS</th>
                  <th>CREATED</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="table-person">
                        <div className="person-avatar"><UserRound size={17} /></div>
                        <div><strong>{user.full_name}</strong><span>UID #{user.id}</span></div>
                      </div>
                    </td>
                    <td><div className="contact-cell">{user.email || "—"}<span>{user.phone || "No phone"}</span></div></td>
                    <td>
                      <div className="role-pills">
                        {user.role_codes.length
                          ? user.role_codes.map((role) => <span key={role} className="role-pill">{role}</span>)
                          : <span className="muted">Unassigned</span>}
                      </div>
                    </td>
                    <td><span className={`status-pill ${statusClass[user.status] || ""}`}>{user.status}</span></td>
                    <td className="date-cell">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</td>
                    <td><button className="table-action" onClick={() => openUser(user)}>View details <ChevronRight size={15} /></button></td>
                  </tr>
                ))}
                {!items.length && (
                  <tr><td colSpan="6"><div className="empty-state">No user accounts match your search.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-pagination">
          <span>Page {pagination.page} of {Math.max(1, pagination.total_pages)}</span>
          <div>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={17} /> Previous</button>
            <button disabled={page >= pagination.total_pages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight size={17} /></button>
          </div>
        </div>
      </section>

      {/* ── USER DETAIL MODAL ──────────────────────────────────── */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <div className="eyebrow">ACCOUNT DETAILS</div>
                <h2>{selected.full_name}</h2>
                <p>User ID #{selected.id}</p>
              </div>
              <button className="icon-button" onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button>
            </div>

            <div className="detail-grid">
              <div><span>Email</span><strong>{selected.email || "Not provided"}</strong></div>
              <div><span>Phone</span><strong>{selected.phone || "Not provided"}</strong></div>
              <div><span>Current status</span><strong><span className={`status-pill ${statusClass[selected.status]}`}>{selected.status}</span></strong></div>
              <div><span>Last login</span><strong>{selected.last_login_at ? new Date(selected.last_login_at).toLocaleString() : "Never"}</strong></div>
            </div>

            {canUpdate && (
              <div className="modal-section">
                <h3>Account status</h3>
                <div className="inline-controls">
                  <select className="select-control" value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                    <option value="PENDING">PENDING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="LOCKED">LOCKED</option>
                  </select>
                  <button className="primary-button compact-button" disabled={saving} onClick={() => changeStatus(draftStatus)}>
                    <Check size={15} /> Apply status
                  </button>
                </div>
              </div>
            )}

            {canManageRoles && (
              <div className="modal-section">
                <h3><Shield size={17} /> Assigned roles</h3>
                <div className="role-checkbox-list">
                  {roles.map((role) => (
                    <label key={role.id} className="role-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(String(role.id))}
                        onChange={(e) =>
                          setSelectedRoles((current) =>
                            e.target.checked
                              ? [...current, String(role.id)]
                              : current.filter((id) => id !== String(role.id))
                          )
                        }
                      />
                      <span><strong>{role.name}</strong><small>{role.code}</small></span>
                    </label>
                  ))}
                </div>
                <button className="primary-button compact-button" disabled={saving} onClick={saveRoles}>
                  <Save size={15} /> Save role assignments
                </button>
              </div>
            )}

            {canUpdate && (
              <div className="modal-section" style={{ borderBottom: 0 }}>
                <h3><KeyRound size={17} /> Reset password</h3>
                <label className="cms-checkbox-row" style={{ marginBottom: 10 }}>
                  <input type="checkbox" checked={resetGen} onChange={(e) => setResetGen(e.target.checked)} />
                  <span>Auto-generate strong 14-character password</span>
                </label>
                {!resetGen && (
                  <div className="cms-field" style={{ marginBottom: 10 }}>
                    <input
                      type="text"
                      value={resetPasswordInput}
                      onChange={(e) => setResetPasswordInput(e.target.value)}
                      placeholder="Enter new password (12–128 characters)"
                    />
                  </div>
                )}
                <button type="button" className="secondary-button compact-button" disabled={saving} onClick={handleResetPassword}>
                  <KeyRound size={14} /> {saving ? "Resetting…" : "Reset password"}
                </button>
              </div>
            )}

            {!canUpdate && !canManageRoles && (
              <div className="info-strip compact-info">
                <Shield size={18} />
                <div>
                  <strong>Read-only access</strong>
                  <p>Your assigned permissions allow viewing account information only.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── CREATE STAFF / ADMIN MODAL ─────────────────────────── */}
      {createOpen && (
        <div className="modal-backdrop" onClick={() => setCreateOpen(false)}>
          <section className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <div className="eyebrow">NEW STAFF / ADMIN ACCOUNT</div>
                <h2>Create user account</h2>
                <p>Provision login credentials and assign role-based permissions.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setCreateOpen(false)} aria-label="Close"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateUser} className="cms-modal-form">
              <div className="cms-form-two-col">
                <div className="cms-field">
                  <label>Full Name *</label>
                  <input
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder="e.g. Ayesha Rahman"
                    required
                  />
                </div>
                <div className="cms-field">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="e.g. finance@hcdf.org"
                    required
                  />
                </div>
              </div>

              <div className="cms-form-two-col">
                <div className="cms-field">
                  <label>Phone (Optional)</label>
                  <input
                    value={createForm.phone}
                    onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. +8801700000000"
                  />
                </div>
                <div className="cms-field">
                  <label>Initial Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="ACTIVE">ACTIVE (Ready to sign in)</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div className="cms-field">
                <label>Assign Roles *</label>
                <div className="role-checkbox-list">
                  {roles.map((role) => (
                    <label key={role.id} className="role-checkbox">
                      <input
                        type="checkbox"
                        checked={createForm.role_ids.includes(String(role.id))}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            role_ids: e.target.checked
                              ? [...p.role_ids, String(role.id)]
                              : p.role_ids.filter((id) => id !== String(role.id))
                          }))
                        }
                      />
                      <span><strong>{role.name}</strong><small>{role.code}</small></span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="cms-checkbox-row">
                <input
                  type="checkbox"
                  checked={createForm.generate_password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, generate_password: e.target.checked }))}
                />
                <span>Auto-generate strong password (recommended)</span>
              </label>

              {!createForm.generate_password && (
                <div className="cms-field">
                  <label>Password * (12–128 characters)</label>
                  <input
                    type="text"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Minimum 12 characters"
                    minLength={12}
                    required
                  />
                </div>
              )}

              <div className="cms-modal-footer">
                <button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving || createForm.role_ids.length === 0}
                >
                  <UserPlus size={15} /> {saving ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ── GENERATED CREDENTIALS MODAL ────────────────────────── */}
      {generatedCreds && (
        <div className="modal-backdrop" onClick={() => setGeneratedCreds(null)}>
          <section className="detail-modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <div className="eyebrow">COPY CREDENTIALS NOW</div>
                <h2>{generatedCreds.title}</h2>
                <p>Share these login details securely. The password cannot be viewed again after closing.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setGeneratedCreds(null)} aria-label="Close"><X size={20} /></button>
            </div>

            <div className="detail-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div><span>Email / Login ID</span><strong>{generatedCreds.email}</strong></div>
              <div><span>Password</span><strong style={{ fontFamily: "monospace", fontSize: 14 }}>{generatedCreds.password}</strong></div>
            </div>

            <div className="cms-modal-footer">
              <button type="button" className="secondary-button" onClick={() => setGeneratedCreds(null)}>Close</button>
              <button type="button" className="primary-button" onClick={copyCredentials}>
                {copiedCreds ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Credentials</>}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
