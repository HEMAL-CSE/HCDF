import { useState } from "react";
import { ArrowRight, Eye, EyeOff, HeartHandshake, LockKeyhole, Mail } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { canAccessPath, getDefaultRoute, useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading) return <div className="page-loading">Loading secure portal…</div>;
  if (user) return <Navigate to={getDefaultRoute(user)} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const signedInUser = await login(identifier.trim(), password);
      const fromPath = location.state?.from?.pathname;
      const target = fromPath && canAccessPath(signedInUser, fromPath) ? fromPath : getDefaultRoute(signedInUser);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in. Please check your credentials and try again.");
    } finally { setBusy(false); }
  }

  return (
    <div className="login-screen">
      <div className="login-visual">
        <div className="login-brand"><div className="brand-mark brand-mark-light">H</div><span>HUMAN CHARITY DIGNITY FOUNDATION</span></div>
        <div className="login-message">
          <div className="eyebrow light-eyebrow"><span /> ADMINISTRATION PORTAL</div>
          <h1>Purposeful work.<br /><em>Meaningful impact.</em></h1>
          <p>A secure workspace to manage the people, programmes and operations behind HCDF’s mission.</p>
          <div className="login-visual-footer"><HeartHandshake size={19} /><span>Serving people with dignity and compassion.</span></div>
        </div>
        <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
      </div>
      <div className="login-panel">
        <div className="login-form-wrap">
          <div className="eyebrow">WELCOME BACK</div>
          <h2>Sign in to HCDF</h2>
          <p className="muted intro-copy">Use your authorised account to continue to the management portal.</p>
          <form onSubmit={submit} className="login-form">
            <label htmlFor="identifier">Email address or phone number</label>
            <div className="input-wrap"><Mail size={18} /><input id="identifier" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Enter email or phone" required /></div>
            <label htmlFor="password">Password</label>
            <div className="input-wrap"><LockKeyhole size={18} /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            {error && <div className="alert alert-error">{error}</div>}
            <button className="primary-button login-submit" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"} <ArrowRight size={17} /></button>
          </form>
          <div className="login-security"><LockKeyhole size={15} /><span>Your session is protected with secure authentication.</span></div>
        </div>
        <div className="login-copyright">© {new Date().getFullYear()} Human Charity Dignity Foundation</div>
      </div>
    </div>
  );
}
