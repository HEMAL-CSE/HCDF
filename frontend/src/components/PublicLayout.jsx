import { useEffect, useState } from "react";
import { ArrowRight, Clock, Languages, Menu, X } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { api } from "../api/client.js";
import { getDefaultRoute, useAuth } from "../context/AuthContext.jsx";
import {
  FALLBACK_HOME,
  PUBLIC_COPY,
  SmartActionLink,
} from "../utils/publicHome.jsx";
import Websoft from "../assets/WEBSOFTlogo.jpg";

export default function PublicLayout({
  showUtilityBar = true,
  showTicker = true,
  customNavItems = null,
}) {
  const { user } = useAuth();
  const [homeData, setHomeData] = useState(FALLBACK_HOME);
  const [lang, setLang] = useState(
    () => localStorage.getItem("hcdf_lang") || "en",
  );
  const [now, setNow] = useState(() => new Date());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const copy = PUBLIC_COPY[lang] || PUBLIC_COPY.en;

  useEffect(() => {
    localStorage.setItem("hcdf_lang", lang);
  }, [lang]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get("/public/home")
      .then((res) => {
        if (!active) return;
        const data = res.data?.data;
        if (data) {
          setHomeData({
            banners: data.banners?.length
              ? data.banners
              : FALLBACK_HOME.banners,
            about: data.about?.length ? data.about : FALLBACK_HOME.about,
            programmes: data.programmes?.length
              ? data.programmes
              : FALLBACK_HOME.programmes,
            impact: data.impact?.length ? data.impact : FALLBACK_HOME.impact,
            ticker: data.ticker?.length ? data.ticker : FALLBACK_HOME.ticker,
          });
        }
      })
      .catch(() => {
        // Keep graceful fallback defaults
      });
    return () => {
      active = false;
    };
  }, []);

  const navItems = customNavItems || [
    { to: "/home", label: copy.navHome },
    { to: "/about", label: copy.navAbout },
    { to: "/programmes", label: copy.navProgrammes },
    { to: "/impact", label: copy.navImpact },
    { to: "/join", label: copy.navJoin },
  ];

  const formattedDateTime = new Intl.DateTimeFormat(
    lang === "bn" ? "bn-BD" : "en-US",
    {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  ).format(now);

  const tickerItems = homeData.ticker || FALLBACK_HOME.ticker;

  return (
    <div className="landing-root">
      {/* ── TOP UTILITY BAR · ORG NAME LEFT · LIVE CLOCK RIGHT ──── */}
      {showUtilityBar && (
        <div className="hcdf-utility-bar">
          <div className="hcdf-container hcdf-utility-inner">
            <span className="hcdf-utility-org">{copy.brandFull}</span>
            <span className="hcdf-utility-clock" aria-live="polite">
              <Clock size={13} />
              <span>{formattedDateTime}</span>
            </span>
          </div>
        </div>
      )}

      {/* ── MAIN STICKY NAVBAR (SINGLE-LINE HCDF + BN/EN TOGGLE) ─── */}
      <header className="landing-nav">
        <div className="hcdf-container landing-nav-inner">
          <Link to="/home" className="landing-nav-brand">
            <div className="brand-mark">H</div>
            <span className="landing-nav-name">HCDF</span>
          </Link>

          <nav className="hcdf-anchor-links" aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `hcdf-nav-item ${isActive ? "active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="landing-nav-right">
            <div className="landing-nav-links">
              <Link to="/member/login" className="landing-nav-link">
                {copy.memberLogin}
              </Link>
              <Link to="/register" className="landing-nav-btn">
                {copy.register} <ArrowRight size={14} />
              </Link>
              {user ? (
                <Link
                  to={getDefaultRoute(user)}
                  className="landing-nav-staff-pill"
                >
                  {copy.dashboard}
                </Link>
              ) : (
                <Link to="/login" className="landing-nav-staff-pill">
                  {copy.staffSignIn}
                </Link>
              )}
            </div>

            <button
              type="button"
              className="hcdf-lang-toggle"
              onClick={() => setLang((prev) => (prev === "en" ? "bn" : "en"))}
              aria-label="Toggle Bangla and English language"
              title="Switch Language (English / বাংলা)"
            >
              <Languages size={14} />
              <span className={lang === "en" ? "active" : ""}>EN</span>
              <span className="divider">/</span>
              <span className={lang === "bn" ? "active" : ""}>বাংলা</span>
            </button>

            <button
              type="button"
              className="landing-mobile-toggle"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileNavOpen((prev) => !prev)}
            >
              {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="landing-mobile-drawer">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  isActive ? "mobile-nav-active" : ""
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="landing-mobile-actions">
              <Link to="/member/login" onClick={() => setMobileNavOpen(false)}>
                {copy.memberLogin}
              </Link>
              <Link
                to="/register"
                className="landing-mobile-cta"
                onClick={() => setMobileNavOpen(false)}
              >
                {copy.register}
              </Link>
              <Link
                to={user ? getDefaultRoute(user) : "/login"}
                onClick={() => setMobileNavOpen(false)}
              >
                {user ? copy.dashboard : copy.staffSignIn}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── CONTRASTING LIVE UPDATES TICKER ───────────────────────── */}
      {showTicker && (
        <div className="landing-ticker" aria-label="Latest news and updates">
          <div className="hcdf-container landing-ticker-inner">
            <span className="ticker-badge">
              <span className="ticker-dot" /> {copy.liveUpdates}
            </span>
            <div className="ticker-viewport">
              <div className="ticker-track">
                {[...tickerItems, ...tickerItems].map((item, idx) => (
                  <span key={`${item.id}-${idx}`} className="ticker-item">
                    {item.ctaLink ? (
                      <SmartActionLink
                        to={item.ctaLink}
                        className="ticker-link"
                      >
                        {item.title}
                      </SmartActionLink>
                    ) : (
                      item.title
                    )}
                    <span className="ticker-sep">•</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PAGE CONTENT ──────────────────────────────────────────── */}
      <main className="public-main-wrap">
        <Outlet context={{ homeData, lang, setLang, copy }} />
      </main>

      {/* ── STRUCTURED FOOTER + WEB SOFT BD ATTRIBUTION ───────────── */}
      <footer className="hcdf-footer">
        <div className="hcdf-container hcdf-footer-grid">
          <div className="hcdf-footer-col">
            <div
              className="landing-footer-brand"
              style={{ justifyContent: "flex-start" }}
            >
              <div className="brand-mark brand-mark-sm">H</div>
              <span>{copy.brandFull}</span>
            </div>
            <p className="hcdf-footer-about">{copy.footerAbout}</p>
          </div>

          <div className="hcdf-footer-col">
            <h4>{copy.quickLinks}</h4>
            <ul>
              <li>
                <Link to="/home">{copy.navHome}</Link>
              </li>
              <li>
                <Link to="/about">{copy.navAbout}</Link>
              </li>
              <li>
                <Link to="/programmes">{copy.navProgrammes}</Link>
              </li>
              <li>
                <Link to="/impact">{copy.navImpact}</Link>
              </li>
              <li>
                <Link to="/join">{copy.navJoin}</Link>
              </li>
            </ul>
          </div>

          <div className="hcdf-footer-col">
            <h4>{copy.portalsAccess}</h4>
            <ul>
              <li>
                <Link to="/member/login">{copy.memberLogin}</Link>
              </li>
              <li>
                <Link to="/register">{copy.registerMember}</Link>
              </li>
              <li>
                <Link to="/login">{copy.staffSignIn}</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="hcdf-footer-bottom">
  <div className="hcdf-container hcdf-footer-bottom-inner">
    <strong>
      © {new Date().getFullYear()} {copy.brandFull} (HCDF). {copy.rightsReserved}
    </strong>
    <div className="wsbd-credit">
      <span>
        {copy.developedBy} <strong>Web Soft BD</strong>
      </span>
      <a
        href="https://www.websoftbd.net/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Web Soft BD"
        className="wsbd-footer-link"
      >
        <img
          src={Websoft}
          alt="Web Soft BD"
          className="wsbd-footer-logo"
        />
      </a>
    </div>
  </div>
</div>
      </footer>
    </div>
  );
}
