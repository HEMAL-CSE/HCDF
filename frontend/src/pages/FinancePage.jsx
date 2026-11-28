import { CheckCircle2, ShieldCheck, Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const FINANCE_CAPABILITIES = [
  { code: "donations.view", label: "View Donations", desc: "Inspect incoming donations and donor transaction records." },
  { code: "donations.verify", label: "Verify Manual Donations", desc: "Review and verify bank/offline donation submissions." },
  { code: "donations.refund", label: "Process Authorised Refunds", desc: "Execute approved donation refund requests." },
  { code: "finance.view", label: "View Finance Reports", desc: "Access fund balances, ledger summaries, and financial statements." },
  { code: "finance.reconcile", label: "Reconcile Financial Records", desc: "Match gateway settlements against internal HCDF accounts." }
];

export default function FinancePage() {
  const { hasPermission } = useAuth();

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">FINANCE WORKSPACE</div>
          <h1>Finance &amp; donations</h1>
          <p>Manage donations, verification, and financial reconciliation according to your role permissions.</p>
        </div>
        <div className="date-chip"><Wallet size={16} /> Finance module</div>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Authorised finance capabilities</h2>
            <p>Actions enabled for your account in this module</p>
          </div>
          <ShieldCheck size={20} className="panel-heading-icon" />
        </div>

        <div className="permission-table-list">
          {FINANCE_CAPABILITIES.map((cap) => {
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
