import { useEffect, useState } from "react";
import { ShieldCheck, KeyRound, ChevronRight } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canManage = hasPermission("permissions.manage");

  useEffect(() => {
    Promise.all([api.get("/admin/roles"), api.get("/admin/permissions")])
      .then(([r, p]) => { setRoles(r.data.data); setAllPermissions(p.data.data); })
      .catch((e) => setError(e.response?.data?.message || "Could not load role data."))
      .finally(() => setLoading(false));
  }, []);

  async function chooseRole(role) {
    setSelected(role); setError(""); setNotice("");
    try {
      const response = await api.get(`/admin/roles/${role.id}/permissions`);
      setPermissions(response.data.data.permissions);
      setSelectedIds(response.data.data.permissions.map((p) => String(p.id)));
    } catch (e) { setError(e.response?.data?.message || "Could not load role permissions."); }
  }

  async function save() {
    if (!selected) return;
    if (!window.confirm(`Replace permissions for ${selected.name}?`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api.put(`/admin/roles/${selected.id}/permissions`, { permission_ids: selectedIds });
      setNotice("Role permissions updated.");
      const [rolesResponse] = await Promise.all([api.get("/admin/roles"), chooseRole(selected)]);
      setRoles(rolesResponse.data.data);
    } catch (e) { setError(e.response?.data?.message || "Permission update failed."); }
    finally { setSaving(false); }
  }

  const grouped = allPermissions.reduce((acc, permission) => {
    (acc[permission.module] ||= []).push(permission);
    return acc;
  }, {});

  return <div className="page-stack">
    <div className="page-heading"><div><div className="eyebrow">ACCESS CONTROL</div><h1>Roles & permissions</h1><p>Review system roles and the permission codes assigned to each role.</p></div><div className="date-chip"><ShieldCheck size={16} /> Role-based access</div></div>
    {error && <div className="alert alert-error">{error}</div>}{notice && <div className="alert alert-success">{notice}</div>}
    {loading ? <div className="loading-card">Loading roles…</div> : <div className="role-management-grid">
      <section className="panel role-catalog"><div className="panel-heading"><div><h2>System roles</h2><p>{roles.length} configured roles</p></div></div>
        {roles.map((role) => <button key={role.id} onClick={() => chooseRole(role)} className={`role-catalog-item ${selected?.id === role.id ? "role-catalog-selected" : ""}`}><div className="role-avatar">{role.code}</div><div className="role-info"><strong>{role.name}</strong><span>{role.code} · {Number(role.user_count)} users</span></div><ChevronRight size={17} /></button>)}
      </section>
      <section className="panel permission-panel">
        {!selected ? <div className="empty-selection"><KeyRound size={30} /><h3>Select a role</h3><p>Choose a role to inspect its assigned permissions.</p></div> : <>
          <div className="panel-heading"><div><div className="eyebrow">{selected.code}</div><h2>{selected.name}</h2><p>{selected.description || "System role"}</p></div><span className="count-chip">{selectedIds.length} selected</span></div>
          {!canManage && <div className="alert alert-info">Read-only: your account does not have <code>permissions.manage</code>.</div>}
          {selected.code === "SA" && <div className="alert alert-info">The Super Admin permission set is protected against replacement.</div>}
          <div className="permission-groups">{Object.entries(grouped).map(([module, entries]) => <div className="permission-group" key={module}><h3>{module.replaceAll("_", " ")}</h3>{entries.map((permission) => <label key={permission.id} className="permission-option"><input type="checkbox" checked={selectedIds.includes(String(permission.id))} disabled={!canManage || selected.code === "SA"} onChange={(e) => setSelectedIds((current) => e.target.checked ? [...current, String(permission.id)] : current.filter((id) => id !== String(permission.id)))} /><span><strong>{permission.name}</strong><small>{permission.code}</small></span></label>)}</div>)}</div>
          {canManage && selected.code !== "SA" && <div className="permission-save"><button className="primary-button" onClick={save} disabled={saving}>Save permissions</button></div>}
        </>}
      </section>
    </div>}
  </div>;
}
