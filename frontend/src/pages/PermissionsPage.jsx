import { useEffect, useState } from "react";
import { BadgeCheck, Search } from "lucide-react";
import { api } from "../api/client.js";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/admin/permissions").then((r) => setPermissions(r.data.data)).catch((e) => setError(e.response?.data?.message || "Could not load permissions.")).finally(() => setLoading(false));
  }, []);
  const filtered = permissions.filter((p) => `${p.code} ${p.name} ${p.module}`.toLowerCase().includes(q.toLowerCase()));
  return <div className="page-stack">
    <div className="page-heading"><div><div className="eyebrow">SYSTEM ACCESS CATALOG</div><h1>Permissions</h1><p>Reference list of permission codes configured in the HCDF database.</p></div><div className="date-chip"><BadgeCheck size={16} /> {permissions.length} permissions</div></div>
    {error && <div className="alert alert-error">{error}</div>}
    <section className="panel"><div className="toolbar"><div className="search-box"><Search size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search permission code, name or module" /></div><span className="result-count">{filtered.length} results</span></div>
      {loading ? <div className="loading-card">Loading permissions…</div> : <div className="permission-table-list">{filtered.map((p) => <div className="permission-table-row" key={p.id}><div className="permission-id">#{p.id}</div><div className="permission-row-main"><strong>{p.name}</strong><code>{p.code}</code></div><span className="module-tag">{p.module}</span></div>)}{!filtered.length && <div className="empty-state">No matching permissions.</div>}</div>}
    </section>
  </div>;
}
