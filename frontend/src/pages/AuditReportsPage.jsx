import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const AUDIT_CAPABILITIES = [
  { code: "audit.view", label: "View Audit Logs", desc: "Inspect system activity, login, approval, and RBAC audit trails." },
  { code: "reports.view", label: "View Authorised Reports", desc: "Access read-only operational, membership, and financial summaries." },
  { code: "finance.view", label: "View Finance Reports", desc: "Review financial statements and ledger reports (read-only)." },
  { code: "donations.view", label: "View Donations", desc: "Inspect donation records for compliance verification." }
];

export default function AuditReportsPage() {
  const { hasPermission } = useAuth();

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">COMPLIANCE &amp; OVERSIGHT</div>
          <h1>Audit &amp; reports</h1>
          <p>Read-only oversight workspace for auditing and reviewing authorised HCDF reports.</p>
        </div>
        <div className="date-chip"><FileText size={16} /> Read-only oversight</div>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Authorised audit capabilities</h2>
            <p>Permissions active on your account for compliance and reporting</p>
          </div>
          <ShieldCheck size={20} className="panel-heading-icon" />
        </div>

        <div className="permission-table-list">
          {AUDIT_CAPABILITIES.map((cap) => {
            const granted = hasPermission(cap.code);
            return (
              <div className="permission-table-row" key={cap.code} style={{ opacity: granted ? 1 : 0.55 }}>
                <div className="permission-id">
                  <CheckCircle2 size={16} style={{ color: granted ? "#176b4c" : "#9aa69f" }} />
                </div>
                <div className="permission-row-main">
                  <strong>{cap.label}</strong>
                  <code>{cap.code}</code>
                  <div style={{ fontSize: 11, color: "#687a70", marginTop: 3 }}>{cap.desc}</div>
                </div>
                <span className={`status-pill ${granted ? "status-active" : "status-suspended"}`}>
                  {granted ? "GRANTED" : "RESTRICTED"}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
