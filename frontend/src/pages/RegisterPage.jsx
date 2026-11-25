import { useState } from "react";
import { ArrowRight, Eye, EyeOff, HeartHandshake, LockKeyhole, Mail, Phone, User, CheckCircle } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  if (loading) return <div className="page-loading">Loading secure portal…</div>;
  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("Full name is required.");
      return;
    }
    if (trimmedName.length > 150) {
      setError("Full name must not exceed 150 characters.");
      return;
    }
    if (!trimmedEmail && !trimmedPhone) {
      setError("Please provide an email address or phone number.");
      return;
    }
    if (password.length < 12) {
      setError("Password must contain at least 12 characters.");
      return;
    }
    if (password.length > 128) {
      setError("Password must not exceed 128 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        full_name: trimmedName,
        password
      };
      if (trimmedEmail) payload.email = trimmedEmail;
      if (trimmedPhone) payload.phone = trimmedPhone;

      const response = await api.post("/auth/register", payload);
      setSuccess(response.data?.data || { status: "PENDING" });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-visual">
        <div className="login-brand"><div className="brand-mark brand-mark-light">H</div><span>HUMAN CHARITY DIGNITY FOUNDATION</span></div>
        <div className="login-message">
          <div className="eyebrow light-eyebrow"><span /> MEMBERSHIP REGISTRATION</div>
          <h1>Join our<br /><em>mission today.</em></h1>
          <p>Create your account to become part of HCDF and contribute to meaningful, dignity-driven programmes.</p>
          <div className="login-visual-footer"><HeartHandshake size={19} /><span>Serving people with dignity and compassion.</span></div>
        </div>
        <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
      </div>

      <div className="login-panel">
        <div className="login-form-wrap">
          {success ? (
            <div className="register-success">
              <div className="success-icon"><CheckCircle size={36} /></div>
              <div className="eyebrow">REGISTRATION SUBMITTED</div>
              <h2>Application received</h2>
              <p className="muted intro-copy">
                Your membership account has been created and is <strong>pending approval</strong> by an HCDF administrator.
                You will be able to sign in once your account is activated.
              </p>
              <div className="register-success-details">
                <div><span>Account status</span><strong className="status-pill status-pending">PENDING</strong></div>
                <div><span>Assigned role</span><strong>Member (MB)</strong></div>
              </div>
              <Link className="primary-button login-submit" to="/login">Continue to sign in <ArrowRight size={17} /></Link>
            </div>
          ) : (
            <>
              <div className="eyebrow">GET STARTED</div>
              <h2>Create your account</h2>
              <p className="muted intro-copy">Fill in your details to register for an HCDF membership account.</p>
              <form onSubmit={submit} className="login-form">
                <label htmlFor="reg-fullname">Full name <span className="field-required">*</span></label>
                <div className="input-wrap"><User size={18} /><input id="reg-fullname" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" required /></div>

                <label htmlFor="reg-email">Email address</label>
                <div className="input-wrap"><Mail size={18} /><input id="reg-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" /></div>

                <label htmlFor="reg-phone">Phone number</label>
                <div className="input-wrap"><Phone size={18} /><input id="reg-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" /></div>

                <div className="field-hint">Provide at least an email address or phone number.</div>

                <label htmlFor="reg-password">Password <span className="field-required">*</span></label>
                <div className="input-wrap"><LockKeyhole size={18} /><input id="reg-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 12 characters" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>

                <label htmlFor="reg-confirm">Confirm password <span className="field-required">*</span></label>
                <div className="input-wrap"><LockKeyhole size={18} /><input id="reg-confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required /><button type="button" className="password-toggle" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password" : "Show password"}>{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>

                {error && <div className="alert alert-error">{error}</div>}
                <button className="primary-button login-submit" type="submit" disabled={busy}>{busy ? "Submitting…" : "Create account"} <ArrowRight size={17} /></button>
              </form>
              <div className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></div>
            </>
          )}
        </div>
        <div className="login-copyright">© {new Date().getFullYear()} Human Charity Dignity Foundation</div>
      </div>
    </div>
  );
}
