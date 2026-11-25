import { ArrowRight, HeartHandshake, ShieldCheck, UserRound, Users, Globe, Gift, UsersRound } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { getDefaultRoute, useAuth } from "../context/AuthContext.jsx";

// ==== Data ==== //
const programmes = [
  {
    icon: <HeartHandshake size={28} />,
    title: "Humanitarian Aid",
    desc: "Emergency relief – food, shelter and medical support for families in crisis.",
  },
  {
    icon: <Users size={28} />,
    title: "Community Development",
    desc: "Long‑term education, skills training and livelihood projects.",
  },
  {
    icon: <ShieldCheck size={28} />,
    title: "Dignity & Rights",
    desc: "Advocacy and legal aid for marginalised groups.",
  },
];

const impactCards = [
  {
    icon: <Globe size={24} />,
    title: "Global Reach",
    desc: "Operating in 12 countries, helping over 5,000 beneficiaries.",
  },
  {
    icon: <Gift size={24} />,
    title: "Volunteer Power",
    desc: "1,200 active volunteers delivering programmes on the ground.",
  },
  {
    icon: <UsersRound size={24} />,
    title: "Transparent Funding",
    desc: "100 % of donations are tracked and reported.",
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
      {/* ── TOP NAVIGATION ───────────────────── */}
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

      {/* ── NEWS TICKER ───────────────────────────── */}
      <div className="landing-ticker" aria-label="Latest news and updates">
        <span className="ticker-badge">Live Updates</span>
        <div className="ticker-content">
          <span className="ticker-item">Welcome new volunteers to HCDF – thank you for joining our mission! &nbsp;•&nbsp;</span>
          <span className="ticker-item">Upcoming community outreach event – sign up to make a difference. &nbsp;•&nbsp;</span>
          <span className="ticker-item">Transparent funding: 100% of donations are tracked and reported. &nbsp;•&nbsp;</span>
          <span className="ticker-item">Join our Member portal for personalized updates and resources. &nbsp;•&nbsp;</span>
        </div>
      </div>



      {/* ── HERO SECTION ─────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-bg-orb orb-one" />
        <div className="landing-hero-bg-orb orb-two" />
        <div className="landing-hero-content">
          <div className="eyebrow light-eyebrow"><span /> HUMAN CHARITY DIGNITY FOUNDATION</div>
          <h1 className="landing-hero-h1">
            Purposeful work.<br /><em>Meaningful impact.</em>
          </h1>
          <p className="landing-hero-sub">
            Serving people with dignity and compassion – connecting members, staff and volunteers around a shared mission.
          </p>
          <div className="landing-cta-group">
            <Link to="/member/login" className="primary-button landing-cta-primary">
              <UserRound size={18} /> Member Login <ArrowRight size={17} />
            </Link>
            <Link to="/register" className="landing-cta-secondary">Register as Member</Link>
          </div>
        </div>
      </section>

      {/* ── STAT BAR ─────────────────────────── */}
      <section className="landing-stats-bar">
        {stats.map((s) => (
          <div key={s.label} className="landing-stat">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── ABOUT SECTION ───────────────────── */}
      <section id="about" className="landing-section">
        <div className="landing-section-inner">
          <div className="eyebrow">WHO WE ARE</div>
          <h2 className="landing-section-h2">A foundation built on human dignity</h2>
          <p className="landing-section-body">
            The Human Charity Dignity Foundation (HCDF) exists to serve the most vulnerable members of our society – not just with material aid, but with respect, compassion and long‑term investment in their futures.
          </p>
        </div>
      </section>

      {/* ── PROGRAMMES SECTION ───────────────── */}
      <section id="programmes" className="landing-section landing-section-alt">
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

      {/* ── IMPACT SECTION (new cards) ─────── */}
      <section id="impact" className="landing-section">
        <div className="landing-section-inner">
          <div className="eyebrow">OUR IMPACT</div>
          <h2 className="landing-section-h2">Numbers that matter</h2>
          <div className="landing-cards">
            {impactCards.map((c) => (
              <div key={c.title} className="landing-card">
                <div className="landing-card-icon">{c.icon}</div>
                <h3 className="landing-card-title">{c.title}</h3>
                <p className="landing-card-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOIN CTA ─────────────────────────── */}
      <section id="join" className="landing-join">
        <div className="landing-join-inner">
          <h2 className="landing-join-h2">Ready to get involved?</h2>
          <p className="landing-join-sub">
            Join HCDF as a member to access your profile, stay updated on programmes, and contribute to our mission.
          </p>
          <div className="landing-cta-group">
            <Link to="/register" className="primary-button landing-cta-primary landing-cta-invert">
              Register as Member <ArrowRight size={17} />
            </Link>
            <Link to="/member/login" className="landing-cta-ghost">Already a member? Sign in</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────── */}
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
