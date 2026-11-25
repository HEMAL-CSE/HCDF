import { useState } from "react";
import { ArrowRight, Eye, EyeOff, HeartHandshake, LockKeyhole, Mail, Users } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { canAccessPath, getDefaultRoute, useAuth } from "../context/AuthContext.jsx";

export default function MemberLoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading) return <div className="page-loading">Loading member portal…</div>;
  if (user) return <Navigate to={getDefaultRoute(user)} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const signedInUser = await login(identifier.trim(), password);
      const fromPath = location.state?.from?.pathname;
      const target = fromPath && canAccessPath(signedInUser, fromPath)
        ? fromPath
        : signedInUser?.permissions?.includes("profile.view_own")
          ? "/member"
          : getDefaultRoute(signedInUser);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in. Please check your credentials and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-visual">
        <div className="login-brand"><div className="brand-mark brand-mark-light">H</div><span>HUMAN CHARITY DIGNITY FOUNDATION</span></div>
        <div className="login-message">
          <div className="eyebrow light-eyebrow"><span /> MEMBER PORTAL</div>
          <h1>Welcome back,<br /><em>valued member.</em></h1>
          <p>Access your HCDF membership profile, check your account status and stay connected with our programmes.</p>
          <div className="login-visual-footer"><HeartHandshake size={19} /><span>Serving people with dignity and compassion.</span></div>
        </div>
        <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
      </div>
      <div className="login-panel">
        <div className="login-form-wrap">
          <div className="eyebrow"><Users size={12} style={{ display: "inline", verticalAlign: "-1px", marginRight: 5 }} />MEMBER SIGN IN</div>
          <h2>Member login</h2>
          <p className="muted intro-copy">Sign in with your approved member email address or phone number.</p>
          <form onSubmit={submit} className="login-form">
            <label htmlFor="member-identifier">Email address or phone number</label>
            <div className="input-wrap"><Mail size={18} /><input id="member-identifier" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Enter email or phone" required /></div>
            <label htmlFor="member-password">Password</label>
            <div className="input-wrap">
              <LockKeyhole size={18} />
              <input id="member-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <button className="primary-button login-submit" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in to member portal"} <ArrowRight size={17} /></button>
          </form>
          <div className="login-security"><LockKeyhole size={15} /><span>Pending accounts require administrator approval before sign in.</span></div>
          <div className="auth-switch">Not a member yet? <Link to="/register">Register here</Link></div>
          <div className="auth-switch" style={{ marginTop: 8 }}>Staff or Admin? <Link to="/login">Admin sign in</Link></div>
          <div className="auth-switch" style={{ marginTop: 8 }}><Link to="/home">← Back to home</Link></div>
        </div>
        <div className="login-copyright">© {new Date().getFullYear()} Human Charity Dignity Foundation</div>
      </div>
    </div>
  );
}
