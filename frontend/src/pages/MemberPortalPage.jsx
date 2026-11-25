import { useEffect, useState } from "react";
import { BadgeCheck, CalendarDays, HandCoins, Mail, Phone, Receipt, Save, ShieldCheck, UserCheck, UserRound } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MemberPortalPage() {
  const { hasPermission, refreshCurrentUser } = useAuth();
  const canUpdate = hasPermission("profile.update_own");
  const canViewDonations = hasPermission("donations.view_own");
  const canViewReceipts = hasPermission("receipts.view_own");

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api.get("/member/profile")
      .then((res) => {
        const data = res.data.data;
        setProfile(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load your member profile."))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length > 150) {
      setError("Full name is required and must not exceed 150 characters.");
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch("/member/profile", {
        full_name: trimmedName,
        phone: phone.trim() || null
      });
      setProfile((prev) => ({ ...prev, ...response.data.data }));
      setNotice("Your profile has been updated.");
      await refreshCurrentUser();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">MEMBER PORTAL</div>
          <h1>Welcome, {profile?.full_name?.split(" ")[0] || "Member"}.</h1>
          <p>Manage your HCDF membership profile and review your account details.</p>
        </div>
        <div className="date-chip"><BadgeCheck size={16} /> Member account</div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {loading ? <div className="loading-card">Loading member profile…</div> : profile && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon green"><UserCheck size={20} /></div>
              <div className="stat-label">Membership status</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{profile.status}</div>
              <div className="stat-hint">Verified active account</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><ShieldCheck size={20} /></div>
              <div className="stat-label">Account role</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{(profile.roles || []).join(", ") || "MB"}</div>
              <div className="stat-hint">Member self-service access</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber"><CalendarDays size={20} /></div>
              <div className="stat-label">Member since</div>
              <div className="stat-value" style={{ fontSize: 20 }}>
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </div>
              <div className="stat-hint">Registration date</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><UserRound size={20} /></div>
              <div className="stat-label">Member ID</div>
              <div className="stat-value" style={{ fontSize: 22 }}>#{profile.id}</div>
              <div className="stat-hint">Unique HCDF identifier</div>
            </div>
          </div>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>My profile</h2>
                <p>Keep your contact information up to date.</p>
              </div>
              <UserRound size={20} className="panel-heading-icon" />
            </div>

            <form onSubmit={saveProfile} className="member-profile-form">
              <div className="member-form-grid">
                <div>
                  <label htmlFor="member-fullname">Full name</label>
                  <div className="input-wrap">
                    <UserRound size={17} />
                    <input
                      id="member-fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!canUpdate || saving}
                      maxLength={150}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="member-phone">Phone number</label>
                  <div className="input-wrap">
                    <Phone size={17} />
                    <input
                      id="member-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!canUpdate || saving}
                      maxLength={30}
                      placeholder="Optional phone number"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="member-email">Email address</label>
                  <div className="input-wrap input-wrap-readonly">
                    <Mail size={17} />
                    <input id="member-email" value={profile.email || "Not provided"} readOnly disabled />
                  </div>
                </div>

                <div>
                  <label>Last sign in</label>
                  <div className="input-wrap input-wrap-readonly">
                    <CalendarDays size={17} />
                    <input value={profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : "Current session"} readOnly disabled />
                  </div>
                </div>
              </div>

              {canUpdate && (
                <div className="permission-save">
                  <button className="primary-button" type="submit" disabled={saving}>
                    <Save size={15} /> {saving ? "Saving…" : "Save profile"}
                  </button>
                </div>
              )}
            </form>
          </section>

          <div className="member-cards-row">
            {canViewDonations && (
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>My donations</h2>
                    <p>Your recorded contributions to HCDF</p>
                  </div>
                  <HandCoins size={20} className="panel-heading-icon" />
                </div>
                <div className="empty-state">No donations have been recorded on your account yet.</div>
              </section>
            )}

            {canViewReceipts && (
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>My receipts</h2>
                    <p>Downloadable donation and membership receipts</p>
                  </div>
                  <Receipt size={20} className="panel-heading-icon" />
                </div>
                <div className="empty-state">No receipts are available yet.</div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
