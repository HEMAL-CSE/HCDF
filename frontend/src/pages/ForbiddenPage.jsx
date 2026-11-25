import { LogOut, ShieldAlert } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getDefaultRoute, useAuth } from "../context/AuthContext.jsx";

export default function ForbiddenPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fallbackPath = getDefaultRoute(user);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="forbidden-page">
      <div className="forbidden-icon"><ShieldAlert size={30} /></div>
      <div className="eyebrow">ACCESS RESTRICTED</div>
      <h1>You don’t have permission</h1>
      <p>This area is not available to your account. If you believe you need access, contact an authorised HCDF administrator.</p>
      <div className="inline-controls" style={{ justifyContent: "center" }}>
        {fallbackPath !== "/forbidden" && <Link className="primary-button" to={fallbackPath}>Return to workspace</Link>}
        <button type="button" className="secondary-button" onClick={handleLogout}><LogOut size={16} /> Sign out</button>
      </div>
    </div>
  );
}
