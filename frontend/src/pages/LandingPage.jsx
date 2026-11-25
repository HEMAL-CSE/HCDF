import { ArrowRight, HeartHandshake, ShieldCheck, UserRound, Users } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { getDefaultRoute, useAuth } from "../context/AuthContext.jsx";

const programmes = [
  {
    icon: <HeartHandshake size={26} />,
    title: "Humanitarian Aid",
    desc: "Direct relief to families and individuals facing hardship — food, shelter, and emergency support.",
  },
  {
    icon: <Users size={26} />,
    title: "Community Development",
    desc: "Long-term programmes that build skills, provide education, and strengthen local communities.",
  },
  {
    icon: <ShieldCheck size={26} />,
    title: "Dignity & Rights",
    desc: "Advocating for the rights of marginalised groups and ensuring every person is treated with dignity.",
  },
];

const stats = [
  { value: "5,000+", label: "Members Served" },
  { value: "12", label: "Active Programmes" },
  { value: "8", label: "Partner Organisations" },
  { value: "100%", label: "Transparency" },
];

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading…</div>;
  if (user) return <Navigate to={getDefaultRoute(user)} replace />;

  return (
    <div className="landing-root">
      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <div className="brand-mark">H</div>
            <span className="landing-nav-name">HCDF</span>
          </div>
          <nav className="landing-nav-links">
            <Link to="/register" className="landing-nav-link">Register</Link>
            <Link to="/member/login" className="landing-nav-link">Member Login</Link>
            <Link to="/login" className="landing-nav-btn">Staff Sign In <ArrowRight size={15} /></Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-bg-orb orb-one" />
        <div className="landing-hero-bg-orb orb-two" />
        <div className="landing-hero-content">
          <div className="eyebrow light-eyebrow"><span /> HUMAN CHARITY DIGNITY FOUNDATION</div>
          <h1 className="landing-hero-h1">
            Purposeful work.<br /><em>Meaningful impact.</em>
          </h1>
          <p className="landing-hero-sub">
            Serving people with dignity and compassion — connecting members, staff and volunteers
            around a shared mission to uplift communities.
          </p>
          <div className="landing-cta-group">
            <Link to="/member/login" className="primary-button landing-cta-primary">
              <UserRound size={18} /> Member Login <ArrowRight size={17} />
            </Link>
            <Link to="/register" className="landing-cta-secondary">
              Register as Member
            </Link>
          </div>
          <div className="landing-hero-footer">
            <HeartHandshake size={16} />
            <span>Serving people with dignity and compassion.</span>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="landing-stats-bar">
        {stats.map((s) => (
          <div key={s.label} className="landing-stat">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── ABOUT ────────────────────────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="eyebrow">WHO WE ARE</div>
          <h2 className="landing-section-h2">A foundation built on human dignity</h2>
          <p className="landing-section-body">
            The Human Charity Dignity Foundation (HCDF) exists to serve the most vulnerable
            members of our society — not just with material aid, but with respect, compassion
            and long-term investment in their futures. Our work spans emergency relief, community
            development, and rights advocacy, all guided by the belief that every person deserves
            to live with dignity.
          </p>
        </div>
      </section>

      {/* ── PROGRAMMES ───────────────────────────────────────────── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <div className="eyebrow">OUR PROGRAMMES</div>
          <h2 className="landing-section-h2">How we make a difference</h2>
          <div className="landing-cards">
            {programmes.map((p) => (
              <div key={p.title} className="landing-card">
                <div className="landing-card-icon">{p.icon}</div>
                <h3 className="landing-card-title">{p.title}</h3>
                <p className="landing-card-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOIN CTA ─────────────────────────────────────────────── */}
      <section className="landing-join">
        <div className="landing-join-inner">
          <h2 className="landing-join-h2">Ready to get involved?</h2>
          <p className="landing-join-sub">
            Join HCDF as a member to access your profile, stay updated on programmes, and
            contribute to our mission.
          </p>
          <div className="landing-cta-group">
            <Link to="/register" className="primary-button landing-cta-primary landing-cta-invert">
              Register as Member <ArrowRight size={17} />
            </Link>
            <Link to="/member/login" className="landing-cta-ghost">
              Already a member? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <div className="brand-mark brand-mark-sm">H</div>
          <span>Human Charity Dignity Foundation</span>
        </div>
        <div className="landing-footer-links">
          <Link to="/member/login">Member Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/login" className="landing-footer-staff">Staff / Admin Sign In</Link>
        </div>
        <p className="landing-footer-copy">© {new Date().getFullYear()} Human Charity Dignity Foundation. All rights reserved.</p>
      </footer>
    </div>
  );
}
