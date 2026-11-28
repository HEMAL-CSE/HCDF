import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, KeyRound, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ code: "", name: "", description: "", permissionIds: [] });

  const canManagePerms = hasPermission("permissions.manage");
  const canManageRoles = hasPermission("roles.manage");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [r, p] = await Promise.all([api.get("/admin/roles"), api.get("/admin/permissions")]);
      setRoles(r.data.data || []);
      setAllPermissions(p.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load role data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function chooseRole(role) {
    setSelected(role);
    setError("");
    setNotice("");
    try {
      const response = await api.get(`/admin/roles/${role.id}/permissions`);
      setSelectedIds(response.data.data.permissions.map((p) => String(p.id)));
    } catch (e) {
      setError(e.response?.data?.message || "Could not load role permissions.");
    }
  }

  async function savePermissions() {
    if (!selected) return;
    if (!window.confirm(`Replace permissions for ${selected.name}?`)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.put(`/admin/roles/${selected.id}/permissions`, { permission_ids: selectedIds });
      setNotice("Role permissions updated.");
      const [rolesResponse] = await Promise.all([api.get("/admin/roles"), chooseRole(selected)]);
      setRoles(rolesResponse.data.data);
    } catch (e) {
      setError(e.response?.data?.message || "Permission update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRole(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/admin/roles", {
        code: newRole.code.trim().toUpperCase(),
        name: newRole.name.trim(),
        description: newRole.description.trim() || null,
        permission_ids: newRole.permissionIds
      });
      const created = response.data?.data;
      setCreateOpen(false);
      setNewRole({ code: "", name: "", description: "", permissionIds: [] });
      setNotice(`Custom role "${created?.name}" (${created?.code}) created.`);
      await loadData();
      if (created?.id) await chooseRole(created);
    } catch (e) {
      setError(e.response?.data?.message || "Could not create role.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRole(role) {
    if (!window.confirm(`Delete custom role "${role.name}" (${role.code})?`)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.delete(`/admin/roles/${role.id}`);
      setNotice(`Custom role "${role.name}" deleted.`);
      if (selected?.id === role.id) {
        setSelected(null);
        setSelectedIds([]);
      }
      await loadData();
    } catch (e) {
      setError(e.response?.data?.message || "Could not delete role.");
    } finally {
      setSaving(false);
    }
  }

  const grouped = allPermissions.reduce((acc, permission) => {
    (acc[permission.module] ||= []).push(permission);
    return acc;
  }, {});

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ACCESS CONTROL</div>
          <h1>Roles &amp; permissions</h1>
          <p>Create custom roles and configure permission codes assigned to each role.</p>
        </div>
        <div className="inline-controls">
          <div className="date-chip"><ShieldCheck size={16} /> Role-based access</div>
          {canManageRoles && (
            <button type="button" className="primary-button" onClick={() => { setError(""); setCreateOpen(true); }}>
              <Plus size={16} /> Create Role
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {loading ? (
        <div className="loading-card">Loading roles…</div>
      ) : (
        <div className="role-management-grid">
          <section className="panel role-catalog">
            <div className="panel-heading">
              <div>
                <h2>System &amp; custom roles</h2>
                <p>{roles.length} configured roles</p>
              </div>
            </div>
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => chooseRole(role)}
                className={`role-catalog-item ${selected?.id === role.id ? "role-catalog-selected" : ""}`}
              >
                <div className="role-avatar">{role.code}</div>
                <div className="role-info">
                  <strong>{role.name}</strong>
                  <span>{role.code} · {Number(role.user_count)} users</span>
                </div>
                <ChevronRight size={17} />
              </button>
            ))}
          </section>

          <section className="panel permission-panel">
            {!selected ? (
              <div className="empty-selection">
                <KeyRound size={30} />
                <h3>Select a role</h3>
                <p>Choose a role to inspect or update its assigned permissions.</p>
              </div>
            ) : (
              <>
                <div className="panel-heading">
                  <div>
                    <div className="eyebrow">{selected.code} {selected.is_system ? "• SYSTEM ROLE" : "• CUSTOM ROLE"}</div>
                    <h2>{selected.name}</h2>
                    <p>{selected.description || "Configured role"}</p>
                  </div>
                  <div className="inline-controls">
                    <span className="count-chip">{selectedIds.length} selected</span>
                    {canManageRoles && !selected.is_system && selected.code !== "SA" && (
                      <button
                        type="button"
                        className="secondary-button compact-button"
                        style={{ color: "#b64f46", borderColor: "#f0d5d2" }}
                        disabled={saving}
                        onClick={() => handleDeleteRole(selected)}
                      >
                        <Trash2 size={14} /> Delete role
                      </button>
                    )}
                  </div>
                </div>

                {!canManagePerms && (
                  <div className="alert alert-info">Read-only: your account does not have <code>permissions.manage</code>.</div>
                )}
                {selected.code === "SA" && (
                  <div className="alert alert-info">The Super Admin permission set is protected against replacement.</div>
                )}

                <div className="permission-groups">
                  {Object.entries(grouped).map(([module, entries]) => (
                    <div className="permission-group" key={module}>
                      <h3>{module.replaceAll("_", " ")}</h3>
                      {entries.map((permission) => (
                        <label key={permission.id} className="permission-option">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(String(permission.id))}
                            disabled={!canManagePerms || selected.code === "SA"}
                            onChange={(e) =>
                              setSelectedIds((current) =>
                                e.target.checked
                                  ? [...current, String(permission.id)]
                                  : current.filter((id) => id !== String(permission.id))
                              )
                            }
                          />
                          <span>
                            <strong>{permission.name}</strong>
                            <small>{permission.code}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>

                {canManagePerms && selected.code !== "SA" && (
                  <div className="permission-save">
                    <button className="primary-button" onClick={savePermissions} disabled={saving}>
                      {saving ? "Saving…" : "Save permissions"}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {createOpen && (
        <div className="modal-backdrop" onClick={() => setCreateOpen(false)}>
          <section className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <div className="eyebrow">NEW ROLE</div>
                <h2>Create custom role</h2>
                <p>Define a role code, display name, and initial permissions.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setCreateOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="cms-modal-form">
              <div className="cms-form-two-col">
                <div className="cms-field">
                  <label>Role Code * (e.g. FM, HR, COORD)</label>
                  <input
                    value={newRole.code}
                    onChange={(e) => setNewRole((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") }))}
                    placeholder="e.g. PROG_LEAD"
                    maxLength={30}
                    required
                  />
                </div>
                <div className="cms-field">
                  <label>Role Name *</label>
                  <input
                    value={newRole.name}
                    onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Programme Coordinator"
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="cms-field">
                <label>Description</label>
                <input
                  value={newRole.description}
                  onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief summary of responsibilities"
                  maxLength={500}
                />
              </div>

              <div className="cms-field">
                <label>Initial Permissions ({newRole.permissionIds.length} selected)</label>
                <div className="permission-groups" style={{ maxHeight: 260, overflowY: "auto", padding: 4 }}>
                  {Object.entries(grouped).map(([module, entries]) => (
                    <div className="permission-group" key={module}>
                      <h3>{module.replaceAll("_", " ")}</h3>
                      {entries.map((permission) => (
                        <label key={permission.id} className="permission-option">
                          <input
                            type="checkbox"
                            checked={newRole.permissionIds.includes(String(permission.id))}
                            onChange={(e) =>
                              setNewRole((p) => ({
                                ...p,
                                permissionIds: e.target.checked
                                  ? [...p.permissionIds, String(permission.id)]
                                  : p.permissionIds.filter((id) => id !== String(permission.id))
                              }))
                            }
                          />
                          <span>
                            <strong>{permission.name}</strong>
                            <small>{permission.code}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="cms-modal-footer">
                <button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  <Plus size={15} /> {saving ? "Creating…" : "Create Role"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
