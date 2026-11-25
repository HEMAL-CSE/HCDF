import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle, ChevronLeft, ChevronRight, Clock3, Mail, Phone,
  RefreshCw, Search, ShieldCheck, UserCheck, UserRound, UserRoundX, X
} from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MemberApprovalPage() {
  const { hasPermission } = useAuth();
  const canApprove = hasPermission("membership.approve");
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1, limit: 20 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(1); setQ(searchInput.trim()); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadMembers = useCallback(async (signal) => {
    setLoading(true); setError("");
    try {
      const response = await api.get("/admin/members/pending", {
        params: { page, limit: 20, q: q || undefined },
        signal
      });
      setItems(response.data.data.items);
      setPagination(response.data.data.pagination);
    } catch (e) {
      if (e.code === "ERR_CANCELED" || e.name === "CanceledError") return;
      setError(e.response?.data?.message || "Could not load pending members.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, q]);

  useEffect(() => {
    const controller = new AbortController();
    loadMembers(controller.signal);
    return () => controller.abort();
  }, [loadMembers]);

  function openMember(member) {
    setSelected(member);
    setShowRejectForm(false);
    setRejectReason("");
    setError("");
  }

  function closeModal() {
    setSelected(null);
    setShowRejectForm(false);
    setRejectReason("");
  }

  async function handleApprove() {
    if (!selected) return;
    if (!window.confirm(`Approve ${selected.full_name}'s membership and activate their account?`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await api.patch(`/admin/members/${selected.id}/approve`);
      setNotice(`${selected.full_name} has been approved and activated.`);
      closeModal();
      await loadMembers();
    } catch (e) {
      setError(e.response?.data?.message || "Approval failed.");
    } finally { setBusy(false); }
  }

  async function handleReject() {
    if (!selected) return;
    if (!window.confirm(`Reject ${selected.full_name}'s membership application?`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await api.patch(`/admin/members/${selected.id}/reject`, { reason: rejectReason || undefined });
      setNotice(`${selected.full_name}'s application has been rejected.`);
      closeModal();
      await loadMembers();
    } catch (e) {
      setError(e.response?.data?.message || "Rejection failed.");
    } finally { setBusy(false); }
  }

  const pendingCount = pagination.total;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">MEMBERSHIP</div>
          <h1>Member approval</h1>
          <p>Review pending membership applications and approve or reject new accounts.</p>
        </div>
        <button className="secondary-button" onClick={() => loadMembers()}><RefreshCw size={16} /> Refresh</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="approval-summary-strip">
        <div className="approval-stat">
          <div className="stat-icon amber"><Clock3 size={18} /></div>
          <div>
            <div className="approval-stat-value">{pendingCount}</div>
            <div className="approval-stat-label">Pending applications</div>
          </div>
        </div>
        <div className="approval-hint">
          <ShieldCheck size={17} />
          <span>Approved members receive <strong>ACTIVE</strong> status and can sign in immediately.</span>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box"><Search size={17} /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name, email or phone" /></div>
          <span className="result-count">{pendingCount} pending</span>
        </div>

        {loading ? <div className="loading-card">Loading pending applications…</div> : (
          <div className="approval-list">
            {items.map((member) => (
              <div className="approval-card" key={member.id}>
                <div className="approval-card-avatar"><UserRound size={22} /></div>
                <div className="approval-card-info">
                  <strong>{member.full_name}</strong>
                  <div className="approval-card-meta">
                    {member.email && <span><Mail size={12} /> {member.email}</span>}
                    {member.phone && <span><Phone size={12} /> {member.phone}</span>}
                  </div>
                  <div className="approval-card-date">Applied {member.created_at ? new Date(member.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</div>
                </div>
                <div className="approval-card-actions">
                  {canApprove && (
                    <>
                      <button className="approve-button" onClick={() => { openMember(member); }} title="Review details"><CheckCircle size={15} /> Review</button>
                    </>
                  )}
                  {!canApprove && <span className="status-pill status-pending">PENDING</span>}
                </div>
              </div>
            ))}
            {!items.length && <div className="empty-state approval-empty"><UserCheck size={28} /><p>No pending membership applications.</p></div>}
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

      {selected && (
        <div className="modal-backdrop" onClick={closeModal}>
          <section className="detail-modal approval-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <div className="eyebrow">MEMBERSHIP APPLICATION</div>
                <h2>{selected.full_name}</h2>
                <p>User ID #{selected.id}</p>
              </div>
              <button className="icon-button" onClick={closeModal} aria-label="Close"><X size={20} /></button>
            </div>

            <div className="detail-grid">
              <div><span>Email</span><strong>{selected.email || "Not provided"}</strong></div>
              <div><span>Phone</span><strong>{selected.phone || "Not provided"}</strong></div>
              <div><span>Status</span><strong><span className="status-pill status-pending">PENDING</span></strong></div>
              <div><span>Applied on</span><strong>{selected.created_at ? new Date(selected.created_at).toLocaleString() : "—"}</strong></div>
            </div>

            <div className="approval-info-box">
              <ShieldCheck size={17} />
              <div>
                <strong>Account role: Member (MB)</strong>
                <p>Approving will set account status to ACTIVE. The member will be able to sign in and access their member dashboard.</p>
              </div>
            </div>

            {canApprove && !showRejectForm && (
              <div className="approval-action-row">
                <button className="primary-button approve-action-btn" disabled={busy} onClick={handleApprove}>
                  <UserCheck size={16} /> Approve & activate
                </button>
                <button className="secondary-button reject-toggle-btn" disabled={busy} onClick={() => setShowRejectForm(true)}>
                  <UserRoundX size={16} /> Reject application
                </button>
              </div>
            )}

            {canApprove && showRejectForm && (
              <div className="reject-form">
                <h3><UserRoundX size={16} /> Reject this application</h3>
                <label htmlFor="reject-reason">Reason (optional)</label>
                <textarea
                  id="reject-reason"
                  className="reject-textarea"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Optionally provide a reason for rejection…"
                  rows={3}
                  maxLength={500}
                />
                <div className="reject-actions">
                  <button className="reject-confirm-btn" disabled={busy} onClick={handleReject}>
                    <UserRoundX size={15} /> Confirm rejection
                  </button>
                  <button className="secondary-button" disabled={busy} onClick={() => setShowRejectForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {!canApprove && (
              <div className="info-strip compact-info">
                <ShieldCheck size={18} />
                <div><strong>Read-only access</strong><p>Your account does not have <code>membership.approve</code> permission.</p></div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
